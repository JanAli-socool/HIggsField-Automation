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
  capabilities: string[];
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

export interface CategoryItem {
  id: string;
  label: string;
  count: number;
}

export interface Asset {
  type: "character" | "location" | "product";
  file: File | null;
  preview: string | null;
  url: string | null;
}

export interface AssetUploadResponse {
  url: string;
  thumbnails: string[];
  expires_at: string;
  size: number;
  width?: number;
  height?: number;
}

export interface Category {
  id: string;
  label: string;
  count: number;
}

// Re-export API types
export {
  GenerationRequest,
  GenerationParameters,
  ValidationResult,
  GenerationJob,
  GenerationJobListItem,
  PaginatedResponse,
  ApiError,
  ApiResponse,
  UploadResponse,
  CreditBalance,
  CreditCosts,
  Project,
  User,
  EnhancePromptRequest,
  EnhancePromptResponse,
  WorkflowSelectRequest,
  WorkflowSelectResponse,
  MediaType,
  Model as ApiModel,
  AspectRatio,
  Quality,
  CameraMotion,
  JobStatus,
  FailureType,
} from "./api.js";

// Data exports - only from effects.ts to avoid duplicates
export {
  effects,
  featuredEffects,
  categories,
} from "../data/effects.js";

export {
  models as modelData,
  capabilityLabels,
  capabilityColors,
} from "../data/models.js";