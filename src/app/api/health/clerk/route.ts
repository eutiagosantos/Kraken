import { NextResponse } from "next/server";

import { checkClerkEnv } from "@/libs/auth/clerk-env";

export async function GET() {
  const check = checkClerkEnv();
  if (!check.ok) {
    return NextResponse.json(check, { status: 503 });
  }
  return NextResponse.json(check);
}
