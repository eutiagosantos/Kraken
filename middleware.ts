import { NextResponse, type NextRequest } from "next/server";
import { isDashboardRoute } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  if (!isDashboardRoute(request)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("session");
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/home/:path*", "/campanhas/:path*", "/contas-meta/:path*", "/relatorios/:path*", "/configuracoes/:path*", "/upload/:path*"],
};
