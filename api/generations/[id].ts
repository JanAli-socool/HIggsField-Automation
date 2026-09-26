import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../src/types/api.js";
import { v4 as uuidv4 } from "uuid";

const mockGenerations = new Map<string, any>();

const PLACEHOLDER_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-1190-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-forest-sunrise-1191-large.mp4",
];

function getPlaceholderUrl(mediaType: string, index: number = 0): string {
  if (mediaType.startsWith("image")) {
    return `https://picsum.photos/seed/mock${index + 1}/1024/1024`;
  }
  return PLACEHOLDER_VIDEOS[index % PLACEHOLDER_VIDEOS.length];
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

async function getGenerationStatusMock(jobId: string): Promise<{ status: string; progress: number; resultUrls?: string[]; error?: string; failureType?: string }> {
  const job = mockGenerations.get(jobId);
  if (!job) {
    return { status: "failed", progress: 0, error: "Job not found", failureType: "generation_failed" };
  }
  return {
    status: job.status,
    progress: job.progress,
    resultUrls: job.resultUrls || job.outputAssetUrls || job.result_urls,
    error: job.errorMessage,
    failureType: job.failureType,
  };
}

async function cancelGenerationMock(jobId: string): Promise<void> {
  const job = mockGenerations.get(jobId);
  if (job && (job.status === "queued" || job.status === "generating")) {
    mockGenerations.set(jobId, { ...job, status: "cancelled", updatedAt: new Date() });
  }
}

async function submitGenerationMock(params: any): Promise<{ id: string; status: string; progress: number; resultUrls: string[] }> {
  const jobId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  
  const resultUrls: string[] = [];
  const mediaType = params.media_type || "text_to_video";
  const numOutputs = params.num_outputs || 1;
  
  for (let i = 0; i < numOutputs; i++) {
    if (mediaType.startsWith("image")) {
      resultUrls.push(`https://picsum.photos/seed/mock${i + 1}/1024/1024`);
    } else {
      resultUrls.push(PLACEHOLDER_VIDEOS[i % PLACEHOLDER_VIDEOS.length]);
    }
  }

  return {
    id: jobId,
    status: "completed",
    progress: 100,
    resultUrls,
  };
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
    const job = mockGenerations.get(jobId);

    if (!job) {
      return errorResponse(res, "NOT_FOUND", "Job not found", 404, requestId);
    }

    if (job.userId !== userId) {
      return errorResponse(res, "FORBIDDEN", "Access denied", 403, requestId);
    }

    switch (req.method) {
      case "GET":
        return await handleGet(req, res, job, requestId);
      case "POST":
        const action = req.query.action as string;
        if (action === "cancel") {
          return await handleCancel(req, res, job, requestId);
        }
        if (action === "retry") {
          return await handleRetry(req, res, job, requestId);
        }
        return errorResponse(res, "INVALID_ACTION", "Invalid action", 400, requestId);
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error("Job handler error:", error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "Internal server error", 500, requestId);
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
  const providerStatus = await getGenerationStatusMock(job.id);

  return successResponse(res, {
    id: job.id,
    userId: job.userId,
    projectId: job.projectId,
    status: providerStatus.status,
    progress: providerStatus.progress,
    request: job.parameters,
    resultUrls: providerStatus.resultUrls || job.outputAssetUrls || job.result_urls,
    thumbnailUrls: job.thumbnailUrls || job.thumbnail_urls,
    errorMessage: providerStatus.error || job.errorMessage,
    failureType: providerStatus.failureType || job.failure_type,
    providerJobId: job.providerJobId,
    creditCost: job.creditCost,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.updatedAt).toISOString(),
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
  }, requestId);
}

async function handleCancel(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
  if (!["queued", "generating", "preparing_model", "validating_input"].includes(job.status)) {
    return errorResponse(res, "INVALID_STATE", `Cannot cancel job in ${job.status} state`, 400, requestId);
  }

  const cancelledJob = { ...job, status: "cancelled", updatedAt: new Date() };
  mockGenerations.set(job.id, cancelledJob);
  await cancelGenerationMock(job.id);

  return successResponse(res, { id: job.id, status: "cancelled" }, requestId);
}

async function handleRetry(req: VercelRequest, res: VercelResponse, job: any, requestId: string) {
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

  mockGenerations.set(newJobId, newJob);

  const completedJob = await submitGenerationMock(job.parameters as any).catch(async (error) => {
    const failedJob = { ...newJob, status: "failed", errorMessage: error instanceof Error ? error.message : "Generation failed", failureType: "provider_error", updatedAt: new Date() };
    mockGenerations.set(newJobId, failedJob);
    throw error;
  });

  const updatedJob = { ...newJob, ...completedJob, status: "completed", progress: 100 };
  mockGenerations.set(newJobId, updatedJob);

  return successResponse(res, {
    id: newJob.id,
    status: newJob.status,
    progress: newJob.progress,
  }, requestId);
}