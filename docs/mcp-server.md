# Kraken MCP Server

Remote [Model Context Protocol](https://modelcontextprotocol.io/) server embedded in the Kraken Next.js app. Use it from **Claude Desktop**, **Claude Code**, **ChatGPT** (remote MCP), or the MCP Inspector to list ad accounts, research targeting, sync Meta config, and publish campaigns.

## Prerequisites

1. Kraken account with Meta token connected (Configurações → App Meta).
2. Migration `20260530120000_mcp_api_keys.sql` applied to Supabase.
3. Server env (Production on Vercel):
   - `SUPABASE_SERVICE_ROLE_KEY` — required for API key lookup and publish
   - `META_*` / `KRAKEN_ENCRYPTION_KEY` — same as web publish
   - Optional: `REDIS_URL` — SSE session resumability for MCP
   - Optional: `META_DEFAULT_PAGE_ID`, `META_AD_LINK_URL` — dev fallbacks

Redeploy after changing env vars.

## 1. Mint an API key

1. Open **Configurações** → **Acesso MCP (LLMs)**.
2. Click **Gerar chave**, copy the `kr_mcp_…` value (shown once).
3. Copy the connector JSON snippet (includes your deployment URL).

## 2. Endpoint

| Environment | URL |
|-------------|-----|
| Local | `http://127.0.0.1:3000/api/mcp` |
| Production | `https://kraken-sigma-three.vercel.app/api/mcp` |

Auth header on every request:

```http
Authorization: Bearer kr_mcp_<secret>
```

## 3. Connector snippets

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "kraken": {
      "url": "https://kraken-sigma-three.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer kr_mcp_YOUR_KEY"
      }
    }
  }
}
```

### ChatGPT / remote MCP clients

Use the same URL and `Authorization` header where the client supports custom HTTP headers for MCP.

### MCP Inspector (local smoke test)

```bash
npm run dev
npx @modelcontextprotocol/inspector
```

Point the inspector at `http://127.0.0.1:3000/api/mcp` and set the Bearer key.

## 4. Tools

| Tool | Description |
|------|-------------|
| `list_ad_accounts` | Linked Meta ad accounts |
| `list_campaigns` | Kraken campanhas |
| `get_dashboard` | KPIs, jobs, activity, creatives |
| `list_upload_jobs` | Publish queue |
| `get_publish_status` | Poll `upload_jobs` by `jobId` |
| `list_workspaces` | User workspaces |
| `list_notifications` | Activity feed |
| `search_interests` | Meta interest targeting |
| `search_locations` | Geo targeting |
| `list_facebook_pages` | Pages for the user token |
| `list_pixels` | Ad pixels per account |
| `list_catalogs` | Product catalogs (`businessId`) |
| `sync_ad_accounts` | Sync accounts from stored token |
| `inspect_token` | Scopes + accounts for a token string |
| `link_facebook_page` | Set page on accounts |
| `update_account_defaults` | Nickname, budget, structure, page |
| `prepare_campaign` | Build & validate payload (no publish) |
| `publish_campaign` | Requires `confirm: true`; returns `jobId` |

## 5. Publish flow (LLM)

1. `list_ad_accounts` — pick `meta_account_id` values.
2. `search_interests` / `search_locations` — build `publico`.
3. `list_facebook_pages` — set `pageId` on the campaign.
4. `prepare_campaign` — review `payload` and `spendEstimate`.
5. `publish_campaign` with `confirm: true` and the same `campaign` object (creatives as HTTPS URLs).
6. `get_publish_status` with returned `jobId` until `status` is terminal.

Large structures may return `deferred: true` (HTTP 202-style); keep polling `get_publish_status`.

## 6. Security

- Keys are stored as SHA-256 hashes; revoke in Configurações immediately if leaked.
- MCP uses the service role server-side but every query is scoped with your `user_id`.
- Invalid or revoked keys receive **401**.

## 7. Verification

```bash
npx vitest run lib/mcp
npm run lint:ci
npm run build
```
