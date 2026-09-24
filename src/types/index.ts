export interface Effect {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string;
  model: string;
  tags: string[];
  isNew: boolean;
  isTrending: boolean;
  isPro: boolean;
  duration: string;
  resolution: string;
}

export interface Model {
  id: string;
  name: string;
  tagline: string;
  thumbnailUrl: string;
  capabilities: ModelCapability[];
  maxDuration: string;
  resolution: string;
  priceTier: "free" | "pro" | "enterprise";
  description: string;
}

export type ModelCapability =
  | "4k"
  | "1min"
  | "character-consistency"
  | "lip-sync"
  | "camera-control"
  | "multi-model"
  | "real-time"
  | "upscale";

export interface Asset {
  type: "character" | "location" | "product";
  file: File | null;
  preview: string | null;
  url: string | null;
}

export interface GenerationRequest {
  mode: "prompt" | "template";
  prompt: string;
  modelId: string;
  effectId?: string;
  assets: {
    character: Asset;
    location: Asset;
    product: Asset;
  };
  resolution: "720p" | "1080p" | "4k";
  aspectRatio: "16:9" | "9:16" | "1:1";
  quality?: "preview" | "standard" | "high";
  steps?: number;
  guidanceScale?: number;
  seed?: number | null;
  strength?: number;
  durationSeconds?: number;
  fps?: number;
  motionStrength?: number;
  cameraMotion?: string;
  numOutputs?: number;
  projectId?: string;
  parameters?: any;
}

export interface GenerationJob {
  id: string;
  request: GenerationRequest;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  resultUrl?: string;
  resultUrls?: string[];
  thumbnailUrls?: string[];
  createdAt: string;
  errorMessage?: string;
  failureType?: string;
  userId?: string;
  projectId?: string;
  user_id?: string;
  project_id?: string;
  result_urls?: string[];
  thumbnail_urls?: string[];
  created_at?: string;
  error_message?: string;
  failure_type?: string;
}

export type Category =
  | "all"
  | "trending"
  | "motion"
  | "transform"
  | "surreal"
  | "cinematic"
  | "commercial"
  | "character";

export interface CategoryItem {
  id: Category;
  label: string;
  count: number;
}

// Re-export API types for convenience
export type {
  MediaType,
  ImageModel,
  VideoModel,
  AspectRatio,
  Quality,
  CameraMotion,
  JobStatus,
  FailureType,
  GenerationParameters,
  GenerationRequest as ApiGenerationRequest,
  GenerationJob as ApiGenerationJob,
  GenerationJobListItem,
  PaginatedResponse,
  ValidationResult,
  UploadResponse,
  CreditBalance,
  CreditCosts,
  Project,
  User,
  EnhancePromptRequest,
  EnhancePromptResponse,
  WorkflowSelectRequest,
  WorkflowSelectResponse,
  ApiError,
  ApiResponse,
} from "./api";