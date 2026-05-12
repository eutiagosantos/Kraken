// Publicação do assistente → Meta. Sandbox com app em Development: docs/meta-publicacao-app-development.md
//
// Escopo de agendamento (voo, dayparting, frequência): aplicado apenas na criação via este POST.
// Alterar campanhas/conjuntos já existentes no Meta (PATCH / UI Campanhas) está fora do âmbito actual.
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Chunked upload de vídeos + espera de processamento pode ultrapassar o default de 10 s
// no Vercel Hobby; 300 s é o máximo permitido no plano Pro.
export const maxDuration = 300;

import { getSessionUser } from "@/lib/api/session";
import { normalizeActId } from "@/lib/meta/graph-campaign-publish";
import { fetchUserFacebookPages, pageIdInUserPages } from "@/lib/meta/graph-user-pages";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { wizardPublishPayloadSchema } from "@/lib/meta/map-wizard-to-graph";
import { runWizardPublish } from "@/lib/meta/publish-campaigns";
import type { Database } from "@/lib/supabase/types";
import {
  validateCreativeStoragePathsForUser,
  WIZARD_CREATIVES_BUCKET,
} from "@/lib/wizard/wizard-creatives-bucket";

function orderSelectedAccounts(
  selectedRaw: string[],
  rows: Array<{ meta_account_id: string; name: string }>
): Array<{ meta_account_id: string; name: string }> {
  const byNorm = new Map(rows.map((r) => [normalizeActId(r.meta_account_id), r]));
  const seen = new Set<string>();
  const ordered: Array<{ meta_account_id: string; name: string }> = [];
  for (const raw of selectedRaw) {
    const n = normalizeActId(raw);
    if (seen.has(n)) continue;
    seen.add(n);
    const row = byNorm.get(n);
    if (row) ordered.push(row);
  }
  return ordered;
}

function mimeFromCreativeType(type: "image" | "video", blobType: string | undefined): string {
  if (blobType && blobType.trim()) return blobType;
  return type === "image" ? "image/jpeg" : "video/mp4";
}

async function removeStorageObjects(
  supabase: SupabaseClient<Database>,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(WIZARD_CREATIVES_BUCKET).remove(paths);
  if (error) {
    console.warn("[wizard/publish] storage cleanup:", error.message);
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type deve ser application/json (inclui creativeStoragePaths)." },
      { status: 400 }
    );
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = wizardPublishPayloadSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const cleanupPaths = [...parsed.data.creativeStoragePaths];
  const deleteCreativesAfterPublish = process.env.WIZARD_DELETE_CREATIVES_AFTER_PUBLISH === "true";

  try {
    const pathErr = validateCreativeStoragePathsForUser(
      user.id,
      parsed.data.creativeStoragePaths,
      parsed.data.creatives.length,
      parsed.data.publishOperationId
    );
    if (pathErr) {
      return NextResponse.json({ error: pathErr }, { status: 400 });
    }

    const { data: pendingJob, error: jobLookupErr } = await supabase
      .from("upload_jobs")
      .select("id,status")
      .eq("id", parsed.data.publishOperationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (jobLookupErr || !pendingJob) {
      return NextResponse.json(
        { error: "Operação de publicação inválida ou não encontrada." },
        { status: 400 }
      );
    }
    if (pendingJob.status !== "awaiting_creatives") {
      return NextResponse.json(
        { error: "Esta operação já foi iniciada ou concluída. Inicia uma nova publicação." },
        { status: 400 }
      );
    }

    const pageId = parsed.data.pageId?.trim() || process.env.META_DEFAULT_PAGE_ID?.trim();
    if (!pageId) {
      return NextResponse.json(
        {
          error:
            "Escolhe uma Página Facebook no passo dos criativos (ou define META_DEFAULT_PAGE_ID só para desenvolvimento local).",
        },
        { status: 400 }
      );
    }

    const adLinkUrl = process.env.META_AD_LINK_URL?.trim() || "https://www.facebook.com/business";

    const tokenRes = await getMetaGraphAccessToken(supabase, user.id);
    if ("error" in tokenRes) {
      return NextResponse.json({ error: tokenRes.error }, { status: 400 });
    }

    try {
      const userPages = await fetchUserFacebookPages(tokenRes.accessToken);
      if (!pageIdInUserPages(pageId, userPages)) {
        return NextResponse.json(
          {
            error:
              "Este pageId não corresponde a nenhuma Página Facebook à qual a tua conta Meta tem acesso. Escolhe outra página no assistente ou reconecta o Meta (permissões pages_show_list e pages_manage_ads).",
          },
          { status: 400 }
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "pages_fetch_failed";
      return NextResponse.json(
        { error: `Não foi possível validar a Página Facebook: ${message}` },
        { status: 502 }
      );
    }

    const normIds = Array.from(new Set(parsed.data.selectedAccountIds.map((id) => normalizeActId(id))));
    const { data: accountRows, error: accErr } = await supabase
      .from("meta_ad_accounts")
      .select("meta_account_id, name")
      .eq("user_id", user.id)
      .in("meta_account_id", normIds);

    if (accErr) {
      return NextResponse.json({ error: accErr.message }, { status: 500 });
    }
    if (!accountRows?.length || accountRows.length !== normIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais contas selecionadas não existem ou não pertencem ao teu utilizador." },
        { status: 400 }
      );
    }

    const accountsOrdered = orderSelectedAccounts(parsed.data.selectedAccountIds, accountRows);
    const storagePaths = parsed.data.creativeStoragePaths;
    const creativeFilesByIndex = new Map<number, { buffer: Buffer; mimeType: string }>();

    for (let i = 0; i < parsed.data.creatives.length; i++) {
      const path = storagePaths[i];
      const { data: blob, error: dlErr } = await supabase.storage.from(WIZARD_CREATIVES_BUCKET).download(path);
      if (dlErr || !blob) {
        return NextResponse.json(
          { error: dlErr?.message ?? `Não foi possível descarregar o criativo em «${path}».` },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await blob.arrayBuffer());
      if (!buf.length) {
        return NextResponse.json({ error: `Ficheiro vazio em «${path}».` }, { status: 400 });
      }
      const creative = parsed.data.creatives[i];
      creativeFilesByIndex.set(i, {
        buffer: buf,
        mimeType: mimeFromCreativeType(creative.type, blob.type),
      });
    }

    const out = await runWizardPublish({
      supabase,
      userId: user.id,
      accessToken: tokenRes.accessToken,
      payload: parsed.data,
      creativeFilesByIndex,
      pageId,
      adLinkUrl,
      accounts: accountsOrdered,
      existingPublishJobId: parsed.data.publishOperationId,
    });
    const okCount = out.results.filter((r) => r.ok).length;
    const body = {
      publishId: out.publishId,
      results: out.results,
      warnings: out.warnings,
      ...(okCount === 0
        ? { error: "Nenhuma publicação concluiu com sucesso no Meta." as const }
        : {}),
    };
    if (okCount === 0) {
      return NextResponse.json(body, { status: 422 });
    }
    return NextResponse.json(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "publish_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (deleteCreativesAfterPublish) {
      await removeStorageObjects(supabase, cleanupPaths);
    }
  }
}
