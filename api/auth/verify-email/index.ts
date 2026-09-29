import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyEmail } from "../../../../src/lib/auth/controller.js";
import { validateRequest } from "../../../../src/lib/auth/middleware.js";
import { verifyEmailSchema } from "../../../../src/lib/auth/validators.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  await validateRequest(verifyEmailSchema)(req as any, res as any, async () => {
    await verifyEmail(req as any, res as any);
  });
}