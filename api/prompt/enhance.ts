import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EnhancePromptRequest, EnhancePromptResponse, ApiResponse, ApiError } from "../../../src/types/api.js";

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function errorResponse(res: VercelResponse, code: string, message: string, status: number, requestId: string) {
  const error: ApiError = { code, message, request_id: requestId };
  return res.status(status).json({ error, request_id: requestId } as ApiResponse<never>);
}

function successResponse<T>(res: VercelResponse, data: T, requestId: string, status = 200) {
  return res.status(status).json({ data, request_id: requestId } as ApiResponse<T>);
}

const ENHANCEMENT_PROMPTS: Record<string, string> = {
  image: `Enhance this image generation prompt for FLUX.1-schnell. Make it detailed, specific, and optimized for high-quality output. Include details about composition, lighting, style, camera, and environment. Return only the enhanced prompt.`,
  image_to_image: `Enhance this image-to-image prompt for SDXL. Describe the desired transformation while preserving the source image's main subject and composition. Include strength guidance.`,
  image_edit: `Enhance this image editing instruction. Be specific about what to change, what to preserve, and the desired style.`,
  inpainting: `Enhance this inpainting prompt. Describe only what should be generated in the masked region, matching the surrounding style and lighting.`,
  text_to_video: `Enhance this video prompt for Wan 2.1. Include: subject, action, environment, camera movement, lens/framing, lighting, motion intensity, duration, temporal consistency, and negative constraints.`,
  image_to_video: `Enhance this image-to-video prompt for Wan 2.1. Preserve the source image's identity and composition. Describe subject movement, camera movement, environment changes, and temporal consistency.`,
  first_frame_to_video: `Enhance this first-frame-to-video prompt. Use the uploaded image as the opening frame. Describe what happens next with smooth continuity.`,
  first_and_last_frame_to_video: `Enhance this first-and-last-frame-to-video prompt. Generate a coherent transition between the two frames.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  if (req.method !== "POST") {
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", request_id: requestId } });
  }

  try {
    const body = req.body as EnhancePromptRequest;

    if (!body?.prompt || body.prompt.trim().length < 3) {
      return errorResponse(res, "INVALID_PROMPT", "Prompt must be at least 3 characters", 400, requestId);
    }

    if (!body.media_type) {
      return errorResponse(res, "MISSING_MEDIA_TYPE", "Media type is required", 400, requestId);
    }

    const enhanced = await simulateNemotronEnhancement(body.prompt, body.media_type, body.style);

    const response: EnhancePromptResponse = {
      enhanced_prompt: enhanced.enhanced_prompt,
      negative_prompt: enhanced.negative_prompt,
      model_recommendation: enhanced.model_recommendation,
      parameters: enhanced.parameters,
      reasoning: enhanced.reasoning,
    };

    return successResponse(res, response, requestId);
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return errorResponse(res, "ENHANCEMENT_FAILED", "Failed to enhance prompt", 500, requestId);
  }
}

async function simulateNemotronEnhancement(
  prompt: string,
  mediaType: string,
  _style?: string
): Promise<{
  enhanced_prompt: string;
  negative_prompt: string;
  model_recommendation: string;
  parameters: Record<string, any>;
  reasoning: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const modelMap: Record<string, string> = {
    image: "flux_schnell",
    image_to_image: "sdxl",
    image_edit: "sdxl",
    inpainting: "sdxl",
    text_to_video: "wan21",
    image_to_video: "wan21",
    first_frame_to_video: "wan21",
    first_and_last_frame_to_video: "wan21",
  };

  const enhancements: Record<string, { prefix: string; suffix: string }> = {
    image: {
      prefix: "Professional photography, ",
      suffix: ", 8k resolution, highly detailed, masterpiece, sharp focus, cinematic lighting, perfect composition",
    },
    text_to_video: {
      prefix: "Cinematic video, ",
      suffix: ", smooth motion, temporal consistency, high quality, 24fps, professional cinematography",
    },
  };

  const enh = enhancements[mediaType] || enhancements.image;

  return {
    enhanced_prompt: `${enh.prefix}${prompt}${enh.suffix}`,
    negative_prompt: "low quality, blurry, distorted, deformed, ugly, bad anatomy, watermark, text, signature, watermark, username, blurry, low resolution, pixelated, artifact, noise, grain, compression artifacts",
    model_recommendation: modelMap[mediaType] || "flux_schnell",
    parameters: {
      steps: mediaType.startsWith("image") ? 28 : undefined,
      guidance_scale: mediaType.startsWith("image") ? 5 : undefined,
      motion_strength: mediaType.startsWith("video") ? 0.6 : undefined,
      camera_motion: mediaType.startsWith("video") ? "none" : undefined,
    },
    reasoning: `Selected ${modelMap[mediaType] || "flux_schnell"} for ${mediaType}. Enhanced prompt with cinematic details, lighting, and quality modifiers. Added comprehensive negative prompt to avoid common artifacts.`,
  };
}