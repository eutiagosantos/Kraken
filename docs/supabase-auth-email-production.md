# E-mail de confirmação de cadastro

**Estado atual:** confirmação por e-mail **desativada**. O cadastro cria a conta e redireciona para `/login`.

Para reativar no futuro (mais segurança), siga os passos abaixo.

## Desativar confirmação (configuração atual)

### Supabase Dashboard (produção — obrigatório)

**Authentication → Providers → Email** → desativar **Confirm email**.

Sem isto, contas novas em produção continuam a exigir confirmação mesmo com o código atualizado.

### Local (`supabase/config.toml`)

```toml
[auth.email]
enable_confirmations = false
```

---

## Reativar confirmação (futuro)

### 1. Código

- `RegisterForm`: usar `buildAuthCallbackUrl(origin, "/home")` em `emailRedirectTo` no `signUp` / `resend`
- `KrakenLoginForm`: tratar `email_not_confirmed` + botão reenviar
- `supabase/config.toml`: `enable_confirmations = true`

Helpers já existem em `lib/auth/build-auth-callback-url.ts` e `lib/auth/supabase-auth-error-message.ts`.

### 2. URL Configuration

**Authentication → URL Configuration**

| Campo | Valor |
|-------|-------|
| Site URL | `https://kraken-sigma-three.vercel.app` |
| Redirect URLs | `https://kraken-sigma-three.vercel.app/api/auth/callback` |

### 3. SMTP customizado

Configure SMTP real (**Authentication → Emails → SMTP Settings**). Exemplo Resend:

| Campo | Valor |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` ou `587` |
| User | `resend` |
| Password | API key Resend |
| Sender | domínio verificado |

### 4. Fluxo

1. `signUp` → e-mail com link para `/api/auth/callback?next=/home`
2. Callback faz `exchangeCodeForSession` → `/home`
