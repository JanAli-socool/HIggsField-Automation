import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../src/lib/auth/config.js";
import prisma from "../../../src/lib/db/client.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (session?.user?.id) {
    await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });
  }

  res.setHeader("Set-Cookie", [
    "next-auth.session-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "next-auth.callback-url=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "next-auth.csrf-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  ]);

  return res.status(200).json({ success: true });
}