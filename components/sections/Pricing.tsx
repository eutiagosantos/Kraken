"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import type { BillingCycle } from "@/lib/pricing";
import { pricingPlans } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { PricingCard } from "@/components/ui/PricingCard";

export function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <section id="planos" className="bg-neutral-white py-24 pb-28">
      <div />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-neutral-black tracking-tight">Planos e preços</h2>
          <p className="mt-4 text-lg leading-[1.38] text-neutral-gray">
            Escolha o ritmo da sua operação. Todo plano inclui trial gratuito:{" "}
            <span className="font-semibold text-brand-purple-dark">
              14 dias ou 1.000 anúncios criados — o que vier primeiro
            </span>
            .
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-10 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-1 rounded-[12px] border border-neutral-border bg-neutral-white p-1 shadow-subtle">
            <ToggleChip
              active={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              label="Mensal"
            />
            <ToggleChip
              active={billing === "annual"}
              onClick={() => setBilling("annual")}
              label={
                <span className="flex items-center gap-2">
                  Anual
                  <motion.span
                    layout
                    className="rounded-[6px] bg-semantic-green-bg px-2 py-0.5 text-xs font-semibold text-semantic-green-dark"
                  >
                    −17%
                  </motion.span>
                </span>
              }
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={billing}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-center text-sm font-medium leading-[1.43] text-neutral-gray"
            >
              {billing === "annual"
                ? "Economize comparado ao mensal — cobrança em ciclo anual."
                : "Máxima flexibilidade — altere para anual quando quiser."}
            </motion.p>
          </AnimatePresence>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-start">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                plan.highlighted && "max-lg:order-1",
                plan.id === "starter" && "max-lg:order-2",
                plan.id === "enterprise" && "max-lg:order-3"
              )}
            >
              <PricingCard plan={plan} billing={billing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-[10px] px-5 py-2 text-sm font-semibold transition-colors",
        active ? "text-neutral-black" : "text-neutral-gray hover:text-neutral-black"
      )}
    >
      {active && (
        <motion.span
          layoutId="pricing-toggle"
          className="absolute inset-0 rounded-[10px] bg-brand-purple-subtle shadow-micro ring-1 ring-brand-purple/20"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-[1] inline-flex items-center gap-2">{label}</span>
    </button>
  );
}
