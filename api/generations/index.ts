import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GenerationRequest, GenerationJob, GenerationJobListItem, PaginatedResponse, ApiResponse, ApiError } from "../../src/types/api.js";
import { validateGeneration, submitGeneration, getGenerationStatus } from "../../src/lib/providers/registry.js";
import prisma from "../../src/lib/db/client.js";
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

function estimateCredits(params: any): number {
  const baseCosts: Record<string, number> = {
    image: 1,
    image_to_image: 2,
    image_edit: 3,
    inpainting: 3,
    text_to_video: 10,
    image_to_video: 12,
    first_frame_to_video: 12,
    first_and_last_frame_to_video: 15,
  };
  let cost = baseCosts[params.media_type] || 1;
  if (params.num_outputs > 1) cost *= params.num_outputs;
  if (params.quality === "high") cost *= 2;
  if (params.quality === "preview") cost = Math.ceil(cost * 0.5);
  if (params.duration_seconds && params.duration_seconds > 5) cost *= Math.ceil(params.duration_seconds / 5);
  return cost;
}

function validateGenerationLocal(body: GenerationRequest): { valid: boolean; errors: string[]; estimated_credits: number; selected_model: string; resolved_parameters: any } {
  const { parameters } = body;
  const errors: string[] = [];

  if (!parameters.prompt || parameters.prompt.trim().length < 3) {
    errors.push("Prompt must be at least 3 characters");
  }

  if (parameters.media_type.startsWith("image_to_") || parameters.media_type === "inpainting") {
    if (!parameters.input_image_url) {
      errors.push("Input image is required for this media type");
    }
  }

  if (parameters.media_type === "inpainting" && !parameters.mask_url) {
    errors.push("Mask is required for inpainting");
  }

  if (parameters.media_type === "first_frame_to_video" && !parameters.first_frame_image_url) {
    errors.push("First frame image is required for first_frame_to_video");
  }

  if (parameters.media_type === "first_and_last_frame_to_video") {
    if (!parameters.first_frame_image_url) errors.push("First frame image is required");
    if (!parameters.last_frame_image_url) errors.push("Last frame image is required");
  }

  if (parameters.width < 64 || parameters.height < 64) {
    errors.push("Width and height must be at least 64px");
  }

  if (parameters.duration_seconds && parameters.duration_seconds > 30) {
    errors.push("Duration exceeds maximum of 30 seconds");
  }

  const estimatedCredits = estimateCredits(parameters);

  return {
    valid: errors.length === 0,
    errors,
    estimated_credits: estimatedCredits,
    selected_model: parameters.model,
    resolved_parameters: parameters,
  };
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

  try {
    switch (req.method) {
      case "POST":
        return await handleCreate(req, res, requestId);
      case "GET":
        return await handleList(req, res, requestId);
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "An unexpected error occurred", 500, requestId);
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse, requestId: string) {
  try {
    const userId = getUserId(req);
    const body = req.body as GenerationRequest;

    if (!body?.parameters) {
      return errorResponse(res, "INVALID_REQUEST", "Missing generation parameters", 400, requestId);
    }

    // Sanitize prompt
    if (body.parameters.prompt) {
      body.parameters.prompt = body.parameters.prompt.trim().replace(/^['"]|['"]$/g, '');
    }

    // Local validation
    const validation = validateGenerationLocal(body);
    if (!validation.valid) {
      return errorResponse(res, "VALIDATION_FAILED", validation.errors.join(", "), 400, requestId);
    }

    console.log(`[${requestId}] Validation passed for model: ${validation.selected_model}`);

    const userCredits = 1000;
    if (userCredits < validation.estimated_credits) {
      return errorResponse(res, "INSUFFICIENT_CREDITS", `Need ${validation.estimated_credits} credits, have ${userCredits}`, 402, requestId);
    }

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const jobData = {
      id: jobId,
      userId,
      projectId: body.project_id || null,
      mediaType: validation.resolved_parameters.media_type,
      model: validation.selected_model,
      originalPrompt: validation.resolved_parameters.prompt,
      enhancedPrompt: validation.resolved_parameters.prompt,
      negativePrompt: validation.resolved_parameters.negative_prompt,
      status: "queued",
      progress: 0,
      inputAssetUrl: validation.resolved_parameters.input_image_url,
      maskUrl: validation.resolved_parameters.mask_url,
      firstFrameImageUrl: validation.resolved_parameters.first_frame_image_url,
      lastFrameImageUrl: validation.resolved_parameters.last_frame_image_url,
      outputAssetUrls: [],
      thumbnailUrls: [],
      parameters: validation.resolved_parameters as any,
      creditCost: validation.estimated_credits,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in mock DB
    mockGenerations.set(jobId, jobData);

    // Submit to REAL provider (WanProvider for wan21, etc.)
    // Falls back to mock if REPLICATE_API_TOKEN not set (handled by registry)
    submitGeneration(body).then(async (completedJob) => {
      try {
        const providerStatus = await getGenerationStatus(completedJob.id);
        const existing = mockGenerations.get(jobId);
        if (existing) {
          const updatedJob = { ...existing, ...completedJob, ...providerStatus, status: providerStatus.status, progress: providerStatus.progress };
          mockGenerations.set(jobId, updatedJob);
        }
      } catch (error) {
        console.error(`[${requestId}] Generation completion failed:`, error);
        const existing = mockGenerations.get(jobId);
        if (existing) {
          mockGenerations.set(jobId, { ...existing, status: "failed", errorMessage: String(error), updated_at: new Date().toISOString() });
        }
      }
    }).catch(async (error) => {
      console.error(`[${requestId}] Generation submission failed:`, error);
      const failedJob = { ...jobData, status: "failed", errorMessage: error instanceof Error ? error.message : "Generation failed", failureType: "provider_error", updatedAt: new Date() };
      mockGenerations.set(jobId, failedJob);
    });

    return successResponse(res, { id: jobId, status: "queued", progress: 0 }, requestId, 202);
  } catch (error) {
    console.error(`[${requestId}] handleCreate error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "Generation failed", 500, requestId);
  }
}

async function handleList(req: VercelRequest, res: VercelResponse, requestId: string) {
  try {
    const userId = getUserId(req);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size as string) || 20));
    const status = req.query.status as string | undefined;
    const mediaType = req.query.media_type as string | undefined;

    let jobs = Array.from(mockGenerations.values()).filter(j => j.userId === userId);
    let total = jobs.length;

    if (status) jobs = jobs.filter(j => j.status === status);
    if (mediaType) jobs = jobs.filter(j => j.mediaType === mediaType);

    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginatedJobs = jobs.slice((page - 1) * pageSize, page * pageSize);

    const data: GenerationJobListItem[] = paginatedJobs.map((j) => ({
      id: j.id,
      status: j.status as any,
      progress: j.progress,
      media_type: j.mediaType as any,
      model: j.model as any,
      prompt: j.originalPrompt,
      thumbnail_url: j.thumbnailUrls[0] || null,
      created_at: new Date(j.createdAt).toISOString(),
      completed_at: j.completedAt ? new Date(j.completedAt).toISOString() : undefined,
    }));

    const response: PaginatedResponse<GenerationJobListItem> = {
      data,
      total,
      page,
      page_size: pageSize,
      has_more: page * pageSize < total,
    };

    return successResponse(res, response, requestId);
  } catch (error) {
    console.error(`[${requestId}] handleList error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to list generations", 500, requestId);
  }
}