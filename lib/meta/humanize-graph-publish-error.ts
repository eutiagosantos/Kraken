import { GraphApiError } from "@/lib/meta/graph-client";

const META_APP_DEV_MODE_HINT_PT =
  "A app Meta usada no login (Facebook) está em modo Desenvolvimento. Para publicar anúncios reais: em developers.facebook.com, abre a app do Kraken e muda o modo para Live; confirma permissões (ads_management, páginas, etc.) e verificação comercial se a Meta pedir. Para testes com a app em Dev: usa conta de anúncios de teste, página e utilizador com papel Admin/Developer/Tester nessa app.";

function combinedGraphText(e: GraphApiError): string {
  const title = e.errorUserTitle?.trim() ?? "";
  const msg = e.message?.trim() ?? "";
  if (title && msg) return `${title}: ${msg}`;
  return msg || title;
}

/** When Meta rejects creatives because the OAuth app is still in Development mode. */
export function isMetaAppDevelopmentModeError(e: unknown): boolean {
  if (!(e instanceof GraphApiError)) return false;
  const blob = combinedGraphText(e).toLowerCase();
  return (
    blob.includes("modo de desenvolvimento") ||
    blob.includes("development mode") ||
    (blob.includes("created by an app") && blob.includes("development"))
  );
}

/** Actionable PT message + original Meta text for support. */
export function humanizeMetaAppDevelopmentModeError(e: GraphApiError): string {
  return `${META_APP_DEV_MODE_HINT_PT} (resposta Meta: ${combinedGraphText(e)})`;
}
