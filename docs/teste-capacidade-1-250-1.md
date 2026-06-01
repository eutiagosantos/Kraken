# Teste de capacidade 1-250-1 (250 criativos)

Guia operacional para validar publicação em escala no Kraken. Pré-requisitos Meta: [meta-publicacao-app-development.md](./meta-publicacao-app-development.md).

## Pré-requisitos Meta (Development)

1. App Facebook em **Development**; a tua conta com papel Admin/Developer/Tester.
2. **Test ad account** ligada à app (não uses conta de cliente em Dev).
3. **Página Facebook** visível no assistente (`GET /me/accounts`).
4. Reconecta o Meta após alterar permissões.

Variáveis opcionais em `.env` local:

| Variável | Uso |
|----------|-----|
| `META_DEFAULT_PAGE_ID` | Fallback de página no servidor |
| `META_AD_LINK_URL` | URL «Saiba mais» (https) |
| `META_PUBLISH_CONCURRENCY` | Paralelismo Graph (default `5`, máx. `20`) |
| `WIZARD_PUBLISH_DEFERRED_MIN_ADSETS` | A partir de quantos conjuntos a publicação HTTP devolve `202` (default `100`) |
| `WIZARD_PUBLISH_DEFERRED` | `true` força modo diferido; `false` desativa |

## Gerar 250 criativos de teste

```bash
npm run generate-test-creatives
# ou: node scripts/generate-test-creatives.mjs 250 ./test-creatives-250
```

Ficheiros em `test-creatives-250/` (~600 B cada). No assistente, passo 1: seleccionar os 250 `.jpg` de uma vez.

## Configuração no assistente

| Campo | Valor recomendado |
|-------|-------------------|
| Estrutura | **`1-250-1`** (preset) ou custom `1 / 250 / 1` |
| Criativos | **250** ficheiros (um por conjunto) |
| Contas | **1** test ad account |
| Status | **`PAUSED`** |
| Tipo | **CBO** |
| Objetivo | **Tráfego** (`OUTCOME_TRAFFIC`) |
| URL | **https://…** válida |

## Fases de teste

### Fase A — Local (`npm run dev`)

1. Inicia o servidor e abre o assistente de upload.
2. Publica e acompanha a **fila de processamento** (polling 5 s).
3. Estruturas ≥100 conjuntos: o browser pode receber **`202`** e a publicação continua em segundo plano (Vercel `waitUntil` em deploy; local executa até ao fim na mesma ligação se `@vercel/functions` não diferir).

**Sucesso esperado**

- `upload_jobs.status` = `completed`
- `upload_jobs.summary.structureLabel` = `1-250-1`
- `campanhas.structure` = `1-250-1`, `ads_total` = `250`
- Meta Ads Manager: 1 campanha, 250 conjuntos, 250 anúncios (pausados)

### Fase B — Produção

Repetir com os mesmos ficheiros e **1 conta**. Registar:

- Tempo total até `completed` / `error`
- Header `X-Kraken-Publish-Phase` em falhas
- Se timeout: escada **50 → 100 → 250** criativos

## Escada de stress (se 250 falhar)

| Passo | Estrutura | Criativos |
|-------|-----------|-----------|
| 1 | `1-50-1` | 50 |
| 2 | custom `1-100-1` | 100 |
| 3 | `1-250-1` | 250 |

## Registo de resultados (template)

Preencher após cada corrida manual (Meta + assistente).

| Campo | Fase A (local) | Fase B (prod) |
|-------|----------------|---------------|
| Início / fim | _pendente_ | _pendente_ |
| `upload_jobs.status` | _pendente_ | _pendente_ |
| `done` / `total` (esperado 250/250) | _pendente_ | _pendente_ |
| `meta_ids.adSetIds.length` | _pendente_ | _pendente_ |
| HTTP `202 deferred` | _pendente_ | _pendente_ |
| Erro / fase | _pendente_ | _pendente_ |
| Warnings | _pendente_ | _pendente_ |

### Verificação automatizada no repo

```bash
npm run test:run -- lib/meta/publish-concurrency.test.ts lib/meta/map-wizard-to-graph.test.ts lib/meta/publish-campaigns.test.ts
npm run generate-test-creatives
```

## Diagnóstico rápido

| Sintoma | Causa provável |
|---------|----------------|
| Criativos ≠ 250 | Estrutura ou contagem de ficheiros incorrecta |
| `creative_storage_download` | TUS / bucket `wizard_creatives` |
| Timeout / 504 | Volume Graph > 300 s (usar modo diferido + escada) |
| Erro Dev Meta | Conta/página fora do sandbox |
| Job `error` com mensagem Graph | Rate limit ou política Meta — ver `error_details` |
