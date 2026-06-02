# Clerk em produção (Vercel)

Erro típico após deploy sem configurar Clerk:

```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
```

O middleware ([`src/middleware.ts`](../src/middleware.ts)) usa `clerkMiddleware`. Sem chaves válidas no ambiente de produção, o Edge Runtime falha em **todas** as rotas protegidas pelo matcher.

## Checklist

### 1. Chaves de produção no Clerk

1. [Clerk Dashboard](https://dashboard.clerk.com) → sua aplicação
2. **Configure → API Keys**
3. Selecione instância **Production** (não Development)
4. Copie:
   - **Publishable key** → `pk_live_...`
   - **Secret key** → `sk_live_...`

> Chaves `pk_test_` / `sk_test_` funcionam só em `localhost`. Em domínio Vercel causam falha no middleware.

### 2. Variáveis na Vercel (Production)

**Project → Settings → Environment Variables** — marque **Production** (e Preview se quiser o mesmo comportamento em PRs):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/cadastro` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/home` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/home` |
| `NEXT_PUBLIC_APP_URL` | `https://kraken-sigma-three.vercel.app` |

Referência completa: [`.env.example`](../.env.example).

> `NEXT_PUBLIC_APP_URL` fixa a URL canônica para redirects do Clerk e para enviar previews da Vercel para produção (ver secção abaixo).

Validar localmente (sem expor segredos no log):

```bash
node scripts/check-clerk-env.mjs --production
```

### 3. Redeploy

Env vars **não** entram em deployments já publicados.

1. Vercel → **Deployments** → último deploy → **Redeploy**
2. Ou push vazio / novo commit na branch de produção

### 4. Domínio no Clerk

1. Clerk Dashboard → **Configure → Domains**
2. Na instância **Production**, defina como primário: `kraken-sigma-three.vercel.app` (ou domínio custom)
3. Remova URLs wildcard de preview (`*.vercel.app` de branch/PR) se estiverem listadas
4. Em **Redirect URLs**, permita `https://kraken-sigma-three.vercel.app/*` para sign-in e sign-up
5. Siga DNS / verificação se usar domínio próprio

### 4b. Preview deployments (Vercel)

URLs do tipo `kraken-git-*-*.vercel.app` são **deploys de PR**, não produção. Sem configuração, cadastro/login e links de e-mail do Clerk podem abrir nesse host.

O middleware ([`src/middleware.ts`](../src/middleware.ts)) redireciona previews para `NEXT_PUBLIC_APP_URL` (ou `VERCEL_PROJECT_PRODUCTION_URL`). Configure na Vercel em **Production** e **Preview**:

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://kraken-sigma-three.vercel.app` |

**Hábito:** testar cadastro e login só em `https://kraken-sigma-three.vercel.app`, não em “Visit Deployment” de PR na Vercel.

### 5. Verificar após deploy

```bash
curl -sS "https://SEU_DOMINIO/api/health/clerk"
```

Resposta esperada:

```json
{"ok":true,"publishableKeyPrefix":"pk_live_","signInUrl":"/login"}
```

Se `ok: false`, o JSON indica o que falta (`missing`, `wrongKeyTypeForProduction`, etc.).

## Webhook (opcional)

Para sincronizar perfis via `POST /api/webhooks/clerk`:

1. Clerk → **Webhooks** → endpoint `https://SEU_DOMINIO/api/webhooks/clerk`
2. Vercel: `CLERK_WEBHOOK_SECRET` = signing secret do endpoint

## Desenvolvimento local

Use chaves **Development** (`pk_test_` / `sk_test_`) no `.env`. Mesmas variáveis de URL (`SIGN_IN`, `SIGN_UP`, etc.) que em produção.
