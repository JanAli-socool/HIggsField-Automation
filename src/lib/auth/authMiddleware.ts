import { verifyToken } from "./jwt.js";
import { CustomError, catchAsync } from "./errors.js";
import { AuthRequest } from "./types.js";
import prisma from "../db/client.js";

export const protect = catchAsync(async (req: AuthRequest, res: any, next: () => void) => {
  let token: string | undefined;

  const authHeader = (req.headers as any).authorization;
  if (authHeader?.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw CustomError.unauthorized("You are not logged in. Please log in to get access.");
  }

  const decoded = verifyToken(token);

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw CustomError.unauthorized("The user belonging to this token no longer exists.");
  }

  if (!user.isVerified) {
    throw CustomError.unauthorized("Please verify your email to access this resource.");
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    avatarUrl: user.avatarUrl || undefined,
  };

  next();
});

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: any, next: () => void) => {
    if (!req.user || !roles.includes((req.user as any).role || "user")) {
      throw CustomError.forbidden("You do not have permission to perform this action");
    }
    next();
  };
};