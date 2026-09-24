import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "../../../src/types/api";

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

const BLOCKED_TERMS = [
  "child sexual abuse",
  "csam",
  "minor",
  "underage",
  "rape",
  "sexual violence",
  "extreme violence",
  "terrorism",
  "terrorist",
  "self-harm",
  "suicide",
  "eating disorder",
  "anorexia",
  "bulimia",
];

const SUSPICIOUS_PATTERNS = [
    /\b(nude|naked|sex|porn|xxx|adult|erotic)\b/i,
    /\b(hate|racist|nazi|supremacist)\b/i,
    /\b(weapon|bomb|explosive|gun|knife)\b/i,
    /\b(drug|cocaine|heroin|methamphetamine)\b/i,
];

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  if (req.method !== "POST") {
    return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
  }

  try {
    const { prompt, image_url, video_url } = req.body as {
      prompt?: string;
      image_url?: string;
      video_url?: string;
    };

    if (!prompt && !image_url && !video_url) {
      return errorResponse(res, "MISSING_CONTENT", "No content provided for moderation", 400, requestId);
    }

    const results: ModerationResult[] = [];

    if (prompt) {
      results.push(moderateText(prompt));
    }

    if (image_url) {
      results.push(await moderateImage(image_url));
    }

    if (video_url) {
      results.push(await moderateVideo(video_url));
    }

    const flagged = results.some(r => r.flagged);
    const categories = results.flatMap(r => r.categories);
    const reason = results.find(r => r.flagged)?.reason;

    return successResponse(res, {
      flagged,
      categories: [...new Set(categories)],
      reason,
      results,
    }, requestId);

  } catch (error) {
    console.error(`[${requestId}] Moderation error:`, error);
    return errorResponse(res, "MODERATION_FAILED", "Content moderation failed", 500, requestId);
  }
}

function moderateText(text: string): ModerationResult {
  const lowerText = text.toLowerCase();

  for (const term of BLOCKED_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      return {
        flagged: true,
        categories: ["blocked_content"],
        reason: `Blocked term detected: ${term}`,
      };
    }
  }

  const suspiciousCategories: string[] = [];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        suspiciousCategories.push(match[0].toLowerCase());
      }
    }
  }

  return {
    flagged: suspiciousCategories.length > 0,
    categories: suspiciousCategories,
    reason: suspiciousCategories.length > 0 ? `Suspicious content detected: ${suspiciousCategories.join(", ")}` : undefined,
  };
}

async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  if (process.env.MODERATION_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MODERATION_API_KEY}`,
        },
        body: JSON.stringify({
          input: [{ type: "image_url", image_url: { url: imageUrl } }],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const flagged = result.results[0]?.flagged || false;
        const categories = Object.entries(result.results[0]?.categories || {})
          .filter(([, v]) => v)
          .map(([k]) => k);

        return {
          flagged,
          categories,
          reason: flagged ? "Image flagged by moderation API" : undefined,
        };
      }
    } catch (error) {
      console.error("Image moderation API error:", error);
    }
  }

  return { flagged: false, categories: [] };
}

async function moderateVideo(videoUrl: string): Promise<ModerationResult> {
  if (process.env.MODERATION_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MODERATION_API_KEY}`,
        },
        body: JSON.stringify({
          input: [{ type: "video_url", video_url: { url: videoUrl } }],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const flagged = result.results[0]?.flagged || false;
        const categories = Object.entries(result.results[0]?.categories || {})
          .filter(([, v]) => v)
          .map(([k]) => k);

        return {
          flagged,
          categories,
          reason: flagged ? "Video flagged by moderation API" : undefined,
        };
      }
    } catch (error) {
      console.error("Video moderation API error:", error);
    }
  }

  return { flagged: false, categories: [] };
}