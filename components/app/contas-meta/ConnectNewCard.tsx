"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

import { META_ACCESS_TOKEN_SETTINGS_HREF } from "@/components/app/meta/MetaAccessTokenSection";
import { cn } from "@/lib/utils";

export function ConnectNewCard({
  href = META_ACCESS_TOKEN_SETTINGS_HREF,
  cardVariants,
}: {
  href?: string;
  cardVariants?: Variants;
}) {
  return (
    <motion.div layout variants={cardVariants} initial="hidden" animate="visible">
      <Link
        href={href}
        className={cn(
          "flex w-full rounded-card border-2 border-dashed border-[#dedee5] bg-[#fafafa] p-6 text-left outline-none transition-[border-color,background-color] hover:border-brand-purple hover:bg-[rgba(113,50,245,0.03)] focus-visible:ring-2 focus-visible:ring-brand-purple/30"
        )}
      >
        <div className="flex w-full flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple-subtle">
            <Plus className="h-6 w-6 text-brand-purple" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-neutral-black">Configurar Meta</p>
            <p className="mt-1 text-sm text-neutral-gray">
              Configure o token de acesso em Configurações
            </p>
          </div>
          <span className="rounded-btn bg-brand-purple-subtle px-4 py-2 text-sm font-semibold text-brand-purple">
            Ir para Configurações
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
