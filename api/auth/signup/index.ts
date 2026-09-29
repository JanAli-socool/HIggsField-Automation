import type { VercelRequest, VercelResponse } from "@vercel/node";
import { signup } from "../../../../src/lib/auth/controller";
import { validateRequest } from "../../../../src/lib/auth/middleware";
import { signupSchema } from "../../../../src/lib/auth/validators";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  await validateRequest(signupSchema)(req as any, res as any, async () => {
    await signup(req as any, res as any);
  });
}