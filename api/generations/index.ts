import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GenerationRequest, GenerationJob, GenerationJobListItem, PaginatedResponse, ApiResponse, ApiError } from "../../../src/types/api";
import { validateGeneration, submitGeneration } from "../../../src/lib/providers/registry";
import prisma from "../../../src/lib/db/client";
import { v4 as uuidv4 } from "uuid";

async function moderateContent(prompt: string, inputImageUrl?: string, videoUrl?: string): Promise<{ flagged: boolean; reason?: string }> {
  const moderationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/moderation`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(moderationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image_url: inputImageUrl, video_url: videoUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const result = await response.json();
      return { flagged: result.data?.flagged || false, reason: result.data?.reason };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Moderation check timed out, skipping");
    } else {
      console.error("Moderation check failed:", error);
    }
  }
  return { flagged: false };
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
    return errorResponse(res, "INTERNAL_ERROR", "An unexpected error occurred", 500, requestId);
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse, requestId: string) {
  const userId = getUserId(req);
  const body = req.body as GenerationRequest;

  if (!body?.parameters) {
    return errorResponse(res, "INVALID_REQUEST", "Missing generation parameters", 400, requestId);
  }

  const validation = await validateGeneration(body);
  if (!validation.valid) {
    return errorResponse(res, "VALIDATION_FAILED", validation.errors.join(", "), 400, requestId);
  }

  const moderation = await moderateContent(
    validation.resolved_parameters.prompt,
    validation.resolved_parameters.input_image_url,
    undefined
  );
  if (moderation.flagged) {
    return errorResponse(res, "CONTENT_REJECTED", moderation.reason || "Content violates policy", 400, requestId);
  }

  const userCredits = 1000;
  if (userCredits < validation.estimated_credits) {
    return errorResponse(res, "INSUFFICIENT_CREDITS", `Need ${validation.estimated_credits} credits, have ${userCredits}`, 402, requestId);
  }

  const jobId = uuidv4();
  const now = new Date().toISOString();

  const job = await prisma.generation.create({
    data: {
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
    },
  });

  submitGeneration(body).catch(async (error) => {
    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: error.message,
        failureType: "provider_error",
        updatedAt: new Date(),
      },
    });
  });

  return successResponse(res, { id: job.id, status: job.status, progress: job.progress }, requestId, 202);
}

async function handleList(req: VercelRequest, res: VercelResponse, requestId: string) {
  const userId = getUserId(req);
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size as string) || 20));
  const status = req.query.status as string | undefined;
  const mediaType = req.query.media_type as string | undefined;

  const where: any = { userId };
  if (status) where.status = status;
  if (mediaType) where.mediaType = mediaType;

  const [jobs, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        progress: true,
        mediaType: true,
        model: true,
        originalPrompt: true,
        thumbnailUrls: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.generation.count({ where }),
  ]);

  const data: GenerationJobListItem[] = jobs.map((j) => ({
    id: j.id,
    status: j.status as any,
    progress: j.progress,
    media_type: j.mediaType as any,
    model: j.model as any,
    prompt: j.originalPrompt,
    thumbnail_url: j.thumbnailUrls[0] || null,
    created_at: j.createdAt.toISOString(),
    completed_at: j.completedAt?.toISOString(),
  }));

  const response: PaginatedResponse<GenerationJobListItem> = {
    data,
    total,
    page,
    page_size: pageSize,
    has_more: page * pageSize < total,
  };

  return successResponse(res, response, requestId);
}