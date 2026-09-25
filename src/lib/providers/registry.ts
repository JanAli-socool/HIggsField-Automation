import { env } from "../env";
import type {
  GenerationRequest,
  GenerationJob,
  ValidationResult,
  GenerationParameters,
  JobStatus,
  FailureType,
} from "../../types/api";
import { GenerationProvider, ProviderConfig } from "./base";
import { MockProvider } from "./mock";
import { FluxProvider } from "./flux";
import { SDXLProvider } from "./sdxl";
import { QwenImageProvider } from "./qwen";
import { WanProvider } from "./wan";
import { LTXProvider } from "./ltx";
import { HunyuanProvider } from "./hunyuan";

type ModelName = GenerationParameters["model"];

interface ProviderInstance {
  provider: GenerationProvider;
  config: ProviderConfig;
}

function hasValidApiKey(): boolean {
  return !!env.REPLICATE_API_TOKEN && env.REPLICATE_API_TOKEN !== "mock_key";
}

class ProviderRegistry {
  private providers: Map<ModelName, ProviderInstance> = new Map();
  private defaultProvider: GenerationProvider;
  private useMock: boolean;

  constructor() {
    this.useMock = !hasValidApiKey();
    this.defaultProvider = new MockProvider({ apiKey: "mock_key" });
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    if (this.useMock) {
      console.log("[ProviderRegistry] No valid REPLICATE_API_TOKEN, using MockProvider for all models");
      // Register mock provider for all supported models
      const mockProvider = new MockProvider({ apiKey: "mock_key" });
      const allModels: ModelName[] = [
        "flux_schnell", "sdxl", "qwen_image",
        "wan21", "ltx", "hunyuan"
      ];
      for (const model of allModels) {
        this.register(model, mockProvider);
      }
      return;
    }

    const apiKey = env.REPLICATE_API_TOKEN;
    const baseUrl = env.REPLICATE_API_BASE;

    const config: ProviderConfig = {
      apiKey,
      baseUrl,
      timeout: 60000,
      maxRetries: 3,
    };

    this.register("flux_schnell", new FluxProvider(config));
    this.register("sdxl", new SDXLProvider(config));
    this.register("qwen_image", new QwenImageProvider(config));
    this.register("wan21", new WanProvider(config));
    this.register("ltx", new LTXProvider(config));
    this.register("hunyuan", new HunyuanProvider(config));
  }

  register(model: ModelName, provider: GenerationProvider): void {
    this.providers.set(model, { provider, config: { apiKey: "" } });
  }

  getProvider(model: ModelName): GenerationProvider {
    const instance = this.providers.get(model);
    if (instance) {
      return instance.provider;
    }
    console.warn(`No provider found for model ${model}, falling back to mock`);
    return this.defaultProvider;
  }

  getProviderForMediaType(mediaType: GenerationParameters["media_type"]): GenerationProvider {
    for (const [, instance] of this.providers) {
      if (instance.provider.supportedMediaTypes.includes(mediaType)) {
        return instance.provider;
      }
    }
    return this.defaultProvider;
  }

  getAllProviders(): GenerationProvider[] {
    return Array.from(this.providers.values()).map((i) => i.provider);
  }

  getSupportedModels(): ModelName[] {
    return Array.from(this.providers.keys());
  }

  isModelSupported(model: ModelName): boolean {
    return this.providers.has(model);
  }
}

export const providerRegistry = new ProviderRegistry();

export async function validateGeneration(request: GenerationRequest): Promise<ValidationResult> {
  const provider = providerRegistry.getProvider(request.parameters.model);
  return provider.validate(request);
}

export async function submitGeneration(request: GenerationRequest): Promise<GenerationJob> {
  const provider = providerRegistry.getProvider(request.parameters.model);
  return provider.submit(request);
}

export async function getGenerationStatus(jobId: string): Promise<{ status: JobStatus; progress: number; resultUrls?: string[]; error?: string; failureType?: FailureType }> {
  const provider = getProviderFromJobId(jobId);
  return provider.getStatus(jobId);
}

export async function cancelGeneration(jobId: string): Promise<void> {
  const provider = getProviderFromJobId(jobId);
  return provider.cancel(jobId);
}

export async function retryGeneration(jobId: string): Promise<GenerationJob> {
  const provider = getProviderFromJobId(jobId);
  return provider.retry(jobId);
}

function getProviderFromJobId(jobId: string): GenerationProvider {
  // If using mock mode or jobId is a UUID (not provider-prefixed), use mock
  if (providerRegistry.getProvider("flux_schnell") instanceof MockProvider) {
    return providerRegistry.getProvider("flux_schnell");
  }
  
  if (jobId.startsWith("flux_")) return providerRegistry.getProvider("flux_schnell");
  if (jobId.startsWith("sdxl_")) return providerRegistry.getProvider("sdxl");
  if (jobId.startsWith("qwen_")) return providerRegistry.getProvider("qwen_image");
  if (jobId.startsWith("wan_")) return providerRegistry.getProvider("wan21");
  if (jobId.startsWith("ltx_")) return providerRegistry.getProvider("ltx");
  if (jobId.startsWith("hunyuan_")) return providerRegistry.getProvider("hunyuan");
  if (jobId.startsWith("mock_")) return providerRegistry.getProvider("flux_schnell");
  
  // UUID-based job IDs (from mock mode) - use mock provider
  return providerRegistry.getProvider("flux_schnell");
}

export function getProviderByModel(model: ModelName): GenerationProvider {
  return providerRegistry.getProvider(model);
}