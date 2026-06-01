import type { NextRequest } from "next/server";

export { default, config } from "@/middleware";

/** @deprecated Supabase session middleware replaced by Clerk in src/middleware.ts */
export function isDashboardRoute(_request: NextRequest) {
  return false;
}

export async function updateSession(request: NextRequest) {
  return request;
}
