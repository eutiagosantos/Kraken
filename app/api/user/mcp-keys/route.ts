import { NextResponse } from "next/server";
import { z } from "zod";

import { assertProtectedApiRoute } from "@/lib/api/route-protection";
import { generateApiKey } from "@/lib/mcp/api-key";

const postBodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

export async function GET() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, name, key_prefix, last_used_at, created_at, revoked_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  const raw = await request.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const { plaintext, prefix, hash } = generateApiKey();
  const name = parsed.data.name?.trim() || "Chave MCP";

  const { data, error } = await supabase
    .from("mcp_api_keys")
    .insert({
      user_id: user.id,
      name,
      key_prefix: prefix,
      key_hash: hash,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Falha ao criar chave." }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      name: data.name,
      keyPrefix: data.key_prefix,
      createdAt: data.created_at,
      plaintext,
    },
  });
}
