import type { VercelRequest, VercelResponse } from "@vercel/node";
import { logout } from "../../../../src/lib/auth/controller.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  await logout(req as any, res as any);
}