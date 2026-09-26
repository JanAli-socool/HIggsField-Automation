import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../src/types/api.js";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  if (req.method !== "POST") {
    return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
  }

  try {
    const { id, status, output, error, logs: _logs } = req.body as any;

    if (!id) {
      return errorResponse(res, "MISSING_ID", "Missing prediction ID", 400, requestId);
    }

    const job = await prisma.generation.findUnique({
      where: { providerJobId: id },
    });

    if (!job) {
      console.warn(`[${requestId}] Job not found for provider ID: ${id}`);
      return successResponse(res, { received: true }, requestId);
    }

    const statusMap: Record<string, string> = {
      starting: "preparing_model",
      processing: "generating",
      succeeded: "completed",
      failed: "failed",
      canceled: "cancelled",
    };

    const newStatus = statusMap[status] || job.status;
    const progress = status === "succeeded" ? 100 : status === "processing" ? 50 : job.progress;

    const updateData: any = {
      status: newStatus,
      progress,
      updatedAt: new Date(),
    };

    if (status === "succeeded" && output) {
      updateData.outputAssetUrls = Array.isArray(output) ? output : [output];
      updateData.thumbnailUrls = Array.isArray(output) ? output : [output];
      updateData.completedAt = new Date();
    }

    if (status === "failed" && error) {
      updateData.errorMessage = error;
      updateData.failureType = "generation_failed";
    }

    await prisma.generation.update({
      where: { id: job.id },
      data: updateData,
    });

    return successResponse(res, { updated: true, jobId: job.id, status: newStatus }, requestId);
  } catch (error) {
    console.error(`[${requestId}] Webhook error:`, error);
    return errorResponse(res, "WEBHOOK_ERROR", "Failed to process webhook", 500, requestId);
  }
}