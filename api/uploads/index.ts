import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../src/types/api.js";
import { v4 as uuidv4 } from "uuid";
import { parseMultipartFormData } from "../../src/lib/upload/parser.js";
import { storage, generateThumbnail, generateVideoThumbnails } from "../../src/lib/storage/index.js";

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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  if (req.method !== "POST") {
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", request_id: requestId } });
  }

  try {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
      return errorResponse(res, "INVALID_CONTENT_TYPE", "Expected multipart/form-data", 400, requestId);
    }

    const { files, fields } = await parseMultipartFormData(req);

    const file = files.file?.[0];
    const type = fields.type?.[0] as "image" | "video" || "image";
    const generateThumbs = fields.generate_thumbnails?.[0] === "true";

    if (!file) {
      return errorResponse(res, "NO_FILE", "No file provided", 400, requestId);
    }

    const validation = validateFile(file, type);
    if (!validation.valid) {
      return errorResponse(res, "INVALID_FILE", validation.error!, 400, requestId);
    }

    const uploadId = uuidv4();
    const ext = file.name.split(".").pop() || (type === "image" ? "webp" : "mp4");
    const fileName = `uploads/${uploadId}.${ext}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await storage.upload(fileName, Buffer.from(file.buffer), {
      contentType: file.type,
      access: "public",
    });

    let thumbnails: string[] = [];
    if (generateThumbs && type === "video") {
      thumbnails = await generateVideoThumbnails(result.url, 3);
    } else if (type === "image") {
      thumbnails = [result.url];
    }

    return successResponse(res, {
      url: result.url,
      thumbnails,
      expires_at: expiresAt,
      size: file.size,
      width: undefined,
      height: undefined,
    }, requestId);

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(res, "UPLOAD_FAILED", "File upload failed", 500, requestId);
  }
}

function validateFile(file: { type: string; size: number; name: string }, type: "image" | "video"): { valid: boolean; error?: string } {
  if (type === "image") {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: "Image too large (max 10MB)" };
    }
  } else if (type === "video") {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: "Video too large (max 100MB)" };
    }
  }
  return { valid: true };
}