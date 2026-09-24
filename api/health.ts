import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiResponse } from "../../../src/types/api";
import prisma from "../../../src/lib/db/client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: { status: "connected", latency_ms: dbLatency },
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    } as ApiResponse<any>);
  } catch (error) {
    return res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: { status: "disconnected", error: String(error) },
      version: process.env.npm_package_version || "1.0.0",
    } as ApiResponse<any>);
  }
}