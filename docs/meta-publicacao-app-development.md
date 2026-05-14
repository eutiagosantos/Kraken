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



# Kraken — Guia para App Review (Meta / Facebook Login + Marketing API)

Este documento resume **como o Kraken usa cada permissão** e o que preparar para a **análise da Meta** (textos, screencast, conformidade). Não substitui as [políticas oficiais](https://developers.facebook.com/policy/) nem a documentação de cada permissão no [developers.facebook.com](https://developers.facebook.com/docs/permissions/reference).

**Scopes atuais no OAuth (código):** ver `META_SCOPES` em `components/auth/KrakenLoginForm.tsx` e `components/auth/RegisterForm.tsx` — incluem `email`, `public_profile`, `ads_read`, `ads_management`, `business_management`, `pages_show_list`, `pages_manage_ads`, `pages_read_engagement`.

**Referência técnica interna:** `docs/meta-publicacao-app-development.md`, `lib/meta/graph-user-pages.ts`, `lib/meta/graph-page-posts.ts`, `lib/meta/graph-ad-accounts.ts`, `lib/meta/sync-ad-accounts.ts`, `app/api/wizard/pages/route.ts`, `app/api/wizard/page-posts/route.ts`, `components/app/contas-meta/FacebookPagesPanel.tsx`, `app/api/wizard/publish/route.ts`, `lib/meta/graph-campaign-publish.ts`, `lib/meta/publish-campaigns.ts`.

---

## `pages_show_list`

### Uso no Kraken

Listar as Páginas Facebook que o utilizador gere, para o assistente de publicação e validações no servidor. Implementação: `GET /me/accounts` em `lib/meta/graph-user-pages.ts` (`fetchUserFacebookPages`).

### Texto sugerido (formulário App Review — inglês comum)

> We use `pages_show_list` to display the Facebook Pages the user administers so they can select which Page is used as the identity for ad creatives in our campaign upload and publish flow. Data is fetched via Graph API `GET /me/accounts` and shown only to the authenticated user. We do not sell Page data.

### Relação com outras permissões

A Meta costuma exigir **`pages_show_list` em conjunto com `pages_manage_ads`** no mesmo envio — mantém as duas e descreve ambos os fluxos (lista de páginas + criativos/publicação ligados à Página).

---

## `pages_manage_ads`

### Uso no Kraken

Gerir e publicar anúncios em nome das contas de anúncios do utilizador, incluindo criativos associados à Página (ex. `object_story_spec`). O servidor valida que o `pageId` escolhido pertence às páginas devolvidas por `/me/accounts` (`app/api/wizard/publish/route.ts`).

### Texto sugerido

> We use `pages_manage_ads` so authenticated advertisers can create and manage Meta ads through our tool: we associate creatives with a Facebook Page they manage and publish campaigns via the Marketing API. Page IDs are validated against the user’s Page list. We only access Pages and ad objects the user has authorized.

---

## `business_management`

### Uso no Kraken

Ligar e sincronizar **contas de anúncios** acessíveis ao utilizador após o login Facebook: `GET /me/adaccounts` em `lib/meta/graph-ad-accounts.ts`, persistência em `lib/meta/sync-ad-accounts.ts` (Supabase), para o ecrã “Contas Meta” e o fluxo do assistente.

### Texto sugerido

> We use `business_management` to let users connect their Meta ad accounts to our workspace: we list ad accounts they have access to and sync id, name, and account status for display and campaign publishing. We do not manage unrelated Business assets beyond what is needed for ad account connection and publishing.

---

## `ads_read`

### Uso no Kraken

Leitura de dados de marketing necessários ao produto: pelo menos metadados de contas (`me/adaccounts` — `id`, `name`, `account_status`). Se no futuro existirem leituras de campanhas, anúncios ou insights via Graph, **atualiza este documento e o texto do App Review** para refletir chamadas reais.

### Texto sugerido

> We use `ads_read` to read ad account metadata and marketing objects the user owns so we can show connected accounts, statuses, and campaign-related information in the dashboard and wizard. We only read data for the logged-in user’s authorized ad accounts.

---

## `ads_management`

### Uso no Kraken

Criar e gerir campanhas, conjuntos de anúncios, anúncios e criativos via Marketing API (`lib/meta/graph-campaign-publish.ts`, `lib/meta/publish-campaigns.ts`).

### Texto sugerido

> We use `ads_management` to create and manage campaigns, ad sets, ads, and creatives on behalf of the authenticated user in their selected ad account, through our guided upload and publish workflow.

### Dependência: `pages_read_engagement`

O formulário da Meta pode exigir **`pages_read_engagement`** em conjunto com `ads_management` (Standard Access). No Kraken o scope está em `META_SCOPES` e o produto lê **publicações recentes da Página** e totais agregados de **reações** e **comentários** (resumos Graph) na aba **Páginas Facebook** de Contas Meta — ver secção `pages_read_engagement` abaixo e o screencast.

---

## `pages_read_engagement`

### Uso no Kraken

No ecrã **Contas Meta**, aba **Páginas Facebook**, o utilizador escolhe uma das Páginas listadas por `GET /me/accounts` e o servidor chama `GET /{page-id}/posts` com campos que incluem `reactions.summary(true)`, `comments.summary(true)` e `shares` (`lib/meta/graph-page-posts.ts`, exposto por `GET /api/wizard/page-posts` ou `POST /api/wizard/page-posts` com `pageAccessToken` opcional). Só são aceites `pageId` que pertençam à lista de páginas do token (`pageIdInUserPages`). Os dados são mostrados apenas ao utilizador autenticado.

**Token colado (Explorador da Graph API):** se `GET /me/accounts` não devolver `access_token` por página, o utilizador pode colar um **Page access token** gerado no Explorador para a **mesma app** que o Kraken (`META_APP_ID`); o servidor valida o token com `debug_token` (tipo `PAGE` e `profile_id` igual ao `pageId`).

**`read_insights`:** com este scope no token da Página (OAuth em `META_FACEBOOK_OAUTH_SCOPE_LIST` + reconexão), o servidor tenta também `GET /{post-id}/insights` para métricas lifetime `post_impressions` e `post_engaged_users` por publicação. Em modo **Live**, a Meta pode exigir **App Review** para `read_insights`.

### Quando pedir

O scope está pedido no OAuth porque o produto **lê** publicações da Página e contagens agregadas de engagement (reações e comentários) para visualização na própria app.

### Texto sugerido (formulário App Review — inglês comum)

> We use `pages_read_engagement` to show the authenticated user their recent Facebook Page posts and high-level engagement totals (reaction and comment counts from Graph API summaries) in our “Meta accounts” area, so they can review Page activity alongside ad setup. We only request Page IDs the user already manages via `/me/accounts`, and we do not sell Page data.

Se o comportamento mudar, atualiza este documento e o vídeo de review para refletir chamadas reais.

---

## `public_profile`

### Uso no Kraken

Parte standard do **Facebook Login**: identificação básica da sessão OAuth. O perfil mostrado no dashboard pode vir de Supabase (`useKrakenUser`); `public_profile` continua a ser o scope habitual do login com Facebook.

### Texto sugerido

> We use `public_profile` as part of Facebook Login to identify the user session (basic profile fields provided by the platform). We do not use this data for advertising outside our core product.

---

## `email`

### Uso no Kraken

Criar ou associar a conta na app (Supabase) ao iniciar sessão com Facebook.

### Texto sugerido

> We use `email` to create or link the user account in our app when signing in with Facebook.

---

## Marketing API Access Tier (Standard)

### Texto sugerido

> We request Standard Marketing API access so our customers—advertisers and agencies—can create and manage Facebook/Instagram campaigns, ad sets, and ads through Kraken’s workflow (creative upload, targeting, publish). API calls are made server-side with the user’s access token after OAuth; we store tokens securely and only for authorized users.

---

## Políticas e conformidade

- Ler [Platform Terms](https://developers.facebook.com/policy/) e a referência de cada permissão.
- Só aceitar “permitted use” se o uso for o **mínimo necessário** ao produto descrito.
- Manter **política de privacidade** pública (ex. rota `/privacidade`) coerente com o tratamento de tokens e dados Meta.

---

## Screencast (ponta a ponta)

Recomendação: gravar em **inglês** ou com legendas EN; mostrar a app em modo aceite para review (muitas vezes **Live**).

1. Abrir a app e iniciar **Facebook Login** com o diálogo de permissões visível (todos os scopes pedidos).
2. **Contas Meta** — sincronizar / listar contas de anúncios; na aba **Páginas Facebook**, seleccionar uma página e mostrar **publicações recentes** com reações e comentários (totais Graph).
3. **Assistente (upload)** — escolher conta de anúncios, **Página**, e passos relevantes (público, pixel, etc., conforme UI).
4. **Publicar** — ação que dispara a Marketing API; sucesso visível ou mensagem de erro clara; opcionalmente mostrar o resultado na Ads Manager de conta de teste.
5. Se existir no produto: **reconectar** / **desligar** Meta ou link para definições de privacidade.

Evitar cortes que ocultem o consentimento OAuth.

---

## Ligações de teste de API (App Dashboard)

Completar no **Meta for Developers** o que o painel pedir para o produto e o tier, por exemplo:

- Verificação comercial / acesso, conforme requisitos atuais da Meta.
- Utilizadores de teste, instruções para reviewers (conta de teste, BM de teste, **test ad account**).
- Consultar `docs/meta-publicacao-app-development.md` para comportamento em modo **Development** vs preparação para **Live** / review.

---

## Checklist rápido

| Item | Ação |
|------|------|
| `pages_show_list` + `pages_manage_ads` | Textos + vídeo mostrando lista de páginas e publicação com Página. |
| `pages_read_engagement` + `ads_management` | OAuth inclui `pages_read_engagement`; vídeo mostra aba Páginas + `GET .../posts` na UI e alinha o texto EN acima. Confirmar requisitos actuais da Meta antes de submeter. |
| `ads_read` | Texto alinhado a todas as leituras Graph reais. |
| Screencast | OAuth completo + fluxo até publicação (ou passo máximo possível em teste). |
| Privacidade | URL pública; consistente com armazenamento de tokens Meta. |

---

*Última atualização: conteúdo baseado no estado do repositório Kraken na data de elaboração deste ficheiro. Revê antes de cada submissão.*