import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../src/types/api.js";
import bcrypt from "bcryptjs";
import prisma from "../../src/lib/db/client.js";

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function errorResponse(res: VercelResponse, code: string, message: string, status: number, requestId: string) {
  const error: ApiError = { code, message, request_id: requestId };
  return res.status(status).json({ error, request_id: requestId } as ApiResponse<never>);
}

function successResponse<T>(res: VercelResponse, data: T, requestId: string, status = 200) {
  return res.status(status).json({ data, request_id: requestId } as ApiResponse<T>);
}

function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
  }

  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    if (!name || !name.trim()) {
      return errorResponse(res, "INVALID_NAME", "Name is required", 400, requestId);
    }

    if (!email || !email.includes("@")) {
      return errorResponse(res, "INVALID_EMAIL", "Valid email is required", 400, requestId);
    }

    if (!password || password.length < 8) {
      return errorResponse(res, "INVALID_PASSWORD", "Password must be at least 8 characters", 400, requestId);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(res, "EMAIL_EXISTS", "An account with this email already exists", 409, requestId);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
      },
    });

    return successResponse(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
    }, requestId, 201);
  } catch (error) {
    console.error(`[${requestId}] Registration error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", "Registration failed", 500, requestId);
  }
}