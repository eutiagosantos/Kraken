"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { BillingCycle, PricingPlan } from "@/lib/pricing";
import { formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { MarketingButton } from "./MarketingButton";

export interface PricingCardProps {
  plan: PricingPlan;
  billing: BillingCycle;
}

export function PricingCard({ plan, billing }: PricingCardProps) {
  const price =
    billing === "monthly" ? plan.monthlyPrice : plan.annualPricePerMonth;
  const highlighted = plan.highlighted;

  return (
    <motion.div
      layout
      whileHover={{
        y: highlighted ? -2 : -4,
        boxShadow: highlighted
          ? "0px 12px 40px rgba(113, 50, 245, 0.14)"
          : "0px 4px 24px rgba(0, 0, 0, 0.05)",
      }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-card border bg-white p-8 max-sm:p-6",
        highlighted
          ? "z-[1] border-brand-purple shadow-card ring-1 ring-brand-purple/20"
          : "border-neutral-border shadow-subtle"
      )}
    >
      {highlighted && (
        <div
          className="absolute inset-x-0 top-0 h-1 bg-brand-purple"
          aria-hidden
        />
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={highlighted ? "purple" : "neutral"}>
          {plan.badge}
        </Badge>
      </div>
      <h3 className="font-display text-2xl font-bold text-neutral-black">
        {plan.name}
      </h3>
      <p className="mt-2 text-sm text-neutral-gray">{plan.description}</p>

      <div className="mt-8 flex flex-col gap-1">
        <motion.div
          key={`${plan.id}-${billing}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-baseline gap-1"
        >
          <span className="font-display text-4xl font-extrabold tracking-tight text-neutral-black">
            {formatBRL(price)}
          </span>
          <span className="text-neutral-gray">/mês</span>
        </motion.div>
        {billing === "annual" && (
          <p className="text-xs font-medium text-semantic-green">
            Cobrança anual · equivalente ao valor mensal acima
          </p>
        )}
      </div>

      <p className="mt-4 rounded-lg bg-brand-purple-subtle px-3 py-2 text-center text-sm font-semibold text-brand-purple">
        Trial gratuito: 14 dias ou 1.000 anúncios criados — o que ocorrer
        primeiro
      </p>

      <ul className="mt-8 flex flex-1 flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-sm text-neutral-black">
            <Check
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple"
              aria-hidden
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <MarketingButton
        href={plan.id === "enterprise" ? undefined : "/cadastro"}
        variant={highlighted ? "primary" : "outlined"}
        className="mt-10 w-full"
      >
        {plan.cta}
      </MarketingButton>
    </motion.div>
  );
}
