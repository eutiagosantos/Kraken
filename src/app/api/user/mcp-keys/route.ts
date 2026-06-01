import { NextResponse } from "next/server";
import { z } from "zod";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import {
  insertMcpApiKey,
  listActiveMcpApiKeysByUserId,
} from "@/libs/database/queries/mcp-api-keys";
import { postgresErrorMessage } from "@/libs/database/postgres-error";
import { generateApiKey } from "@/libs/mcp/api-key";

const postBodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

export async function GET() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  try {
    const data = await listActiveMcpApiKeysByUserId(user.id);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  const raw = await request.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const { plaintext, prefix, hash } = generateApiKey();
  const name = parsed.data.name?.trim() || "Chave MCP";

  try {
    const data = await insertMcpApiKey({
      userId: user.id,
      name,
      keyPrefix: prefix,
      keyHash: hash,
    });

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        keyPrefix: data.key_prefix,
        createdAt: data.created_at,
        plaintext,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}
