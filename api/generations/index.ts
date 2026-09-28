import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GenerationRequest, GenerationJobListItem, PaginatedResponse, ApiResponse, ApiError } from "../../src/types/api.js";
import { validateGeneration, submitGeneration, getGenerationStatus } from "../../src/lib/providers/registry.js";
import prisma from "../../src/lib/db/client.js";
import { v4 as uuidv4 } from "uuid";
import { withAuth, AuthenticatedRequest } from "../../src/lib/auth/middleware.js";

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

  try {
    switch (req.method) {
      case "POST":
        return await handleCreate(authReq, res, requestId);
      case "GET":
        return await handleList(authReq, res, requestId);
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "An unexpected error occurred", 500, requestId);
  }
}

async function handleCreate(req: AuthenticatedRequest, res: VercelResponse, requestId: string) {
  try {
    const userId = req.user.id;
    const body = req.body as GenerationRequest;

    if (!body?.parameters) {
      return errorResponse(res, "INVALID_REQUEST", "Missing generation parameters", 400, requestId);
    }

    // Sanitize prompt
    if (body.parameters.prompt) {
      body.parameters.prompt = body.parameters.prompt.trim().replace(/^['"]|['"]$/g, '');
    }

    // Validate via provider registry
    const validation = await validateGeneration(body);
    if (!validation.valid) {
      return errorResponse(res, "VALIDATION_FAILED", validation.errors.join(", "), 400, requestId);
    }

    console.log(`[${requestId}] Validation passed for model: ${validation.selected_model}`);

    // Check user credits
    const userCredits = await prisma.creditBalance.findUnique({ where: { userId } });
    const availableCredits = userCredits?.balance || 100;
    if (availableCredits < validation.estimated_credits) {
      return errorResponse(res, "INSUFFICIENT_CREDITS", `Need ${validation.estimated_credits} credits, have ${availableCredits}`, 402, requestId);
    }

    // Create job in database
    const job = await prisma.generation.create({
      data: {
        id: uuidv4(),
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

    // Deduct credits immediately
    await prisma.creditBalance.update({
      where: { userId },
      data: { balance: { decrement: validation.estimated_credits }, totalConsumed: { increment: validation.estimated_credits } },
    });

    // Submit to provider asynchronously
    submitGeneration(body).then(async (providerJob) => {
      try {
        const providerStatus = await getGenerationStatus(providerJob.id);
        await prisma.generation.update({
          where: { id: job.id },
          data: {
            status: providerStatus.status,
            progress: providerStatus.progress,
            providerJobId: providerJob.providerJobId,
            outputAssetUrls: providerStatus.resultUrls || [],
            thumbnailUrls: providerStatus.resultUrls?.map((_, i) => getPlaceholderUrl(validation.resolved_parameters.media_type, i)) || [],
            errorMessage: providerStatus.error,
            failureType: providerStatus.failureType,
            completedAt: providerStatus.status === "completed" || providerStatus.status === "failed" ? new Date() : null,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`[${requestId}] Generation completion failed:`, error);
        await prisma.generation.update({
          where: { id: job.id },
          data: {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Generation failed",
            failureType: "provider_error",
            updatedAt: new Date(),
          },
        });
      }
    }).catch(async (error) => {
      console.error(`[${requestId}] Generation submission failed:`, error);
      await prisma.generation.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Generation failed",
          failureType: "provider_error",
          updatedAt: new Date(),
        },
      });
    });

    return successResponse(res, { id: job.id, status: "queued", progress: 0 }, requestId, 202);
  } catch (error) {
    console.error(`[${requestId}] handleCreate error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "Generation failed", 500, requestId);
  }
}

async function handleList(req: AuthenticatedRequest, res: VercelResponse, requestId: string) {
  try {
    const userId = req.user.id;
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
  } catch (error) {
    console.error(`[${requestId}] handleList error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to list generations", 500, requestId);
  }
}