import type {
  GenerationRequest,
  GenerationJob,
  ValidationResult,
  GenerationParameters,
  JobStatus,
  FailureType,
} from "../../types/api";
import { BaseProvider, GenerationProvider, ProviderConfig } from "./base";

const MOCK_JOBS = new Map<string, GenerationJob>();
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

function simulateProgress(
  jobId: string,
  mediaType: string,
  onProgress: (status: JobStatus, progress: number) => void
): Promise<void> {
  const totalTime = MOCK_DELAYS[mediaType] || 5000
  const stages: { status: JobStatus; progress: number; duration: number }[] = [
    { status: "validating_input", progress: 5, duration: totalTime * 0.05 },
    { status: "preparing_model", progress: 15, duration: totalTime * 0.1 },
    { status: "generating", progress: 90, duration: totalTime * 0.75 },
    { status: "encoding", progress: 95, duration: totalTime * 0.05 },
    { status: "uploading", progress: 98, duration: totalTime * 0.03 },
    { status: "completed", progress: 100, duration: totalTime * 0.02 },
  ]

  return new Promise((resolve) => {
    let currentStage = 0

    const runStage = () => {
      if (currentStage >= stages.length) {
        resolve()
        return
      }

      const stage = stages[currentStage]
      onProgress(stage.status, stage.progress)

      setTimeout(() => {
        currentStage++
        runStage()
      }, stage.duration)
    }

    runStage()
  })
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

    const jobId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const now = new Date().toISOString()

    const job: GenerationJob = {
      id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      user_id: "mock_user",
      project_id: request.project_id || null,
      status: "queued",
      progress: 0,
      request,
      result_urls: [],
      thumbnail_urls: [],
      credit_cost: validation.estimated_credits,
      created_at: now,
      updated_at: now,
    }

    MOCK_JOBS.set(jobId, job)

    this.processJob(jobId, validation.resolved_parameters)

    return job
  }

  private async processJob(jobId: string, params: GenerationParameters): Promise<void> {
    const job = MOCK_JOBS.get(jobId)
    if (!job) return

    const updateStatus = (status: JobStatus, progress: number) => {
      const existing = MOCK_JOBS.get(jobId)
      if (existing) {
        MOCK_JOBS.set(jobId, { ...existing, status, progress, updated_at: new Date().toISOString() })
      }
    }

    try {
      await simulateProgress(jobId, params.media_type, updateStatus)

      const resultUrls: string[] = []
      const thumbnailUrls: string[] = []

      for (let i = 0; i < params.num_outputs; i++) {
        resultUrls.push(getPlaceholderUrl(params.media_type, i))
        thumbnailUrls.push(getPlaceholderUrl(params.media_type, i))
      }

      const finalJob = MOCK_JOBS.get(jobId)
      if (finalJob) {
        MOCK_JOBS.set(jobId, {
          ...finalJob,
          status: "completed",
          progress: 100,
          result_urls: resultUrls,
          thumbnail_urls: thumbnailUrls,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      const failedJob = MOCK_JOBS.get(jobId)
      if (failedJob) {
        MOCK_JOBS.set(jobId, {
          ...failedJob,
          status: "failed",
          error_message: error instanceof Error ? error.message : "Generation failed",
          failure_type: "generation_failed",
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  async getStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }> {
    const job = MOCK_JOBS.get(jobId)
    if (!job) {
      return { status: "failed", progress: 0, error: "Job not found", failureType: "generation_failed" }
    }

    return {
      status: job.status as JobStatus,
      progress: job.progress,
      resultUrls: job.result_urls.length > 0 ? job.result_urls : undefined,
      error: job.error_message,
      failureType: job.failure_type as FailureType,
    }
  }

  async cancel(jobId: string): Promise<void> {
    const job = MOCK_JOBS.get(jobId)
    if (job && (job.status === "queued" || job.status === "generating")) {
      MOCK_JOBS.set(jobId, {
        ...job,
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
    }
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const originalJob = MOCK_JOBS.get(jobId)
    if (!originalJob) {
      throw new Error("Original job not found")
    }

    const newJobId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const now = new Date().toISOString()

    const newJob: GenerationJob = {
      id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      user_id: originalJob.user_id,
      project_id: originalJob.project_id,
      status: "queued",
      progress: 0,
      request: originalJob.request,
      result_urls: [],
      thumbnail_urls: [],
      credit_cost: originalJob.credit_cost,
      created_at: now,
      updated_at: now,
    }

    MOCK_JOBS.set(newJobId, newJob)
    this.processJob(newJobId, originalJob.request.parameters)

    return newJob
  }

  static getJob(jobId: string): GenerationJob | undefined {
    return MOCK_JOBS.get(jobId)
  }

  static getAllJobs(): GenerationJob[] {
    return Array.from(MOCK_JOBS.values())
  }

  static clearJobs(): void {
    MOCK_JOBS.clear()
  }
}