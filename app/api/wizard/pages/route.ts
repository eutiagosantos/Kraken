import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import { fetchUserFacebookPages, mapUserFacebookPagesToPublic } from "@/lib/meta/graph-user-pages";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";

export async function GET() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const tokenRes = await getMetaGraphAccessToken(supabase, user.id);
  if ("error" in tokenRes) {
    return NextResponse.json({ error: tokenRes.error }, { status: 400 });
  }

  try {
    const pages = await fetchUserFacebookPages(tokenRes.accessToken);
    return NextResponse.json({ data: mapUserFacebookPagesToPublic(pages) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não foi possível listar as páginas Facebook.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
