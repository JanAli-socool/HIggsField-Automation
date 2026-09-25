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

interface QwenGenerateResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

interface QwenStatusResponse {
  id: string;
  status: string;
  progress: number;
  output?: string[];
  error?: string;
}

const QWEN_BASE_URL = "https://api.replicate.com/v1";
const QWEN_MODEL_VERSION = "qwen/qwen-image:6b5f6c8e1f8b4c8a9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";

export class QwenImageProvider extends BaseProvider implements GenerationProvider {
  readonly name = "QwenImageProvider";
  readonly supportedMediaTypes: GenerationParameters["media_type"][] = ["image", "image_to_image", "image_edit"];
  readonly supportedModels: GenerationParameters["model"][] = ["qwen_image"];
  readonly maxDuration = 60;
  readonly maxResolution = { width: 1328, height: 1328 };

  constructor(config: ProviderConfig) {
    super({ ...config, baseUrl: config.baseUrl || QWEN_BASE_URL });
  }

  async validate(request: GenerationRequest): Promise<ValidationResult> {
    const { parameters } = request;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parameters.prompt || parameters.prompt.trim().length < 3) {
      errors.push("Prompt must be at least 3 characters");
    }

    if (["image_to_image", "image_edit"].includes(parameters.media_type)) {
      if (!parameters.input_image_url) {
        errors.push("Input image is required for this media type");
      }
    }

    if (parameters.width > this.maxResolution!.width || parameters.height > this.maxResolution!.height) {
      warnings.push(`Resolution exceeds maximum ${this.maxResolution!.width}x${this.maxResolution!.height}, will be downscaled`);
    }

    if (parameters.num_outputs > 4) {
      errors.push("Maximum 4 outputs allowed");
    }

    const estimatedCredits = this.estimateCredits(parameters);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimated_credits: estimatedCredits,
      selected_model: "qwen_image",
      resolved_parameters: parameters,
    };
  }

  async submit(request: GenerationRequest): Promise<GenerationJob> {
    const validation = await this.validate(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const { parameters } = request;
    const aspectRatio = parameters.aspect_ratio || "1:1";
    const [w, h] = aspectRatio.split(":").map(Number);
    const width = Math.min(parameters.width || 1024, this.maxResolution!.width);
    const height = Math.min(parameters.height || Math.round(width * (h / w)), this.maxResolution!.height);

    const input: Record<string, any> = {
      prompt: parameters.prompt,
      negative_prompt: parameters.negative_prompt || "",
      width,
      height,
      num_outputs: parameters.num_outputs || 1,
      num_inference_steps: parameters.steps || 50,
      guidance_scale: parameters.guidance_scale || 4.0,
      seed: parameters.seed,
      output_format: "png",
      output_quality: parameters.quality === "high" ? 95 : 80,
    };

    if (["image_to_image", "image_edit"].includes(parameters.media_type)) {
      input.image = parameters.input_image_url;
      input.strength = parameters.strength || 0.75;
    }

    const response = await this.makeRequest<QwenGenerateResponse>("/predictions", {
      method: "POST",
      body: JSON.stringify({
        version: QWEN_MODEL_VERSION,
        input,
        webhook: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate`,
        webhook_events_filter: ["completed", "failed"],
      }),
    });

    const jobId = `qwen_${response.id}`;
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
    const providerJobId = jobId.replace("qwen_", "");

    try {
      const response = await this.makeRequest<QwenStatusResponse>(`/predictions/${providerJobId}`);

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
    const providerJobId = jobId.replace("qwen_", "");
    await this.makeRequest(`/predictions/${providerJobId}/cancel`, { method: "POST" });
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const providerJobId = jobId.replace("qwen_", "");
    const response = await this.makeRequest<QwenGenerateResponse>(`/predictions/${providerJobId}/retry`, { method: "POST" });

    return {
      id: `qwen_${response.id}`,
      user_id: "current_user",
      project_id: null,
      status: "queued",
      progress: 0,
      request: { parameters: {} } as any,
      result_urls: [],
      thumbnail_urls: [],
      credit_cost: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider_job_id: response.id,
    };
  }
}