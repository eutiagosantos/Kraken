import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/libs/api/session";
import { getStorageSupabaseClient } from "@/libs/supabase/storage-server";
import { WIZARD_CREATIVES_BUCKET } from "@/libs/wizard/wizard-creatives-bucket";

const bodySchema = z.object({
  paths: z.array(z.string().min(1)).max(50),
});

export async function POST(request: Request) {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  for (const path of parsed.data.paths) {
    if (!path.startsWith(`${user.id}/`) || path.includes("..")) {
      return NextResponse.json({ error: "Caminho de storage inválido." }, { status: 400 });
    }
  }

  const supabase = getStorageSupabaseClient();
  const { error } = await supabase.storage.from(WIZARD_CREATIVES_BUCKET).remove(parsed.data.paths);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
