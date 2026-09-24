import type {
  GenerationRequest,
  GenerationJob,
  ValidationResult,
  GenerationParameters,
  JobStatus,
  FailureType,
} from "../../types/api";

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface GenerationProvider {
  readonly name: string;
  readonly supportedMediaTypes: GenerationParameters["media_type"][];
  readonly supportedModels: GenerationParameters["model"][];
  readonly maxDuration?: number;
  readonly maxResolution?: { width: number; height: number };

  validate(request: GenerationRequest): Promise<ValidationResult>;
  submit(request: GenerationRequest): Promise<GenerationJob>;
  getStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }>;
  cancel(jobId: string): Promise<void>;
  retry(jobId: string): Promise<GenerationJob>;
}

export abstract class BaseProvider implements GenerationProvider {
  abstract readonly name: string;
  abstract readonly supportedMediaTypes: GenerationParameters["media_type"][];
  abstract readonly supportedModels: GenerationParameters["model"][];
  abstract readonly maxDuration?: number;
  abstract readonly maxResolution?: { width: number; height: number };

  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract validate(request: GenerationRequest): Promise<ValidationResult>;
  abstract submit(request: GenerationRequest): Promise<GenerationJob>;
  abstract getStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }>;
  abstract cancel(jobId: string): Promise<void>;
  abstract retry(jobId: string): Promise<GenerationJob>;

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl || ""}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Provider error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Provider request timeout");
      }
      throw error;
    }
  }

  protected estimateCredits(params: GenerationParameters): number {
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
}

export class ValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ProviderError extends Error {
  constructor(message: string, public code: string, public retryable: boolean = false) {
    super(message);
    this.name = "ProviderError";
  }
}