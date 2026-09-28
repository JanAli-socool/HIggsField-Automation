import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Project, ApiResponse, ApiError, PaginatedResponse } from "../../src/types/api.js";
import prisma from "../../src/lib/db/client.js";
import { withAuth, AuthenticatedRequest } from "../../src/lib/auth/middleware.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = generateRequestId();
  res.setHeader("X-Request-ID", requestId);

  const authReq = await withAuth(req, res);
  if (!authReq) return;

  try {
    switch (req.method) {
      case "POST":
        return await handleCreate(req, res, requestId, authReq.user.id);
      case "GET":
        return await handleList(req, res, requestId, authReq.user.id);
      default:
        return errorResponse(res, "METHOD_NOT_ALLOWED", "Method not allowed", 405, requestId);
    }
  } catch (error) {
    console.error(`[${requestId}] Projects error:`, error);
    return errorResponse(res, "INTERNAL_ERROR", "An unexpected error occurred", 500, requestId);
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse, requestId: string, userId: string) {
  const { name, description } = req.body as { name: string; description?: string };

  if (!name || name.trim().length < 1) {
    return errorResponse(res, "INVALID_NAME", "Project name is required", 400, requestId);
  }

  const project = await prisma.project.create({
    data: {
      user_id: userId,
      name: name.trim(),
      description: description?.trim(),
    },
  });

  return successResponse(res, {
    id: project.id,
    user_id: project.user_id,
    name: project.name,
    description: project.description ?? undefined,
    created_at: project.created_at,
    updated_at: project.updated_at,
  }, requestId, 201);
}

async function handleList(req: VercelRequest, res: VercelResponse, requestId: string, userId: string) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.page_size as string) || 20));

  const where = { user_id: userId };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  const transformedProjects: Project[] = projects.map(p => ({
    id: p.id,
    user_id: p.user_id,
    name: p.name,
    description: p.description ?? undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const response: PaginatedResponse<Project> = {
    data: transformedProjects,
    total,
    page,
    page_size: pageSize,
    has_more: page * pageSize < total,
  };

  return successResponse(res, response, requestId);
}