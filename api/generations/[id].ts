import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../../src/types/api";
import { getGenerationStatus, cancelGeneration, retryGeneration } from "../../../src/lib/providers/registry";
import prisma from "../../../src/lib/db/client";
import { v4 as uuidv4 } from "uuid";

const mockGenerations = new Map<string, any>();

function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getUserId(req: VercelRequest): string {
  return req.headers["x-user-id"] as string || "mock_user";
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
  const userId = getUserId(req);
  const jobId = req.query.id as string;

  if (!jobId) {
    return errorResponse(res, "MISSING_ID", "Job ID required", 400, requestId);
  }

  try {
    let job: any;

    if (isDatabaseAvailable()) {
      try {
        job = await prisma.generation.findUnique({ where: { id: jobId } });
      } catch (dbError) {
        console.error("Database query failed, using mock:", dbError);
        job = mockGenerations.get(jobId);
      }
    } else {
      job = mockGenerations.get(jobId);
    }

    if (!job) {
      return errorResponse(res, "NOT_FOUND", "Job not found", 404, requestId);
    }

    if (job.userId !== userId) {
      return errorResponse(res, "FORBIDDEN", "Access denied", 403, requestId);
    }

    switch (req.method) {
      case "GET":
        return await handleGet(req, job, requestId);
      case "POST":
        const action = req.query.action as string;
        if (action === "cancel") {
          return await handleCancel(req, job, requestId);
        }
        if (action === "retry") {
          return await handleRetry(req, job, requestId);
        }
        return errorResponse(res, "INVALID_ACTION", "Invalid action", 400, requestId);
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error("Job handler error:", error);
    return errorResponse(res, "INTERNAL_ERROR", "Internal server error", 500, requestId);
  }
}

async function handleGet(req: VercelRequest, job: any, requestId: string) {
  const providerStatus = await getGenerationStatus(job.id);

  return successResponse(res, {
    id: job.id,
    userId: job.userId,
    projectId: job.projectId,
    status: providerStatus.status,
    progress: providerStatus.progress,
    request: job.parameters,
    resultUrls: providerStatus.resultUrls || job.outputAssetUrls,
    thumbnailUrls: job.thumbnailUrls,
    errorMessage: providerStatus.error || job.errorMessage,
    failureType: providerStatus.failureType || job.failureType,
    providerJobId: job.providerJobId,
    creditCost: job.creditCost,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.updatedAt).toISOString(),
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
  }, requestId);
}

async function handleCancel(req: VercelRequest, job: any, requestId: string) {
  if (!["queued", "generating", "preparing_model", "validating_input"].includes(job.status)) {
    return errorResponse(res, "INVALID_STATE", `Cannot cancel job in ${job.status} state`, 400, requestId);
  }

  const cancelledJob = { ...job, status: "cancelled", updatedAt: new Date() };

  if (isDatabaseAvailable()) {
    try {
      await prisma.generation.update({ where: { id: job.id }, data: cancelledJob });
    } catch { mockGenerations.set(job.id, cancelledJob); }
  } else {
    mockGenerations.set(job.id, cancelledJob);
  }

  await cancelGeneration(job.id);

  return successResponse(res, { id: job.id, status: "cancelled" }, requestId);
}

async function handleRetry(req: VercelRequest, job: any, requestId: string) {
  if (!["failed", "cancelled", "completed"].includes(job.status)) {
    return errorResponse(res, "INVALID_STATE", `Cannot retry job in ${job.status} state`, 400, requestId);
  }

  const newJobId = uuidv4();
  const newJob = {
    id: newJobId,
    userId: job.userId,
    projectId: job.projectId,
    mediaType: job.mediaType,
    model: job.model,
    originalPrompt: job.originalPrompt,
    enhancedPrompt: job.enhancedPrompt,
    negativePrompt: job.negativePrompt,
    status: "queued",
    progress: 0,
    inputAssetUrl: job.inputAssetUrl,
    maskUrl: job.maskUrl,
    firstFrameImageUrl: job.firstFrameImageUrl,
    lastFrameImageUrl: job.lastFrameImageUrl,
    outputAssetUrls: [],
    thumbnailUrls: [],
    parameters: job.parameters,
    creditCost: job.creditCost,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isDatabaseAvailable()) {
    try {
      await prisma.generation.create({ data: newJob });
    } catch { mockGenerations.set(newJobId, newJob); }
  } else {
    mockGenerations.set(newJobId, newJob);
  }

  await submitGeneration(job.parameters as any).catch(async (error) => {
    const failedJob = { ...newJob, status: "failed", errorMessage: error.message, failureType: "provider_error", updatedAt: new Date() };
    if (isDatabaseAvailable()) {
      try {
        await prisma.generation.update({ where: { id: newJobId }, data: failedJob });
      } catch { mockGenerations.set(newJobId, failedJob); }
    } else {
      mockGenerations.set(newJobId, failedJob);
    }
  });

  return successResponse(res, {
    id: newJob.id,
    status: newJob.status,
    progress: newJob.progress,
  }, requestId);
}