# E-mail de confirmação de cadastro (produção)

Configuração necessária no **Supabase Dashboard** do projeto ligado à Vercel para e-mails de confirmação chegarem e o link funcionar.

## 1. URL Configuration

**Authentication → URL Configuration**

| Campo | Valor |
|-------|-------|
| Site URL | `https://kraken-sigma-three.vercel.app` |
| Redirect URLs | `https://kraken-sigma-three.vercel.app/api/auth/callback` |

Confirme que **Enable email confirmations** está ativo em **Authentication → Providers → Email**.

## 2. SMTP customizado

O mailer built-in do Supabase (free tier) tem quota baixa (~2 e-mails/hora) e entrega instável. Configure SMTP real:

**Authentication → Emails → SMTP Settings**

Exemplo com [Resend](https://resend.com):

| Campo | Valor |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) ou `587` (TLS) |
| User | `resend` |
| Password | API key Resend |
| Sender email | endereço de domínio verificado (ex. `noreply@seudominio.com`) |
| Sender name | `Kraken` |

## 3. Variáveis na Vercel

Confirme que apontam para o projeto **hosted**, não local:

- `NEXT_PUBLIC_SUPABASE_URL` → `https://<project-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key do mesmo projeto

## 4. Debug

**Authentication → Logs** — após um cadastro, verifique se há envio de e-mail ou erro (`rate_limit`, `smtp_error`).

## 5. Fluxo na app

1. Utilizador regista-se em `/cadastro`
2. Supabase envia e-mail com link para `/api/auth/callback?next=/home`
3. Callback troca o `code` por sessão e redireciona para `/home`
4. Se o e-mail não chegar, usar **Reenviar e-mail de confirmação** no cadastro ou login
