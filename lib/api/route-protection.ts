import type { NextRequest } from "next/server";

export function assertProtectedRoute(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  if (!hasSession) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized.",
    };
  }

  const expectedApiKey = process.env.META_TARGETING_INTERNAL_API_KEY;
  if (!expectedApiKey) {
    return {
      ok: false as const,
      status: 500,
      message: "Internal configuration missing.",
    };
  }

  const apiKey = request.headers.get("x-internal-api-key");
  if (apiKey !== expectedApiKey) {
    return {
      ok: false as const,
      status: 403,
      message: "Forbidden.",
    };
  }

  return {
    ok: true as const,
  };
}
