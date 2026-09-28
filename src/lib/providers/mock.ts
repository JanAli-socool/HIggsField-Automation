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

function simulateProgressSync(
  mediaType: string,
  onProgress: (status: JobStatus, progress: number) => void
): void {
  if (isServerless()) {
    // In serverless, complete immediately
    onProgress("validating_input", 5)
    onProgress("preparing_model", 15)
    onProgress("generating", 50)
    onProgress("generating", 90)
    onProgress("encoding", 95)
    onProgress("uploading", 98)
    onProgress("completed", 100)
    return
  }

  // Local development - use async simulation
  const totalTime = MOCK_DELAYS[mediaType] || 5000
  const stages: { status: JobStatus; progress: number; duration: number }[] = [
    { status: "validating_input", progress: 5, duration: totalTime * 0.05 },
    { status: "preparing_model", progress: 15, duration: totalTime * 0.1 },
    { status: "generating", progress: 50, duration: totalTime * 0.3 },
    { status: "generating", progress: 90, duration: totalTime * 0.45 },
    { status: "encoding", progress: 95, duration: totalTime * 0.05 },
    { status: "uploading", progress: 98, duration: totalTime * 0.03 },
    { status: "completed", progress: 100, duration: totalTime * 0.02 },
  ]

  let currentStage = 0

  const runStage = () => {
    if (currentStage >= stages.length) return

    const stage = stages[currentStage]
    onProgress(stage.status, stage.progress)

    setTimeout(() => {
      currentStage++
      runStage()
    }, stage.duration)
  }

  runStage()
}

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

    // Generate result URLs immediately for completed jobs
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
      status: "queued",
      progress: 0,
      request,
      result_urls: resultUrls,
      thumbnail_urls: thumbnailUrls,
      credit_cost: validation.estimated_credits,
      created_at: now,
      updated_at: now,
      provider_job_id: jobId,
    }

    // Persist to database
    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: "queued",
        progress: 0,
        providerJobId: jobId,
        outputAssetUrls: [],
        thumbnailUrls: [],
        updatedAt: new Date(),
      },
    }).catch(() => {
      // Job might not exist in DB yet if called directly
      console.log(`[MockProvider] Job ${jobId} not found in DB, will be created by API`);
    });

    // Simulate progress asynchronously
    this.simulateProgressAsync(jobId, params).catch(console.error)

    return job
  }

  private async simulateProgressAsync(jobId: string, params: GenerationParameters): Promise<void> {
    const updateStatus = async (status: JobStatus, progress: number, resultUrls?: string[]) => {
      await prisma.generation.update({
        where: { id: jobId },
        data: {
          status,
          progress,
          outputAssetUrls: resultUrls || [],
          updatedAt: new Date(),
          completedAt: status === "completed" ? new Date() : null,
        },
      }).catch((err) => {
        console.error(`[MockProvider] Failed to update job ${jobId}:`, err);
      });
    }

    // Initial status updates
    await updateStatus("validating_input", 5);
    await updateStatus("preparing_model", 15);
    await updateStatus("generating", 50);
    await updateStatus("generating", 90);
    await updateStatus("encoding", 95);
    await updateStatus("uploading", 98);

    // Final completion
    await updateStatus("completed", 100, params.num_outputs > 0 
      ? Array.from({ length: params.num_outputs }, (_, i) => getPlaceholderUrl(params.media_type, i))
      : []);
  }

  async getStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }> {
    const job = await prisma.generation.findUnique({ where: { id: jobId } })
    if (!job) {
      return { status: "failed", progress: 0, error: "Job not found", failureType: "generation_failed" }
    }

    const status = job.status as JobStatus;
    
    // For terminal states, return immediately
    if (["completed", "failed", "cancelled"].includes(status)) {
      return {
        status,
        progress: job.progress,
        resultUrls: job.outputAssetUrls.length > 0 ? job.outputAssetUrls : undefined,
        error: job.errorMessage || undefined,
        failureType: job.failureType as FailureType,
      };
    }

    // For non-terminal states in serverless, complete immediately
    if (isServerless() && ["queued", "preparing_model", "generating", "validating_input", "encoding", "uploading"].includes(status)) {
      // Simulate completion in serverless
      await this.simulateProgressAsync(jobId, job.parameters as unknown as GenerationParameters);
      
      const updatedJob = await prisma.generation.findUnique({ where: { id: jobId } });
      if (updatedJob) {
        return {
          status: updatedJob.status as JobStatus,
          progress: updatedJob.progress,
          resultUrls: updatedJob.outputAssetUrls.length > 0 ? updatedJob.outputAssetUrls : undefined,
          error: updatedJob.errorMessage || undefined,
          failureType: updatedJob.failureType as FailureType,
        };
      }
    }

    return {
      status: job.status as JobStatus,
      progress: job.progress,
      resultUrls: job.outputAssetUrls.length > 0 ? job.outputAssetUrls : undefined,
      error: job.errorMessage || undefined,
      failureType: job.failureType as FailureType,
    }
  }

  async cancel(jobId: string): Promise<void> {
    await prisma.generation.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    }).catch(console.error);
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const originalJob = await prisma.generation.findUnique({ where: { id: jobId } })
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

    const newJob = await prisma.generation.create({
      data: {
        id: newJobId,
        userId: originalJob.userId,
        projectId: originalJob.projectId,
        mediaType: originalJob.mediaType,
        model: originalJob.model,
        originalPrompt: originalJob.originalPrompt,
        enhancedPrompt: originalJob.enhancedPrompt,
        negativePrompt: originalJob.negativePrompt,
        status: "completed",
        progress: 100,
        inputAssetUrl: originalJob.inputAssetUrl,
        maskUrl: originalJob.maskUrl,
        firstFrameImageUrl: originalJob.firstFrameImageUrl,
        lastFrameImageUrl: originalJob.lastFrameImageUrl,
        outputAssetUrls: resultUrls,
        thumbnailUrls: thumbnailUrls,
        parameters: originalJob.parameters,
        providerJobId: newJobId,
        creditCost: originalJob.creditCost,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return {
      id: newJob.id,
      user_id: newJob.userId,
      project_id: newJob.projectId,
      status: newJob.status as JobStatus,
      progress: newJob.progress,
      request: originalJob.parameters as any,
      result_urls: resultUrls,
      thumbnail_urls: thumbnailUrls,
      credit_cost: newJob.creditCost,
      created_at: newJob.createdAt.toISOString(),
      updated_at: newJob.updatedAt.toISOString(),
      completed_at: newJob.completedAt?.toISOString(),
      provider_job_id: newJob.providerJobId,
    }
  }
}