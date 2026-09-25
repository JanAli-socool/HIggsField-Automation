import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CreditCosts, ApiResponse, ApiError, PaginatedResponse } from "../../../src/types/api.js";
import prisma from "../../../src/lib/db/client.js";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../src/lib/auth/config.js";

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getUserId(req: VercelRequest): string | null {
  return req.headers["x-user-id"] as string || null;
}

function errorResponse(res: VercelResponse, code: string, message: string, status: number, requestId: string) {
  const error: ApiError = { code, message, request_id: requestId };
  return res.status(status).json({ error, request_id: requestId } as ApiResponse<never>);
}

function successResponse<T>(res: VercelResponse, data: T, requestId: string, status = 200) {
  return res.status(status).json({ data, request_id: requestId } as ApiResponse<T>);
}

const CREDIT_COSTS: CreditCosts = {
  image_generation: 1,
  image_editing: 2,
  video_preview: 5,
  standard_video: 10,
  premium_video: 20,
  upscaling: 3,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id || getUserId(req);

  if (!userId) {
    return errorResponse(res, "UNAUTHORIZED", "Authentication required", 401, requestId);
  }

  try {
    switch (req.method) {
      case "GET":
        if (req.query.costs === "true") {
          return successResponse(res, CREDIT_COSTS, requestId);
        }
        return await handleGetBalance(req, res, requestId, userId);
      case "POST":
        return await handleTransaction(req, res, requestId, userId);
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error(`[${requestId}] Credits error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", "An unexpected error occurred", 500, requestId);
  }
}

async function handleGetBalance(req: VercelRequest, res: VercelResponse, requestId: string, userId: string) {
  let balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    balance = await prisma.creditBalance.create({
      data: { userId, balance: 100, totalPurchased: 100, totalConsumed: 0 },
    });
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size as string) || 20));

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ]);

  const response = {
    balance: balance.balance,
    total_purchased: balance.totalPurchased,
    total_consumed: balance.totalConsumed,
    transactions: {
      data: transactions,
      total,
      page,
      page_size: pageSize,
      has_more: page * pageSize < total,
    } as PaginatedResponse<any>,
  };

  return successResponse(res, response, requestId);
}

async function handleTransaction(req: VercelRequest, res: VercelResponse, requestId: string, userId: string) {
  const { amount, type, description, generationId } = req.body as {
    amount: number;
    type: "purchase" | "consumption" | "refund" | "bonus";
    description?: string;
    generationId?: string;
  };

  if (!amount || amount <= 0) {
    return errorResponse(res, "INVALID_AMOUNT", "Amount must be positive", 400, requestId);
  }

  if (!["purchase", "consumption", "refund", "bonus"].includes(type)) {
    return errorResponse(res, "INVALID_TYPE", "Invalid transaction type", 400, requestId);
  }

  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    return errorResponse(res, "BALANCE_NOT_FOUND", "Credit balance not found", 404, requestId);
  }

  const newBalance = type === "consumption" ? balance.balance - amount : balance.balance + amount;

  if (newBalance < 0) {
    return errorResponse(res, "INSUFFICIENT_CREDITS", "Insufficient credits", 402, requestId);
  }

  const [updatedBalance, transaction] = await prisma.$transaction([
    prisma.creditBalance.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalPurchased: type === "purchase" ? balance.totalPurchased + amount : balance.totalPurchased,
        totalConsumed: type === "consumption" ? balance.totalConsumed + amount : balance.totalConsumed,
      },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        balanceId: balance.id,
        amount,
        type,
        description,
        generationId,
      },
    }),
  ]);

  return successResponse(res, {
    balance: updatedBalance.balance,
    total_purchased: updatedBalance.totalPurchased,
    total_consumed: updatedBalance.totalConsumed,
    transaction,
  }, requestId, 201);
}