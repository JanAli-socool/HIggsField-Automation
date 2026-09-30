import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMe } from "@/lib/auth/controller.js";
import { protect } from "@/lib/auth/authMiddleware.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  await protect(req as any, res as any, async () => {
    await getMe(req as any, res as any);
  });
}