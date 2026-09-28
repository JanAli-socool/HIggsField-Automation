export type MediaType =
  | "image"
  | "image_to_image"
  | "image_edit"
  | "inpainting"
  | "text_to_video"
  | "image_to_video"
  | "first_frame_to_video"
  | "first_and_last_frame_to_video";

export type ImageModel = "flux_schnell" | "sdxl" | "qwen_image";
export type VideoModel = "wan21" | "ltx" | "hunyuan";

export type Model = ImageModel | VideoModel;

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9";

export type Quality = "preview" | "standard" | "high";

export type CameraMotion =
  | "none"
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down"
  | "zoom_in"
  | "zoom_out"
  | "dolly_in"
  | "dolly_out"
  | "orbit"
  | "tracking"
  | "handheld";

export type JobStatus =
  | "queued"
  | "validating_input"
  | "preparing_model"
  | "generating"
  | "encoding"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

export type FailureType =
  | "invalid_input"
  | "unsupported_parameters"
  | "provider_timeout"
  | "provider_error"
  | "insufficient_credits"
  | "content_rejected"
  | "generation_failed"
  | "storage_error";

export interface GenerationParameters {
  media_type: MediaType;
  model: Model;
  prompt: string;
  negative_prompt?: string;
  input_image_url?: string;
  mask_url?: string;
  first_frame_image_url?: string;
  last_frame_image_url?: string;
  width: number;
  height: number;
  aspect_ratio: AspectRatio;
  num_outputs: number;
  steps?: number;
  guidance_scale?: number;
  seed?: number;
  strength?: number;
  quality: Quality;
  duration_seconds?: number;
  fps?: number;
  motion_strength?: number;
  camera_motion?: CameraMotion;
}

export interface GenerationRequest {
  project_id?: string;
  parameters: GenerationParameters;
  idempotency_key?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimated_credits: number;
  selected_model: Model;
  resolved_parameters: GenerationParameters;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  project_id: string | null;
  media_type?: string;
  model?: string;
  original_prompt?: string;
  enhanced_prompt?: string;
  negative_prompt?: string;
  status: JobStatus;
  progress: number;
  input_asset_url?: string | null;
  mask_url?: string | null;
  first_frame_image_url?: string | null;
  last_frame_image_url?: string | null;
  output_asset_urls?: string[];
  result_urls?: string[];
  thumbnail_urls?: string[];
  parameters?: GenerationParameters;
  request?: GenerationRequest;
  provider_job_id?: string | null;
  credit_cost?: number;
  error_message?: string | null;
  failure_type?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface GenerationJobListItem {
  id: string;
  status: JobStatus;
  progress: number;
  media_type: MediaType;
  model: Model;
  prompt: string;
  thumbnail_url: string | null;
  created_at: string;
  completed_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  request_id: string;
}

export interface UploadResponse {
  url: string;
  expires_at: string;
}

export interface CreditBalance {
  id: string;
  user_id: string;
  balance: number;
  total_purchased: number;
  total_consumed: number;
  updated_at: string;
}

export interface CreditCosts {
  image_generation: number;
  image_editing: number;
  video_preview: number;
  standard_video: number;
  premium_video: number;
  upscaling: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  last_used: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  balance_id: string;
  amount: number;
  type: string;
  description: string | null;
  generation_id: string | null;
  created_at: string;
}

export interface Upload {
  id: string;
  user_id: string;
  url: string;
  type: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  expires_at: string;
  created_at: string;
}

export interface EnhancePromptRequest {
  prompt: string;
  media_type: MediaType;
  style?: string;
}

export interface EnhancePromptResponse {
  enhanced_prompt: string;
  negative_prompt: string;
  model_recommendation: Model;
  parameters: Partial<GenerationParameters>;
  reasoning: string;
}

export interface WorkflowSelectRequest {
  prompt: string;
  media_type?: MediaType;
  input_image_url?: string;
  mask_url?: string;
}

export interface WorkflowSelectResponse {
  media_type: MediaType;
  workflow: "image" | "text_to_image" | "image_to_image" | "image_edit" | "inpainting" | "text_to_video" | "image_to_video" | "first_frame_to_video" | "first_and_last_frame_to_video";
  recommended_model: Model;
  required_inputs: string[];
  reasoning: string;
}