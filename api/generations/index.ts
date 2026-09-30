import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GenerationRequest, GenerationJobListItem, PaginatedResponse, ApiResponse, ApiError } from "@/types/api.js";
import { validateGeneration, submitGeneration, getGenerationStatus } from "@/lib/providers/registry.js";
import prisma from "@/lib/db/client.js";
import { v4 as uuidv4 } from "uuid";
import { withAuth, AuthenticatedRequest } from "@/lib/auth/apiMiddleware.js";

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

    if (body.parameters.prompt) {
      body.parameters.prompt = body.parameters.prompt.trim().replace(/^['"]|['"]$/g, '');
    }

    const validation = await validateGeneration(body);
    if (!validation.valid) {
      return errorResponse(res, "VALIDATION_FAILED", validation.errors.join(", "), 400, requestId);
    }

    console.log(`[${requestId}] Validation passed for model: ${validation.selected_model}`);

    const userCredits = await prisma.creditBalance.findUnique({ where: { user_id: userId } });
    const availableCredits = userCredits?.balance || 100;
    if (availableCredits < validation.estimated_credits) {
      return errorResponse(res, "INSUFFICIENT_CREDITS", `Need ${validation.estimated_credits} credits, have ${availableCredits}`, 402, requestId);
    }

    const job = await prisma.generation.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        project_id: body.project_id || null,
        media_type: validation.resolved_parameters.media_type,
        model: validation.selected_model,
        original_prompt: validation.resolved_parameters.prompt,
        enhanced_prompt: validation.resolved_parameters.prompt,
        negative_prompt: validation.resolved_parameters.negative_prompt,
        status: "queued",
        progress: 0,
        input_asset_url: validation.resolved_parameters.input_image_url,
        mask_url: validation.resolved_parameters.mask_url,
        first_frame_image_url: validation.resolved_parameters.first_frame_image_url,
        last_frame_image_url: validation.resolved_parameters.last_frame_image_url,
        output_asset_urls: [],
        thumbnail_urls: [],
        parameters: validation.resolved_parameters as any,
        credit_cost: validation.estimated_credits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    await prisma.creditBalance.update({
      where: { user_id: userId },
      data: { balance: { decrement: validation.estimated_credits }, total_consumed: { increment: validation.estimated_credits } },
    });

    submitGeneration(body).then(async (providerJob) => {
      try {
        const providerStatus = await getGenerationStatus(providerJob.id);
        await prisma.generation.update({
          where: { id: job.id },
          data: {
            status: providerStatus.status,
            progress: providerStatus.progress,
            provider_job_id: providerJob.provider_job_id,
            output_asset_urls: providerStatus.resultUrls || [],
            thumbnail_urls: providerStatus.resultUrls?.map((_, i) => getPlaceholderUrl(validation.resolved_parameters.media_type, i)) || [],
            error_message: providerStatus.error,
            failure_type: providerStatus.failureType,
            completed_at: providerStatus.status === "completed" || providerStatus.status === "failed" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error(`[${requestId}] Generation completion failed:`, error);
        await prisma.generation.update({
          where: { id: job.id },
          data: {
            status: "failed",
            error_message: error instanceof Error ? error.message : "Generation failed",
            failure_type: "provider_error",
            updated_at: new Date().toISOString(),
          },
        });
      }
    }).catch(async (error) => {
      console.error(`[${requestId}] Generation submission failed:`, error);
      await prisma.generation.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error_message: error instanceof Error ? error.message : "Generation failed",
          failure_type: "provider_error",
          updated_at: new Date().toISOString(),
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

    const where: any = { user_id: userId };
    if (status) where.status = status;
    if (mediaType) where.media_type = mediaType;

    const [jobs, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.generation.count({ where }),
    ]);

    const data: GenerationJobListItem[] = jobs.map((j) => ({
      id: j.id,
      status: j.status as any,
      progress: j.progress,
      media_type: j.media_type as any,
      model: j.model as any,
      prompt: j.original_prompt,
      thumbnail_url: j.thumbnail_urls[0] || null,
      created_at: j.created_at,
      completed_at: j.completed_at,
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