import { createMcpHandler } from "mcp-handler";

import { resolveUserFromApiKey } from "@/libs/mcp/api-key";
import { createMcpContext } from "@/libs/mcp/context";
import { registerKrakenMcpTools } from "@/libs/mcp/register-tools";
import { runWithMcpContext } from "@/libs/mcp/request-context";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Optional: `REDIS_URL` for SSE session resumability (not Upstash REST). */
const redisUrl = process.env.REDIS_URL?.trim() || undefined;

const baseHandler = createMcpHandler(
  (server) => {
    registerKrakenMcpTools(server);
  },
  {},
  {
    basePath: "/api/mcp",
    maxDuration: 300,
    verboseLogs: process.env.NODE_ENV === "development",
    redisUrl,
  }
);

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

async function withMcpAuth(request: Request): Promise<Response> {
  const resolved = await resolveUserFromApiKey(request.headers.get("authorization"));
  if (!resolved) return unauthorizedResponse();

  const ctx = createMcpContext(resolved.userId);
  return runWithMcpContext(ctx, () => baseHandler(request));
}

export async function GET(request: Request): Promise<Response> {
  return withMcpAuth(request);
}

export async function POST(request: Request): Promise<Response> {
  return withMcpAuth(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return withMcpAuth(request);
}
