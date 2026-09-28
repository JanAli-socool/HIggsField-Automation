import { getServerSession } from "next-auth";
import { authOptions } from "./config.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export interface AuthenticatedRequest extends VercelRequest {
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export async function withAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthenticatedRequest | null> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
      request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    });
    return null;
  }

  return {
    ...req,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
      avatarUrl: (session.user as any).avatarUrl || undefined,
    },
  } as AuthenticatedRequest;
}

export function getUserId(req: VercelRequest): string {
  if ("user" in req && req.user) {
    return (req as AuthenticatedRequest).user.id;
  }
  return "anonymous";
}