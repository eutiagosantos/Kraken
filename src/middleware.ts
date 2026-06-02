import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  buildCanonicalRedirectUrl,
  isPreviewDeploymentHost,
} from "@/libs/auth/canonical-app-origin";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/cadastro(.*)",
  "/privacidade(.*)",
  "/privacy-policy(.*)",
  "/docs(.*)",
  "/api/webhooks(.*)",
  "/api/health(.*)",
  "/robots.txt",
]);

const skipPreviewCanonicalRedirect = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/health(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (
    !skipPreviewCanonicalRedirect(request) &&
    isPreviewDeploymentHost(request.nextUrl.host)
  ) {
    return NextResponse.redirect(buildCanonicalRedirectUrl(request.nextUrl), 307);
  }

  if (isPublicRoute(request)) return;
  auth().protect();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|privacidade(?:/|$)|privacy-policy(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/__clerk/(.*)",
  ],
};
