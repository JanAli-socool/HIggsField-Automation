import type { VercelRequest, VercelResponse } from "@vercel/node";
import { protect } from "./authMiddleware.js";

export function withAuth(req: VercelRequest, res: VercelResponse): Promise<any> {
  return new Promise((resolve) => {
    const mockReq = {
      ...req,
      headers: {
        get: (name: string) => req.headers[name.toLowerCase()] || "",
        authorization: req.headers.authorization,
      },
    } as any;
    
    const mockRes = {
      ...res,
    } as any;
    
    let called = false;
    const next = () => {
      if (!called) {
        called = true;
        resolve(mockReq.user ? mockReq : null);
      }
    };
    
    protect(mockReq, mockRes, next).catch(() => resolve(null));
  });
}

export interface AuthenticatedRequest extends VercelRequest {
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}