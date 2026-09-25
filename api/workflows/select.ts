import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WorkflowSelectRequest, WorkflowSelectResponse, ApiResponse, ApiError } from "../../../src/types/api.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  if (req.method !== "POST") {
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", request_id: requestId } });
  }

  try {
    const body = req.body as WorkflowSelectRequest;

    if (!body?.prompt || body.prompt.trim().length < 3) {
      return errorResponse(res, "INVALID_PROMPT", "Prompt must be at least 3 characters", 400, requestId);
    }

    const result = selectWorkflow(body.prompt, body.media_type, body.input_image_url, body.mask_url);

    return successResponse(res, result, requestId);
  } catch (error) {
    console.error("Workflow selection error:", error);
    return errorResponse(res, "WORKFLOW_SELECTION_FAILED", "Failed to select workflow", 500, requestId);
  }
}

function selectWorkflow(
  prompt: string,
  mediaTypeHint?: string,
  inputImageUrl?: string,
  maskUrl?: string
): WorkflowSelectResponse {
  const lowerPrompt = prompt.toLowerCase();

  if (mediaTypeHint) {
    return validateAndReturnWorkflow(mediaTypeHint, inputImageUrl, maskUrl, prompt);
  }

  const videoKeywords = [
    "video", "animation", "moving", "motion", "film", "cinematic", "footage",
    "timelapse", "slow motion", "camera move", "pan", "zoom", "tracking shot"
  ];

  const editKeywords = [
    "edit", "change", "modify", "replace", "remove", "add", "insert",
    "background", "style transfer", "make it", "turn into"
  ];

  const inpaintKeywords = [
    "inpaint", "fill in", "remove object", "remove person", "erase",
    "mask", "region", "area"
  ];

  const isVideo = videoKeywords.some(k => lowerPrompt.includes(k));
  const isEdit = editKeywords.some(k => lowerPrompt.includes(k));
  const isInpaint = inpaintKeywords.some(k => lowerPrompt.includes(k));

  let workflow: WorkflowSelectResponse["workflow"];
  let recommendedModel: WorkflowSelectResponse["recommended_model"];
  let requiredInputs: string[] = [];

  if (isVideo) {
    if (inputImageUrl && maskUrl) {
      workflow = "first_and_last_frame_to_video";
      recommendedModel = "wan21";
      requiredInputs = ["first_frame_image_url", "last_frame_image_url"];
    } else if (inputImageUrl) {
      workflow = "image_to_video";
      recommendedModel = "wan21";
      requiredInputs = ["input_image_url"];
    } else {
      workflow = "text_to_video";
      recommendedModel = "wan21";
    }
  } else if (isInpaint || maskUrl) {
    workflow = "inpainting";
    recommendedModel = "sdxl";
    requiredInputs = ["input_image_url", "mask_url"];
  } else if (isEdit || inputImageUrl) {
    workflow = "image_to_image";
    recommendedModel = "sdxl";
    requiredInputs = ["input_image_url"];
  } else {
    workflow = "image";
    recommendedModel = "flux_schnell";
  }

  const missingInputs = requiredInputs.filter(input => {
    if (input === "input_image_url") return !inputImageUrl;
    if (input === "mask_url") return !maskUrl;
    if (input === "first_frame_image_url") return !inputImageUrl;
    if (input === "last_frame_image_url") return true;
    return false;
  });

  if (missingInputs.length > 0) {
    if (workflow === "image_to_video") {
      workflow = "text_to_video";
      recommendedModel = "wan21";
      requiredInputs = [];
    } else if (workflow === "image_to_image") {
      workflow = "image";
      recommendedModel = "flux_schnell";
      requiredInputs = [];
    } else if (workflow === "inpainting") {
      workflow = "image_edit";
      recommendedModel = "sdxl";
      requiredInputs = ["input_image_url"];
    }
  }

  return {
    media_type: workflow as any,
    workflow: workflow as any,
    recommended_model: recommendedModel as any,
    required_inputs: requiredInputs,
    reasoning: `Detected ${workflow.replace(/_/g, " ")} from prompt analysis. ${inputImageUrl ? "Input image provided." : "No input image."} ${maskUrl ? "Mask provided." : ""}`,
  };
}

function validateAndReturnWorkflow(
  mediaType: string,
  inputImageUrl?: string,
  maskUrl?: string,
  _prompt?: string
): WorkflowSelectResponse {
  const workflowMap: Record<string, { workflow: string; model: string; inputs: string[] }> = {
    image: { workflow: "image", model: "flux_schnell", inputs: [] },
    image_to_image: { workflow: "image_to_image", model: "sdxl", inputs: ["input_image_url"] },
    image_edit: { workflow: "image_edit", model: "sdxl", inputs: ["input_image_url"] },
    inpainting: { workflow: "inpainting", model: "sdxl", inputs: ["input_image_url", "mask_url"] },
    text_to_video: { workflow: "text_to_video", model: "wan21", inputs: [] },
    image_to_video: { workflow: "image_to_video", model: "wan21", inputs: ["input_image_url"] },
    first_frame_to_video: { workflow: "first_frame_to_video", model: "wan21", inputs: ["first_frame_image_url"] },
    first_and_last_frame_to_video: { workflow: "first_and_last_frame_to_video", model: "wan21", inputs: ["first_frame_image_url", "last_frame_image_url"] },
  };

  const config = workflowMap[mediaType];
  if (!config) {
    return {
      media_type: "image" as any,
      workflow: "image" as any,
      recommended_model: "flux_schnell" as any,
      required_inputs: [],
      reasoning: `Unknown media type "${mediaType}", defaulting to image generation`,
    };
  }

  const missingInputs = config.inputs.filter(input => {
    if (input === "input_image_url") return !inputImageUrl;
    if (input === "mask_url") return !maskUrl;
    if (input === "first_frame_image_url") return !inputImageUrl;
    if (input === "last_frame_image_url") return true;
    return false;
  });

  return {
    media_type: config.workflow as any,
    workflow: config.workflow as any,
    recommended_model: config.model as any,
    required_inputs: config.inputs,
    reasoning: missingInputs.length > 0
      ? `Missing required inputs: ${missingInputs.join(", ")}`
      : `Selected ${config.workflow} with ${config.model}`,
  };
}