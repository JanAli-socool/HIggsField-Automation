import { env } from "../env.js";
import type {
  GenerationRequest,
  GenerationJob,
  ValidationResult,
  GenerationParameters,
  JobStatus,
  FailureType,
} from "../../types/api.js";
import { BaseProvider, GenerationProvider, ProviderConfig } from "./base.js";

interface LTXGenerateResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

interface LTXStatusResponse {
  id: string;
  status: string;
  progress: number;
  output?: string[];
  error?: string;
}

const LTX_BASE_URL = "https://api.replicate.com/v1";
const LTX_MODEL_VERSION = "lightricks/ltx-video:1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3";

export class LTXProvider extends BaseProvider implements GenerationProvider {
  readonly name = "LTXProvider";
  readonly supportedMediaTypes: GenerationParameters["media_type"][] = [
    "text_to_video",
    "image_to_video",
    "first_frame_to_video",
  ];
  readonly supportedModels: GenerationParameters["model"][] = ["ltx"];
  readonly maxDuration = 30;
  readonly maxResolution = { width: 768, height: 512 };

  constructor(config: ProviderConfig) {
    super({ ...config, baseUrl: config.baseUrl || LTX_BASE_URL });
  }

  async validate(request: GenerationRequest): Promise<ValidationResult> {
    const { parameters } = request;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parameters.prompt || parameters.prompt.trim().length < 3) {
      errors.push("Prompt must be at least 3 characters");
    }

    if (["image_to_video", "first_frame_to_video"].includes(parameters.media_type)) {
      if (!parameters.first_frame_image_url && !parameters.input_image_url) {
        errors.push("First frame image is required for this media type");
      }
    }

    if (parameters.duration_seconds && parameters.duration_seconds > this.maxDuration) {
      errors.push(`Duration exceeds maximum of ${this.maxDuration} seconds`);
    }

    if (parameters.width > this.maxResolution!.width || parameters.height > this.maxResolution!.height) {
      warnings.push(`Resolution exceeds maximum ${this.maxResolution!.width}x${this.maxResolution!.height}, will be downscaled`);
    }

    const estimatedCredits = this.estimateCredits(parameters);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimated_credits: estimatedCredits,
      selected_model: "ltx",
      resolved_parameters: parameters,
    };
  }

  async submit(request: GenerationRequest): Promise<GenerationJob> {
    const validation = await this.validate(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const { parameters } = request;
    const width = Math.min(parameters.width || 768, this.maxResolution!.width);
    const height = Math.min(parameters.height || 512, this.maxResolution!.height);

    const input: Record<string, any> = {
      prompt: parameters.prompt,
      negative_prompt: parameters.negative_prompt || "",
      width,
      height,
      num_frames: parameters.duration_seconds ? parameters.duration_seconds * (parameters.fps || 24) : 120,
      fps: parameters.fps || 24,
      guidance_scale: parameters.guidance_scale || 3.5,
      num_inference_steps: parameters.steps || 30,
      seed: parameters.seed,
      motion_strength: parameters.motion_strength || 0.6,
      output_format: "mp4",
    };

    if (parameters.media_type === "image_to_video" || parameters.media_type === "first_frame_to_video") {
      input.image = parameters.first_frame_image_url || parameters.input_image_url;
    }

    const response = await this.makeRequest<LTXGenerateResponse>("/predictions", {
      method: "POST",
      body: JSON.stringify({
        version: LTX_MODEL_VERSION,
        input,
        webhook: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate`,
        webhook_events_filter: ["completed", "failed"],
      }),
    });

    const jobId = `ltx_${response.id}`;
    const now = new Date().toISOString();

    return {
      id: jobId,
      user_id: "current_user",
      project_id: request.project_id || null,
      status: "queued",
      progress: 0,
      request,
      result_urls: [],
      thumbnail_urls: [],
      credit_cost: validation.estimated_credits,
      created_at: now,
      updated_at: now,
      provider_job_id: response.id,
    };
  }

  async getStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }> {
    const providerJobId = jobId.replace("ltx_", "");

    try {
      const response = await this.makeRequest<LTXStatusResponse>(`/predictions/${providerJobId}`);

      const statusMap: Record<string, JobStatus> = {
        starting: "preparing_model",
        processing: "generating",
        succeeded: "completed",
        failed: "failed",
        canceled: "cancelled",
      };

      const status = statusMap[response.status] || "generating";
      const progress = response.status === "succeeded" ? 100 : response.status === "processing" ? 50 : 10;

      return {
        status,
        progress,
        resultUrls: response.output,
        error: response.error,
        failureType: response.error ? "generation_failed" : undefined,
      };
    } catch (error) {
      return {
        status: "failed",
        progress: 0,
        error: error instanceof Error ? error.message : "Failed to get status",
        failureType: "provider_error",
      };
    }
  }

  async cancel(jobId: string): Promise<void> {
    const providerJobId = jobId.replace("ltx_", "");
    await this.makeRequest(`/predictions/${providerJobId}/cancel`, { method: "POST" });
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const providerJobId = jobId.replace("ltx_", "");
    const response = await this.makeRequest<LTXGenerateResponse>(`/predictions/${providerJobId}/retry`, { method: "POST" });

    return {
      id: `ltx_${response.id}`,
      user_id: "current_user",
      project_id: null,
      status: "queued",
      progress: 0,
      request: { parameters: {} } as any,
      result_urls: [],
      thumbnail_urls: [],
      credit_cost: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider_job_id: response.id,
    };
  }
}