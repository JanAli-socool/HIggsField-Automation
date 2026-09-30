import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse, ApiError } from "@/types/api.js";
import bcrypt from "bcryptjs";
import { login, logout, me, register, verifyEmail, forgotPassword, resetPassword } from "@/lib/auth/controller.js";
import { validateRequest } from "@/lib/auth/middleware.js";
import { loginSchema, registerSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/auth/validators.js";

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

function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action as string || req.body?.action;

  try {
    switch (action) {
      case "register": {
        await validateRequest(registerSchema)(req as any, res as any, async () => {
          await register(req as any, res as any);
        });
        break;
      }
      case "login": {
        await validateRequest(loginSchema)(req as any, res as any, async () => {
          await login(req as any, res as any);
        });
        break;
      }
      case "logout": {
        await logout(req as any, res as any);
        break;
      }
      case "me": {
        await me(req as any, res as any);
        break;
      }
      case "verify-email": {
        await validateRequest(verifyEmailSchema)(req as any, res as any, async () => {
          await verifyEmail(req as any, res as any);
        });
        break;
      }
      case "forgot-password": {
        await validateRequest(forgotPasswordSchema)(req as any, res as any, async () => {
          await forgotPassword(req as any, res as any);
        });
        break;
      }
      case "reset-password": {
        await validateRequest(resetPasswordSchema)(req as any, res as any, async () => {
          await resetPassword(req as any, res as any);
        });
        break;
      }
      default:
        return errorResponse(res, "INVALID_ACTION", "Invalid action. Use: register, login, logout, me, verify-email, forgot-password, reset-password", 400, requestId);
    }
  } catch (error) {
    console.error(`[${requestId}] Auth error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", "Authentication failed", 500, requestId);
  }
}