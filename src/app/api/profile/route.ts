import { NextResponse } from "next/server";
import { z } from "zod";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import {
  getProfileFullName,
  updateProfileFullName,
} from "@/libs/database/queries/profiles";

const patchBodySchema = z.object({
  full_name: z.string().trim().min(1).max(200),
});

export async function GET() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  try {
    const full_name = await getProfileFullName(user.id);
    return NextResponse.json({ data: { id: user.id, full_name } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  const raw = await request.json().catch(() => ({}));
  const parsed = patchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "full_name inválido." }, { status: 400 });
  }

  try {
    const updated = await updateProfileFullName(user.id, parsed.data.full_name);
    if (!updated) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ data: { full_name: updated.full_name } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
