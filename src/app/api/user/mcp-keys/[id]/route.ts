import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/lib/api/route-protection";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("mcp_api_keys")
    .update({ revoked_at: now })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Chave não encontrada ou já revogada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
