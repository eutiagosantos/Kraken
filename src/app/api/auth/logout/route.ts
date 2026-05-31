import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z
  .object({ scope: z.enum(["local", "global"]).optional() })
  .optional();

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  const scope = parsed.success && parsed.data?.scope ? parsed.data.scope : "local";
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut({ scope });
  return NextResponse.json({ ok: true });
}
