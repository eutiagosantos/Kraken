export type McpToolCategory = "Leitura" | "Pesquisa" | "Sincronização" | "Publicação";

export type McpToolParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type McpToolDoc = {
  name: string;
  category: McpToolCategory;
  description: string;
  params: McpToolParam[];
  responseExample: string;
};

export const MCP_DOCS_SECTIONS = [
  { id: "intro", label: "Introdução" },
  { id: "instalacao", label: "Instalação" },
  { id: "autenticacao", label: "Autenticação" },
  { id: "tools", label: "Referência de Tools" },
  { id: "publish-flow", label: "Fluxo de Publicação" },
  { id: "seguranca", label: "Segurança" },
] as const;

export const MCP_DOCS_TOOLS: McpToolDoc[] = [
  {
    name: "list_ad_accounts",
    category: "Leitura",
    description: "Lista contas de anúncios Meta vinculadas ao utilizador autenticado.",
    params: [],
    responseExample: `{
  "accounts": [
    {
      "id": "uuid",
      "meta_account_id": "act_123",
      "name": "Minha Conta",
      "nickname": "Principal",
      "status": "active"
    }
  ]
}`,
  },
  {
    name: "list_campaigns",
    category: "Leitura",
    description: "Lista campanhas guardadas no Kraken para este utilizador.",
    params: [
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Máximo de resultados (1–100, padrão 50).",
      },
    ],
    responseExample: `{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Campanha Verão",
      "account_name": "Minha Conta",
      "status": "ACTIVE"
    }
  ]
}`,
  },
  {
    name: "get_dashboard",
    category: "Leitura",
    description: "KPIs do dashboard, jobs recentes, atividade e biblioteca de criativos.",
    params: [],
    responseExample: `{
  "kpis": [],
  "uploads": [],
  "activities": [],
  "creatives": []
}`,
  },
  {
    name: "list_upload_jobs",
    category: "Leitura",
    description: "Lista jobs de upload/publicação (fila de processamento).",
    params: [
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Máximo de resultados (1–50, padrão 20).",
      },
    ],
    responseExample: `{
  "jobs": [
    {
      "id": "uuid",
      "status": "processing",
      "account_name": "MCP",
      "done": 2,
      "total": 5
    }
  ]
}`,
  },
  {
    name: "get_publish_status",
    category: "Leitura",
    description: "Consulta o estado de um job de publicação pelo ID.",
    params: [
      {
        name: "jobId",
        type: "string (uuid)",
        required: true,
        description: "ID do upload_jobs devolvido por publish_campaign.",
      },
    ],
    responseExample: `{
  "job": {
    "id": "uuid",
    "status": "done",
    "done": 5,
    "total": 5
  }
}`,
  },
  {
    name: "list_workspaces",
    category: "Leitura",
    description: "Lista workspaces aos quais o utilizador pertence.",
    params: [],
    responseExample: `{
  "workspaces": [
    {
      "id": "uuid",
      "name": "Agência X",
      "role": "owner"
    }
  ]
}`,
  },
  {
    name: "list_notifications",
    category: "Leitura",
    description: "Feed de eventos de atividade (notificações).",
    params: [
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Máximo de resultados (1–50, padrão 20).",
      },
    ],
    responseExample: `{
  "notifications": [
    {
      "id": "uuid",
      "type": "publish",
      "message": "Campanha publicada",
      "created_at": "2026-05-30T12:00:00Z"
    }
  ]
}`,
  },
  {
    name: "search_interests",
    category: "Pesquisa",
    description: "Pesquisa interesses de segmentação Meta por palavra-chave.",
    params: [
      {
        name: "query",
        type: "string",
        required: true,
        description: "Termo de pesquisa (1–200 caracteres).",
      },
    ],
    responseExample: `{
  "interests": [
    { "id": "6003139266461", "name": "Marketing digital" }
  ]
}`,
  },
  {
    name: "search_locations",
    category: "Pesquisa",
    description: "Pesquisa segmentação geográfica (países, regiões, cidades).",
    params: [
      {
        name: "query",
        type: "string",
        required: true,
        description: "Termo de pesquisa (1–200 caracteres).",
      },
    ],
    responseExample: `{
  "locations": [
    { "key": "2430536", "name": "São Paulo", "type": "city" }
  ]
}`,
  },
  {
    name: "list_facebook_pages",
    category: "Pesquisa",
    description: "Lista Páginas Facebook acessíveis com o token Meta do utilizador.",
    params: [],
    responseExample: `{
  "pages": [
    { "id": "123456789", "name": "Minha Página" }
  ]
}`,
  },
  {
    name: "list_pixels",
    category: "Pesquisa",
    description: "Lista pixels Meta por conta. Sem accountIds, usa todas as contas ligadas.",
    params: [
      {
        name: "accountIds",
        type: "string[]",
        required: false,
        description: "IDs Meta das contas (act_…).",
      },
    ],
    responseExample: `{
  "pixels": [
    { "id": "987654321", "name": "Pixel Loja", "accountId": "123" }
  ]
}`,
  },
  {
    name: "list_catalogs",
    category: "Pesquisa",
    description: "Lista catálogos de produtos para um Business ID Meta.",
    params: [
      {
        name: "businessId",
        type: "string",
        required: true,
        description: "ID do negócio Meta.",
      },
    ],
    responseExample: `{
  "catalogs": [
    { "id": "catalog_id", "name": "Catálogo Principal" }
  ]
}`,
  },
  {
    name: "sync_ad_accounts",
    category: "Sincronização",
    description: "Sincroniza contas de anúncios a partir do token Meta guardado.",
    params: [],
    responseExample: `{
  "ok": true,
  "synced": 3
}`,
  },
  {
    name: "inspect_token",
    category: "Sincronização",
    description: "Inspeciona scopes de um token Meta e lista contas acessíveis.",
    params: [
      {
        name: "token",
        type: "string",
        required: true,
        description: "User access token Meta (mín. 10 caracteres).",
      },
    ],
    responseExample: `{
  "ok": true,
  "missingScopes": [],
  "accounts": [{ "id": "act_123", "name": "Conta" }]
}`,
  },
  {
    name: "link_facebook_page",
    category: "Sincronização",
    description: "Define a Página Facebook predefinida numa ou mais contas.",
    params: [
      {
        name: "pageId",
        type: "string",
        required: true,
        description: "ID da Página Facebook.",
      },
      {
        name: "metaAccountIds",
        type: "string[]",
        required: true,
        description: "IDs Meta das contas (1–50).",
      },
    ],
    responseExample: `{
  "ok": true,
  "updated": 2
}`,
  },
  {
    name: "update_account_defaults",
    category: "Sincronização",
    description: "Atualiza predefinições Kraken de uma conta (UUID interno de list_ad_accounts).",
    params: [
      {
        name: "accountId",
        type: "string (uuid)",
        required: true,
        description: "ID interno Kraken da conta.",
      },
      {
        name: "nickname",
        type: "string | null",
        required: false,
        description: "Apelido da conta.",
      },
      {
        name: "defaultBudget",
        type: "number | null",
        required: false,
        description: "Orçamento predefinido.",
      },
      {
        name: "defaultStructure",
        type: "string | null",
        required: false,
        description: "Estrutura predefinida (ex.: 1-3-5).",
      },
      {
        name: "defaultAntiSpy",
        type: "boolean | null",
        required: false,
        description: "Anti-spy predefinido.",
      },
      {
        name: "facebookPageId",
        type: "string | null",
        required: false,
        description: "ID da Página Facebook.",
      },
      {
        name: "facebookPageName",
        type: "string | null",
        required: false,
        description: "Nome da Página Facebook.",
      },
    ],
    responseExample: `{
  "account": {
    "id": "uuid",
    "meta_account_id": "act_123",
    "nickname": "Principal"
  }
}`,
  },
  {
    name: "prepare_campaign",
    category: "Publicação",
    description: "Monta e valida o payload de publicação sem publicar no Meta.",
    params: [
      {
        name: "campaign",
        type: "object",
        required: true,
        description:
          "selectedAccountIds, creatives[], campaignType, budget, objective, publico, pageId, etc.",
      },
    ],
    responseExample: `{
  "preview": {
    "spendEstimate": { "budgetMinorPerDay": 5000, "accountCount": 1 },
    "selectedAccountIds": ["act_123"]
  },
  "payload": { "...": "wizard payload" },
  "nextStep": "Call publish_campaign with confirm:true"
}`,
  },
  {
    name: "publish_campaign",
    category: "Publicação",
    description: "Publica campanha no Meta. Requer confirm:true. Devolve jobId para polling.",
    params: [
      {
        name: "confirm",
        type: "boolean",
        required: true,
        description: "Deve ser true após rever prepare_campaign.",
      },
      {
        name: "campaign",
        type: "object",
        required: true,
        description: "Mesmos campos de prepare_campaign; criativos como URLs HTTPS.",
      },
    ],
    responseExample: `{
  "jobId": "uuid",
  "publishId": "uuid",
  "okCount": 1,
  "total": 1,
  "results": [{ "ok": true, "accountId": "act_123" }]
}`,
  },
];

export const MCP_ENDPOINT_SNIPPETS = {
  local: "http://127.0.0.1:3000/api/mcp",
  production: "https://kraken-sigma-three.vercel.app/api/mcp",
  claudeDesktop: `{
  "mcpServers": {
    "kraken": {
      "url": "https://kraken-sigma-three.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer kr_mcp_SUA_CHAVE"
      }
    }
  }
}`,
  authHeader: `Authorization: Bearer kr_mcp_SUA_CHAVE`,
} as const;
