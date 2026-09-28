import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../src/lib/auth/config.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(200).json({ user: null });
  }

  return res.status(200).json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
      avatarUrl: (session.user as any).avatarUrl || undefined,
    },
  });
}