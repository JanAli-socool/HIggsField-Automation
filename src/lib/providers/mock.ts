import type {
  GenerationRequest,
  GenerationJob,
  ValidationResult,
  GenerationParameters,
  JobStatus,
  FailureType,
} from "../../types/api.js";
import { BaseProvider, GenerationProvider, ProviderConfig } from "./base.js";
import prisma from "../db/client.js";

const MOCK_DELAYS: Record<string, number> = {
  image: 2000,
  image_to_image: 3000,
  image_edit: 3000,
  inpainting: 3000,
  text_to_video: 8000,
  image_to_video: 10000,
  first_frame_to_video: 10000,
  first_and_last_frame_to_video: 15000,
}

const PLACEHOLDER_IMAGES = [
  "https://picsum.photos/seed/mock1/1024/1024",
  "https://picsum.photos/seed/mock2/1024/1024",
  "https://picsum.photos/seed/mock3/1024/1024",
]

const PLACEHOLDER_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-in-the-sky-time-lapse-1189-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-1190-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-forest-sunrise-1191-large.mp4",
]

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getPlaceholderUrl(mediaType: string, index: number = 0): string {
  if (mediaType.startsWith("image")) {
    return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]
  }
  return PLACEHOLDER_VIDEOS[index % PLACEHOLDER_VIDEOS.length]
}

function isServerless(): boolean {
  return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY
}

const prismaAny = prisma as any;

export class MockProvider extends BaseProvider implements GenerationProvider {
  readonly name = "MockProvider"
  readonly supportedMediaTypes: GenerationParameters["media_type"][] = [
    "image",
    "image_to_image",
    "image_edit",
    "inpainting",
    "text_to_video",
    "image_to_video",
    "first_frame_to_video",
    "first_and_last_frame_to_video",
  ]
  readonly supportedModels: GenerationParameters["model"][] = [
    "flux_schnell",
    "sdxl",
    "qwen_image",
    "wan21",
    "ltx",
    "hunyuan",
  ]
  readonly maxDuration = 30
  readonly maxResolution = { width: 1920, height: 1080 }

  constructor(config: ProviderConfig = { apiKey: "mock_key" }) {
    super(config)
  }

