import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware((auth, request) => {
  if (isPublicRoute(request)) return;
  auth().protect();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|privacidade(?:/|$)|privacy-policy(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
