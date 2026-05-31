"use client";

import Link from "next/link";

import { messageIndicatesMetaAppDevelopmentMode } from "@/lib/meta/humanize-graph-publish-error";

type Props = {
  errorMessage: string;
};

/**
 * Shown under publish errors when the message indicates the Facebook app is in
 * Development mode. Optional `NEXT_PUBLIC_META_FACEBOOK_APP_ID` deep-links to that app.
 */
export function MetaAppDevModePublishHelp({ errorMessage }: Props) {
  if (!messageIndicatesMetaAppDevelopmentMode(errorMessage)) return null;

  const appId = process.env.NEXT_PUBLIC_META_FACEBOOK_APP_ID?.trim();
  const metaAppDashboardUrl = appId
    ? `https://developers.facebook.com/apps/${encodeURIComponent(appId)}/dashboard/`
    : "https://developers.facebook.com/apps/";

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-left text-sm text-amber-950">
      <p className="font-semibold text-amber-950">Próximos passos (Meta)</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>
          <strong>Produção:</strong> na app Facebook, muda o modo para <strong>Live</strong> e conclui App Review /
          verificação comercial se a Meta pedir.
        </li>
        <li>
          <strong>Só testes com a app em Development:</strong> adiciona o teu utilizador Facebook como Admin,
          Developer ou Tester na app; usa uma <strong>test ad account</strong> e uma Página acessível ao token.
        </li>
        <li>
          Depois de alterares permissões ou o modo da app,{" "}
          <Link href="/contas-meta" className="font-semibold text-brand-purple underline underline-offset-2">
            reconecta o Meta em Contas Meta
          </Link>
          .
        </li>
      </ul>
      <p className="mt-3">
        <a
          href={metaAppDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-purple underline underline-offset-2"
        >
          Abrir Meta for Developers
        </a>
        {appId ? null : (
          <span className="text-amber-900/80">
            {" "}
            (define <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_META_FACEBOOK_APP_ID</code> no env
            para abrir diretamente a tua app)
          </span>
        )}
      </p>
    </div>
  );
}
