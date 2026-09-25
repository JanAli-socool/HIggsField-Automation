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

interface FluxGenerateResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

interface FluxStatusResponse {
  id: string;
  status: string;
  progress: number;
  output?: string[];
  error?: string;
}

const FLUX_BASE_URL = "https://api.replicate.com/v1";
const FLUX_MODEL_VERSION = "black-forest-labs/flux-schnell";

export class FluxProvider extends BaseProvider implements GenerationProvider {
  readonly name = "FluxProvider";
  readonly supportedMediaTypes: GenerationParameters["media_type"][] = ["image"];
  readonly supportedModels: GenerationParameters["model"][] = ["flux_schnell"];
  readonly maxDuration = 30;
  readonly maxResolution = { width: 1440, height: 1440 };

  constructor(config: ProviderConfig) {
    super({ ...config, baseUrl: config.baseUrl || FLUX_BASE_URL });
  }

  async validate(request: GenerationRequest): Promise<ValidationResult> {
    const { parameters } = request;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parameters.prompt || parameters.prompt.trim().length < 3) {
      errors.push("Prompt must be at least 3 characters");
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
      selected_model: "flux_schnell",
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
    const width = parameters.width || Math.min(this.maxResolution!.width, 1024);
    const height = parameters.height || Math.round(width * (h / w));

    const input = {
      prompt: parameters.prompt,
      negative_prompt: parameters.negative_prompt || "",
      width,
      height,
      num_outputs: parameters.num_outputs || 1,
      num_inference_steps: parameters.steps || 4,
      guidance_scale: parameters.guidance_scale || 3.5,
      seed: parameters.seed,
      output_format: "png",
      output_quality: parameters.quality === "high" ? 95 : 80,
    };

    const response = await this.makeRequest<FluxGenerateResponse>("/predictions", {
      method: "POST",
      body: JSON.stringify({
        version: FLUX_MODEL_VERSION,
        input,
        webhook: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate`,
        webhook_events_filter: ["completed", "failed"],
      }),
    });

    const jobId = `flux_${response.id}`;
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
    const providerJobId = jobId.replace("flux_", "");

    try {
      const response = await this.makeRequest<FluxStatusResponse>(`/predictions/${providerJobId}`);

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
    const providerJobId = jobId.replace("flux_", "");
    await this.makeRequest(`/predictions/${providerJobId}/cancel`, { method: "POST" });
  }

  async retry(jobId: string): Promise<GenerationJob> {
    const providerJobId = jobId.replace("flux_", "");
    const response = await this.makeRequest<FluxGenerateResponse>(`/predictions/${providerJobId}/retry`, { method: "POST" });

    return {
      id: `flux_${response.id}`,
      user_id: "current_user",
      project_id: null,
      status: "queued",
      progress: 0,
      request: { parameters: {} } as any,
      result_urls: [],
      thumbnail_urls: [],
      credit_cost: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider_job_id: response.id,
    };
  }
}