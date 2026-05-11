export type BillingCycle = "monthly" | "annual";

export type PlanId = "starter" | "pro" | "enterprise";

export interface PricingPlan {
  id: PlanId;
  name: string;
  badge: string;
  description: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "Ideal para iniciantes",
    description: "Comece a escalar com segurança e sem fricção.",
    monthlyPrice: 197,
    annualPricePerMonth: 163,
    features: [
      "Até 3 contas de anúncio",
      "Upload em massa guiado",
      "Modelos de campanha prontos",
      "Relatórios essenciais",
      "Suporte por e-mail",
      "Trial de 14 dias incluso",
    ],
    cta: "Começar trial",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Mais Popular",
    description: "Para times que publicam em volume todos os dias.",
    monthlyPrice: 397,
    annualPricePerMonth: 329,
    features: [
      "Contas de anúncio ilimitadas",
      "Automação completa em massa",
      "Anti-Spy e rotação de Fan Pages",
      "Biblioteca de criativos inteligente",
      "Aprovações e revisão em lote",
      "Integrações e webhooks",
      "Filas prioritárias de publicação",
      "Suporte prioritário no WhatsApp",
      "Trial de 14 dias incluso",
    ],
    cta: "Escolher Pro",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Para grandes operações",
    description: "Segurança, SLA e customização para alto volume.",
    monthlyPrice: 797,
    annualPricePerMonth: 661,
    features: [
      "Tudo do plano Pro",
      "Onboarding dedicado",
      "Gerente de sucesso",
      "Ambientes e permissões avançadas",
      "API dedicada e limites negociáveis",
      "Contratos e notas fiscais corporativas",
      "Trial de 14 dias incluso",
    ],
    cta: "Falar com vendas",
  },
];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
