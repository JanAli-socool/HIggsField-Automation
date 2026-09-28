import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../src/types/api.js";
import { getGenerationStatus, cancelGeneration, retryGeneration } from "../../src/lib/providers/registry.js";
import prisma from "../../src/lib/db/client.js";
import { withAuth, AuthenticatedRequest } from "../../src/lib/auth/middleware.js";

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

  const authReq = await withAuth(req, res);
  if (!authReq) return;

  const userId = authReq.user.id;
  const jobId = req.query.id as string;

  if (!jobId) {
    return errorResponse(res, "MISSING_ID", "Job ID required", 400, requestId);
  }

  try {
    const job = await prisma.generation.findUnique({ where: { id: jobId } });

    if (!job) {
      return errorResponse(res, "NOT_FOUND", "Job not found", 404, requestId);
    }

    if (job.userId !== userId) {
      return errorResponse(res, "FORBIDDEN", "Access denied", 403, requestId);
    }

    switch (req.method) {
      case "GET":
        return await handleGet(req, res, job, requestId);
      case "POST": {
        const action = req.query.action as string;
        if (action === "cancel") {
          return await handleCancel(req, res, job, requestId);
        }
        if (action === "retry") {
          return await handleRetry(req, res, job, requestId);
        }
        return errorResponse(res, "INVALID_ACTION", "Invalid action", 400, requestId);
      }
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error("Job handler error:", error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "Internal server error", 500, requestId);
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
  // Always fetch fresh status from provider for non-terminal states
  let status = job.status;
  let progress = job.progress;
  let resultUrls = job.outputAssetUrls;
  let errorMessage = job.errorMessage;
  let failureType = job.failureType;

  if (["queued", "preparing_model", "generating", "validating_input", "encoding", "uploading"].includes(job.status)) {
    try {
      const providerStatus = await getGenerationStatus(job.id);
      status = providerStatus.status;
      progress = providerStatus.progress;
      if (providerStatus.resultUrls?.length) resultUrls = providerStatus.resultUrls;
      errorMessage = providerStatus.error || job.errorMessage;
      failureType = providerStatus.failureType || job.failureType;

      // Update database with fresh status
      await prisma.generation.update({
        where: { id: job.id },
        data: {
          status,
          progress,
          outputAssetUrls: resultUrls,
          errorMessage,
          failureType,
          completedAt: ["completed", "failed", "cancelled"].includes(status) ? new Date() : null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Provider status check failed:", error);
    }
  }

  return successResponse(res, {
    id: job.id,
    userId: job.userId,
    projectId: job.projectId,
    status,
    progress,
    request: job.parameters,
    resultUrls,
    thumbnailUrls: job.thumbnailUrls,
    errorMessage,
    failureType,
    providerJobId: job.providerJobId,
    creditCost: job.creditCost,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString(),
  }, requestId);
}

async function handleCancel(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
  if (!["queued", "generating", "preparing_model", "validating_input"].includes(job.status)) {
    return errorResponse(res, "INVALID_STATE", `Cannot cancel job in ${job.status} state`, 400, requestId);
  }

  try {
    await cancelGeneration(job.id);
  } catch (error) {
    console.error("Cancel generation failed:", error);
  }

  const cancelledJob = await prisma.generation.update({
    where: { id: job.id },
    data: { status: "cancelled", updatedAt: new Date() },
  });

  return successResponse(res, { id: cancelledJob.id, status: "cancelled" }, requestId);
}

async function handleRetry(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
  if (!["failed", "cancelled", "completed"].includes(job.status)) {
    return errorResponse(res, "INVALID_STATE", `Cannot retry job in ${job.status} state`, 400, requestId);
  }

  // Create new job based on original
  const newJob = await prisma.generation.create({
    data: {
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
    },
  });

  // Submit to provider
  const providerJob = await retryGeneration(job.id);
  await prisma.generation.update({
    where: { id: newJob.id },
    data: { providerJobId: providerJob.providerJobId },
  });

  return successResponse(res, {
    id: newJob.id,
    status: newJob.status,
    progress: newJob.progress,
  }, requestId);
}