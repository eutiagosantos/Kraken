import { getMetaUserToken } from "@/libs/database/queries/meta-user-tokens";

/**
 * Loads the user's Meta Marketing API token stored at login (see syncMetaAdAccountsForUser).
 * Requires `ads_management`-class scopes on the Meta app for publish calls to succeed.
 */
export async function getMetaGraphAccessToken(
  userId: string
): Promise<{ accessToken: string } | { error: string }> {
  let data: Awaited<ReturnType<typeof getMetaUserToken>>;
  try {
    data = await getMetaUserToken(userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return { error: `Não foi possível ler o token Meta: ${message}` };
  }

  if (!data?.access_token) {
    return {
      error:
        "Sem token Meta guardado. Entre com Meta ou use «Reconectar conta» para sincronizar antes de publicar.",
    };
  }

  if (data.token_expires_at) {
    const exp = new Date(data.token_expires_at).getTime();
    if (Number.isFinite(exp) && exp < Date.now()) {
      return { error: "O token Meta expirou. Volte a entrar ou reconecte a conta Meta." };
    }
  }

  return { accessToken: data.access_token };
}
