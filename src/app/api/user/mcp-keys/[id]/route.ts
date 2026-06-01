import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import { revokeMcpApiKeyForUser } from "@/libs/database/queries/mcp-api-keys";
import { postgresErrorMessage } from "@/libs/database/postgres-error";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  const now = new Date().toISOString();
  try {
    const data = await revokeMcpApiKeyForUser(user.id, params.id, now);
    if (!data) {
      return NextResponse.json({ error: "Chave não encontrada ou já revogada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}
