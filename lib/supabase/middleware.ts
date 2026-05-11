import type { NextRequest } from "next/server";

export function isDashboardRoute(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/home") ||
    request.nextUrl.pathname.startsWith("/campanhas") ||
    request.nextUrl.pathname.startsWith("/contas-meta") ||
    request.nextUrl.pathname.startsWith("/relatorios") ||
    request.nextUrl.pathname.startsWith("/configuracoes") ||
    request.nextUrl.pathname.startsWith("/upload");
}
