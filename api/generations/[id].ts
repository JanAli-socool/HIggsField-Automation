import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../src/types/api.js";
import { getGenerationStatus, cancelGeneration, retryGeneration } from "../../src/lib/providers/registry.js";
import prisma from "../../src/lib/db/client.js";
import { withAuth, AuthenticatedRequest } from "../../src/lib/auth/apiMiddleware.js";

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

    if (job.user_id !== userId) {
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
  let status = job.status;
  let progress = job.progress;
  let resultUrls = job.output_asset_urls;
  let errorMessage = job.error_message;
  let failureType = job.failure_type;

  if (["queued", "preparing_model", "generating", "validating_input", "encoding", "uploading"].includes(job.status)) {
    try {
      const providerStatus = await getGenerationStatus(job.id);
      status = providerStatus.status;
      progress = providerStatus.progress;
      if (providerStatus.resultUrls?.length) resultUrls = providerStatus.resultUrls;
      errorMessage = providerStatus.error || job.error_message;
      failureType = providerStatus.failureType || job.failure_type;

      await prisma.generation.update({
        where: { id: job.id },
        data: {
          status,
          progress,
          output_asset_urls: resultUrls,
          error_message: errorMessage,
          failure_type: failureType,
          completed_at: ["completed", "failed", "cancelled"].includes(status) ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Provider status check failed:", error);
    }
  }

  return successResponse(res, {
    id: job.id,
    user_id: job.user_id,
    project_id: job.project_id,
    status,
    progress,
    request: job.parameters,
    resultUrls,
    thumbnailUrls: job.thumbnail_urls,
    errorMessage,
    failureType,
    providerJobId: job.provider_job_id,
    creditCost: job.credit_cost,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    completedAt: job.completed_at,
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
    data: { status: "cancelled", updated_at: new Date().toISOString() },
  });

  return successResponse(res, { id: cancelledJob.id, status: "cancelled" }, requestId);
}

async function handleRetry(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
  if (!["failed", "cancelled", "completed"].includes(job.status)) {
    return errorResponse(res, "INVALID_STATE", `Cannot retry job in ${job.status} state`, 400, requestId);
  }

  const newJob = await prisma.generation.create({
    data: {
      user_id: job.user_id,
      project_id: job.project_id,
      media_type: job.media_type,
      model: job.model,
      original_prompt: job.original_prompt,
      enhanced_prompt: job.enhanced_prompt,
      negative_prompt: job.negative_prompt,
      status: "queued",
      progress: 0,
      input_asset_url: job.input_asset_url,
      mask_url: job.mask_url,
      first_frame_image_url: job.first_frame_image_url,
      last_frame_image_url: job.last_frame_image_url,
      output_asset_urls: [],
      thumbnail_urls: [],
      parameters: job.parameters,
      credit_cost: job.credit_cost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });

  const providerJob = await retryGeneration(job.id);
  await prisma.generation.update({
    where: { id: newJob.id },
    data: { provider_job_id: providerJob.provider_job_id },
  });

  return successResponse(res, {
    id: newJob.id,
    status: newJob.status,
    progress: newJob.progress,
  }, requestId);
}