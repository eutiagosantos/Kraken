import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { assertProtectedRoute } from "@/lib/api/route-protection";
import { searchTargetingLocations } from "@/lib/meta/targeting";

const bodySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export async function POST(request: NextRequest) {
  const protection = assertProtectedRoute(request);
  if (!protection.ok) {
    return NextResponse.json({ error: protection.message }, { status: protection.status });
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
    const options = await searchTargetingLocations(parsedBody.data.q);
    return NextResponse.json({ data: options });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to search locations.",
      },
      { status: 502 }
    );
  }
}
