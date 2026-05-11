# Publicação Kraken com app Meta em modo Desenvolvimento

Com a app Facebook em **Development**, a Marketing API só aceita fluxos válidos para o sandbox da app. Isto aplica-se ao `POST …/adcreatives` com `object_story_spec` (criação de post na Página).

## 1. Meta Developers (conta e test ad account)

1. Em [developers.facebook.com](https://developers.facebook.com/), abre a **mesma app** usada no login Meta do Kraken (OAuth / Supabase).
2. Em **App roles** (Administradores / Programadores / Testers), garante que a **conta Facebook** com que fazes login no Kraken tem um destes papéis.
3. Cria ou usa uma **test ad account** (produto Marketing API na app, ou documentação Meta “Test Ad Account”). Evita contas de anúncios reais de clientes enquanto a app estiver em Development.
4. Confirma que os **scopes** pedidos no login incluem o necessário para anúncios e páginas (ver `META_SCOPES` em `components/auth/KrakenLoginForm.tsx` e `RegisterForm.tsx`).

## 2. Kraken (assistente de publicação)

1. **Reconecta** o Meta se mudaste permissões ou papéis na app.
2. No assistente, escolhe **apenas** contas de anúncios compatíveis com o modo Dev (em geral a test ad account).
3. Escolhe uma **Página** que:
   - a tua conta Meta consiga gerir, e
   - apareça na listagem usada pelo Kraken (`GET /me/accounts` com o token atual).
4. O servidor valida `pageId` em `app/api/wizard/publish/route.ts` (`pageIdInUserPages`).

## 3. Variáveis de ambiente (opcional, local)

Definidas em `app/api/wizard/publish/route.ts`:

| Variável | Uso |
|----------|-----|
| `META_DEFAULT_PAGE_ID` | Fallback do `pageId` se o assistente não enviar um (útil em desenvolvimento local; tem de ser uma página a que o token tenha acesso). |
| `META_AD_LINK_URL` | URL de destino do criativo (link / CTA). Default: `https://www.facebook.com/business`. |

## 4. Erros comuns

- **“Post do criativo … app em modo de desenvolvimento”**: utilizador, página ou conta de anúncios fora do sandbox da app em Dev. Corrige papéis na app + test ad account + página gerida pela mesma identidade OAuth.
- Mensagem humanizada no código: `lib/meta/humanize-graph-publish-error.ts`.

## 5. Referência técnica no repo

- Publicação e validação de página: `app/api/wizard/publish/route.ts`
- Criação do criativo na Graph: `lib/meta/graph-campaign-publish.ts` (`graphCreateAdCreative`)