  async validate(request: GenerationRequest): Promise<ValidationResult> {
    const { parameters } = request
    const errors: string[] = []
    const warnings: string[] = []

    if (!parameters.prompt || parameters.prompt.trim().length < 3) {
      errors.push("Prompt must be at least 3 characters")
    }

    if (parameters.media_type.startsWith("image_to_") || parameters.media_type === "inpainting") {
      if (!parameters.input_image_url) {
        errors.push("Input image is required for this media type")
      }
    }

    if (parameters.media_type === "inpainting" && !parameters.mask_url) {
      errors.push("Mask is required for inpainting")
    }

    if (parameters.media_type === "first_frame_to_video" && !parameters.first_frame_image_url) {
      errors.push("First frame image is required for first_frame_to_video")
    }

    if (parameters.media_type === "first_and_last_frame_to_video") {
      if (!parameters.first_frame_image_url) errors.push("First frame image is required")
      if (!parameters.last_frame_image_url) errors.push("Last frame image is required")
    }

    if (parameters.width < 64 || parameters.height < 64) {
      errors.push("Width and height must be at least 64px")
    }

    if (parameters.width > (this.maxResolution?.width || 1920) || parameters.height > (this.maxResolution?.height || 1080)) {
      warnings.push("Resolution exceeds recommended maximum, will be downscaled")
    }

    if (parameters.duration_seconds && parameters.duration_seconds > (this.maxDuration || 30)) {
      errors.push(`Duration exceeds maximum of ${this.maxDuration} seconds`)
    }

    const estimatedCredits = this.estimateCredits(parameters)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimated_credits: estimatedCredits,
      selected_model: parameters.model,
      resolved_parameters: parameters,
    }
  }

  async submit(request: GenerationRequest): Promise<GenerationJob> {
    const validation = await this.validate(request)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    const jobId = generateId()
    const now = new Date().toISOString()
    const params = validation.resolved_parameters

    const resultUrls: string[] = []
    const thumbnailUrls: string[] = []

    for (let i = 0; i < params.num_outputs; i++) {
      resultUrls.push(getPlaceholderUrl(params.media_type, i))
      thumbnailUrls.push(getPlaceholderUrl(params.media_type, i))
    }

    const job: GenerationJob = {
      id: jobId,
      user_id: "mock_user",
      project_id: request.project_id || null,
      media_type: params.media_type,
      model: params.model,
      original_prompt: params.prompt,
      enhanced_prompt: params.prompt,
      negative_prompt: params.negative_prompt,
      status: "queued",
      progress: 0,
      input_asset_url: params.input_image_url,
      mask_url: params.mask_url,
      first_frame_image_url: params.first_frame_image_url,
      last_frame_image_url: params.last_frame_image_url,
      output_asset_urls: resultUrls,
      thumbnail_urls: thumbnailUrls,
      parameters: params,
      provider_job_id: jobId,
      credit_cost: validation.estimated_credits,
      error_message: null,
      failure_type: null,
      created_at: now,
      updated_at: now,
      completed_at: null,
    }

    await prismaAny.generation.update({
      where: { id: jobId },
      data: {
        status: "queued",
        progress: 0,
        provider_job_id: jobId,
        output_asset_urls: [],
        thumbnail_urls: [],
        updated_at: now,
      },
    }).catch(() => {
      console.log(`[MockProvider] Job ${jobId} not found in DB, will be created by API`);
    });

    this.simulateProgressAsync(jobId, params).catch(console.error)

    return job
  }

  private async simulateProgressAsync(jobId: string, params: GenerationParameters): Promise<void> {
    const updateStatus = async (status: JobStatus, progress: number, resultUrls?: string[]) => {
      await prismaAny.generation.update({
        where: { id: jobId },
        data: {
          status,
          progress,
          output_asset_urls: resultUrls || [],
          updated_at: new Date().toISOString(),
          completed_at: status === "completed" ? new Date().toISOString() : null,
        },
      }).catch((err: any) => {
        console.error(`[MockProvider] Failed to update job ${jobId}:`, err);
      });
    }

    await updateStatus("validating_input", 5);
    await updateStatus("preparing_model", 15);
    await updateStatus("generating", 50);
    await updateStatus("generating", 90);
    await updateStatus("encoding", 95);
    await updateStatus("uploading", 98);

    await updateStatus("completed", 100, params.num_outputs > 0
      ? Array.from({ length: params.num_outputs }, (_, i) => getPlaceholderUrl(params.media_type, i))
      : []);
  }

  async getStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }> {
    const job = await prismaAny.generation.findUnique({ where: { id: jobId } })
    if (!job) {
      return { status: "failed", progress: 0, error: "Job not found", failureType: "generation_failed" }
    }

    const status = job.status as JobStatus;
    
    if (["completed", "failed", "cancelled"].includes(status)) {
      return {
        status,
        progress: job.progress,
        resultUrls: job.output_asset_urls.length > 0 ? job.output_asset_urls : undefined,
        error: job.error_message || undefined,
        failureType: job.failure_type as FailureType,
      };
    }

    if (isServerless() && ["queued", "preparing_model", "generating", "validating_input", "encoding", "uploading"].includes(status)) {
      await this.simulateProgressAsync(jobId, job.parameters as unknown as GenerationParameters);
      
      const updatedJob = await prismaAny.generation.findUnique({ where: { id: jobId } });
      if (updatedJob) {
        return {
          status: updatedJob.status as JobStatus,
          progress: updatedJob.progress,
          resultUrls: updatedJob.output_asset_urls.length > 0 ? updatedJob.output_asset_urls : undefined,
          error: updatedJob.error_message || undefined,
          failureType: updatedJob.failure_type as FailureType,
        };
      }
    }

    return {
      status: job.status as JobStatus,
      progress: job.progress,
      resultUrls: job.output_asset_urls.length > 0 ? job.output_asset_urls : undefined,
      error: job.error_message || undefined,
      failureType: job.failure_type as FailureType,
    }
  }

  async cancel(jobId: string): Promise<void> {
    await prismaAny.generation.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        updated_at: new Date().toISOString(),
      },
    }).catch(console.error);
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const originalJob = await prismaAny.generation.findUnique({ where: { id: jobId } })
    if (!originalJob) {
      throw new Error("Original job not found")
    }

    const newJobId = generateId()
    const now = new Date().toISOString()
    const params = originalJob.parameters as unknown as GenerationParameters

    const resultUrls: string[] = []
    const thumbnailUrls: string[] = []

    for (let i = 0; i < params.num_outputs; i++) {
      resultUrls.push(getPlaceholderUrl(params.media_type, i))
      thumbnailUrls.push(getPlaceholderUrl(params.media_type, i))
    }

    const newJob = await prismaAny.generation.create({
      data: {
        id: newJobId,
        user_id: originalJob.user_id,
        project_id: originalJob.project_id,
        media_type: originalJob.media_type,
        model: originalJob.model,
        original_prompt: originalJob.original_prompt,
        enhanced_prompt: originalJob.enhanced_prompt,
        negative_prompt: originalJob.negative_prompt,
        status: "completed",
        progress: 100,
        input_asset_url: originalJob.input_asset_url,
        mask_url: originalJob.mask_url,
        first_frame_image_url: originalJob.first_frame_image_url,
        last_frame_image_url: originalJob.last_frame_image_url,
        output_asset_urls: resultUrls,
        thumbnail_urls: thumbnailUrls,
        parameters: originalJob.parameters,
        provider_job_id: newJobId,
        credit_cost: originalJob.credit_cost,
        created_at: now,
        updated_at: now,
        completed_at: now,
      },
    });

    return {
      id: newJob.id,
      user_id: newJob.user_id,
      project_id: newJob.project_id,
      media_type: newJob.media_type,
      model: newJob.model,
      original_prompt: newJob.original_prompt,
      enhanced_prompt: newJob.enhanced_prompt,
      negative_prompt: newJob.negative_prompt,
      status: newJob.status as JobStatus,
      progress: newJob.progress,
      input_asset_url: newJob.input_asset_url,
      mask_url: newJob.mask_url,
      first_frame_image_url: newJob.first_frame_image_url,
      last_frame_image_url: newJob.last_frame_image_url,
      output_asset_urls: newJob.output_asset_urls,
      thumbnail_urls: newJob.thumbnail_urls,
      parameters: newJob.parameters,
      provider_job_id: newJob.provider_job_id,
      credit_cost: newJob.credit_cost,
      error_message: newJob.error_message,
      failure_type: newJob.failure_type,
      created_at: newJob.created_at,
      updated_at: newJob.updated_at,
      completed_at: newJob.completed_at,
    }
  }
}