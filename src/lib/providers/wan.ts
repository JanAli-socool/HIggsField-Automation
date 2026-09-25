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

interface WanGenerateResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

interface WanStatusResponse {
  id: string;
  status: string;
  progress: number;
  output?: string[];
  error?: string;
}

const WAN_BASE_URL = "https://api.replicate.com/v1";
const WAN_MODEL_VERSION = "wan-video/wan-2.1:1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3";

export class WanProvider extends BaseProvider implements GenerationProvider {
  readonly name = "WanProvider";
  readonly supportedMediaTypes: GenerationParameters["media_type"][] = [
    "text_to_video",
    "image_to_video",
    "first_frame_to_video",
    "first_and_last_frame_to_video",
  ];
  readonly supportedModels: GenerationParameters["model"][] = ["wan21"];
  readonly maxDuration = 30;
  readonly maxResolution = { width: 1280, height: 720 };

  constructor(config: ProviderConfig) {
    super({ ...config, baseUrl: config.baseUrl || WAN_BASE_URL });
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

    if (parameters.media_type === "first_and_last_frame_to_video") {
      if (!parameters.first_frame_image_url) errors.push("First frame image is required");
      if (!parameters.last_frame_image_url) errors.push("Last frame image is required");
    }

    if (parameters.duration_seconds && parameters.duration_seconds > this.maxDuration) {
      errors.push(`Duration exceeds maximum of ${this.maxDuration} seconds`);
    }

    if (parameters.num_outputs > 1) {
      warnings.push("Multiple outputs not fully supported, generating 1 output");
    }

    const estimatedCredits = this.estimateCredits(parameters);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimated_credits: estimatedCredits,
      selected_model: "wan21",
      resolved_parameters: parameters,
    };
  }

  async submit(request: GenerationRequest): Promise<GenerationJob> {
    const validation = await this.validate(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const { parameters } = request;
    const aspectRatio = parameters.aspect_ratio || "16:9";
    const [w, h] = aspectRatio.split(":").map(Number);
    const width = Math.min(parameters.width || 1280, this.maxResolution!.width);
    const height = Math.min(parameters.height || Math.round(width * (h / w)), this.maxResolution!.height);

    const input: Record<string, any> = {
      prompt: parameters.prompt,
      negative_prompt: parameters.negative_prompt || "",
      width,
      height,
      num_frames: parameters.duration_seconds ? parameters.duration_seconds * (parameters.fps || 24) : 120,
      fps: parameters.fps || 24,
      guidance_scale: parameters.guidance_scale || 5.0,
      num_inference_steps: parameters.steps || 30,
      seed: parameters.seed,
      motion_bucket_id: Math.round((parameters.motion_strength || 0.5) * 255),
      output_format: "mp4",
    };

    if (parameters.media_type === "image_to_video" || parameters.media_type === "first_frame_to_video") {
      input.image = parameters.first_frame_image_url || parameters.input_image_url;
    }

    if (parameters.media_type === "first_and_last_frame_to_video") {
      input.first_frame = parameters.first_frame_image_url;
      input.last_frame = parameters.last_frame_image_url;
    }

    if (parameters.camera_motion && parameters.camera_motion !== "none") {
      input.camera_motion = parameters.camera_motion;
    }

    const response = await this.makeRequest<WanGenerateResponse>("/predictions", {
      method: "POST",
      body: JSON.stringify({
        version: WAN_MODEL_VERSION,
        input,
        webhook: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate`,
        webhook_events_filter: ["completed", "failed"],
      }),
    });

    const jobId = `wan_${response.id}`;
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
    const providerJobId = jobId.replace("wan_", "");

    try {
      const response = await this.makeRequest<WanStatusResponse>(`/predictions/${providerJobId}`);

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
    const providerJobId = jobId.replace("wan_", "");
    await this.makeRequest(`/predictions/${providerJobId}/cancel`, { method: "POST" });
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const providerJobId = jobId.replace("wan_", "");
    const response = await this.makeRequest<WanGenerateResponse>(`/predictions/${providerJobId}/retry`, { method: "POST" });

    return {
      id: `wan_${response.id}`,
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