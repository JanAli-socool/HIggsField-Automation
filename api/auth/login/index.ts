import type { VercelRequest, VercelResponse } from "@vercel/node";
import { login } from "@/lib/auth/controller.js";
import { validateRequest } from "@/lib/auth/middleware.js";
import { loginSchema } from "@/lib/auth/validators.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  await validateRequest(loginSchema)(req as any, res as any, async () => {
    await login(req as any, res as any);
  });
}