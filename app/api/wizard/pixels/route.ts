import { NextResponse } from "next/server";

import type { WizardPixel } from "@/lib/mock-data/wizard";
import { getSessionUser } from "@/lib/api/session";

export async function GET() {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const data: WizardPixel[] = [];
  return NextResponse.json({ data });
}
