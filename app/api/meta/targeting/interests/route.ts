import { z } from "zod";
import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/lib/api/route-protection";
import { searchTargetingInterests } from "@/lib/meta/targeting";

const bodySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) {
    return protection.response;
  }

  const rawBody = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid payload.",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const options = await searchTargetingInterests(parsedBody.data.q);
    return NextResponse.json({ data: options });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to search interests.",
      },
      { status: 502 }
    );
  }
}
