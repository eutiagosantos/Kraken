This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Meta (publicação com app em Development)

Para testar o fluxo de publicação com a app Facebook ainda em modo **Development** (sandbox da Meta: papéis na app, test ad account, página), segue o guia em [docs/meta-publicacao-app-development.md](docs/meta-publicacao-app-development.md).

## Supabase: email de confirmação de cadastro

O HTML e o assunto do email de confirmação estão em [`supabase/templates/confirm-signup.html`](supabase/templates/confirm-signup.html) e em [`supabase/config.toml`](supabase/config.toml) na secção `[auth.email.template.confirmation]` (assunto: **Confirme o seu e-mail — Kraken**).

**Local (CLI):** com `enable_confirmations = true` em `[auth.email]`, após `supabase stop && supabase start` os emails aparecem no Inbucket em [http://127.0.0.1:54324](http://127.0.0.1:54324) (requer Docker a correr).

**Produção (projeto hospedado):** o `config.toml` não sincroniza automaticamente com o cloud. No [Dashboard do Supabase](https://supabase.com/dashboard) → **Authentication** → **Email Templates** → **Confirm signup**, cola o **mesmo** assunto e o conteúdo HTML do ficheiro `supabase/templates/confirm-signup.html`, e confirma que **Site URL** e redirects batem certo com o domínio da app (para o logo `{{ .SiteURL }}/kraken-logo.png` e para o fluxo pós-confirmação).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
