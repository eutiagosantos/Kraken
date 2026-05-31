"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Star } from "lucide-react";
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

  const cardContent = (
    <>
      {highlighted && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark px-3 py-1 text-xs font-semibold text-white">
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
          Mais Popular
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={highlighted ? "purple" : "neutral"}>{plan.badge}</Badge>
      </div>
      <h3 className="font-display text-2xl font-bold text-neutral-black">
        {plan.name}
      </h3>
      <p className="mt-2 text-sm text-neutral-gray">{plan.description}</p>

      <div className="mt-8 flex min-h-[4.5rem] flex-col gap-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${plan.id}-${billing}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-baseline gap-1"
          >
            <span className="font-display text-4xl font-extrabold tracking-tight text-neutral-black">
              {formatBRL(price)}
            </span>
            <span className="text-neutral-gray">/mês</span>
          </motion.div>
        </AnimatePresence>
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
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-neutral-black">
            <Check
              className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple"
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <MarketingButton
        href={plan.id === "enterprise" ? undefined : "/cadastro"}
        variant={highlighted ? "primary" : "outlined"}
        className={cn("mt-10 w-full", highlighted && "btn-shimmer")}
      >
        {plan.cta}
      </MarketingButton>
    </>
  );

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative flex h-full flex-col",
        highlighted && "pricing-card-pro rounded-card p-[2px]"
      )}
    >
      {highlighted ? (
        <div className="relative flex h-full flex-col overflow-hidden rounded-[14px] bg-white p-8 shadow-card max-sm:p-6">
          {cardContent}
        </div>
      ) : (
        <div className="relative flex h-full flex-col overflow-hidden rounded-card border border-neutral-border bg-white p-8 shadow-subtle max-sm:p-6">
          {cardContent}
        </div>
      )}
    </motion.div>
  );
}
