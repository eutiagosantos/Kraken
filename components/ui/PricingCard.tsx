"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { BillingCycle, PricingPlan } from "@/lib/pricing";
import { formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Button } from "./Button";

export interface PricingCardProps {
  plan: PricingPlan;
  billing: BillingCycle;
}

export function PricingCard({ plan, billing }: PricingCardProps) {
  const price =
    billing === "monthly" ? plan.monthlyPrice : plan.annualPricePerMonth;

  return (
    <motion.div
      layout
      whileHover={{
        y: plan.highlighted ? -2 : -4,
        boxShadow: plan.highlighted
          ? "0px 8px 32px rgba(113, 50, 245, 0.12)"
          : "0px 4px 24px rgba(0, 0, 0, 0.05)",
      }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative flex h-full flex-col rounded-card border bg-neutral-white p-8 max-sm:p-6",
        plan.highlighted
          ? "z-[1] border border-brand-purple shadow-card"
          : "border-neutral-border shadow-subtle"
      )}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={plan.highlighted ? "purple" : "neutral"}>
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

      <Button
        variant={plan.highlighted ? "primary" : "outlined"}
        className="mt-10 w-full"
      >
        {plan.cta}
      </Button>
    </motion.div>
  );
}
