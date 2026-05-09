"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, Copy, Upload, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { mockQuickActionsMeta } from "@/lib/mock-data";

const icons = {
  upload: Upload,
  connect: Users,
  duplicate: Copy,
  report: BarChart2,
} as const;

export function QuickActions() {
  const router = useRouter();
  const [dupOpen, setDupOpen] = useState(false);

  const scrollWizard = useCallback(() => {
    document.getElementById("upload-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <section className="rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle">
        <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-neutral-black">Ações rápidas</h3>
        <p className="mt-1 font-ui text-sm text-neutral-silver">Atalhos para o que você usa com mais frequência</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
          {mockQuickActionsMeta.map((action) => {
            const Icon = icons[action.key];
            return (
              <motion.button
                key={action.key}
                type="button"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] as const }}
                onClick={() => {
                  if (action.key === "upload") scrollWizard();
                  else if (action.key === "duplicate") setDupOpen(true);
                  else if (action.href) router.push(action.href);
                }}
                className="group flex flex-col items-start gap-3 rounded-btn border border-neutral-border bg-neutral-white p-4 text-left shadow-micro transition-all duration-200 hover:border-brand-purple/35 hover:shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/25"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-[1.03]"
                  style={{ backgroundColor: action.bg, color: action.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-ui text-base font-semibold text-neutral-black">{action.label}</p>
                  <p className="mt-0.5 font-ui text-sm leading-snug text-neutral-silver">{action.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {dupOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm rounded-card border border-neutral-border bg-neutral-white p-6 shadow-subtle"
            >
              <p className="font-display text-lg font-bold tracking-tight text-neutral-black">Duplicar upload</p>
              <p className="mt-2 font-ui text-sm leading-relaxed text-neutral-silver">
                Escolha um upload anterior para reutilizar — disponível em breve.
              </p>
              <Button className="mt-5 w-full" variant="secondary" onClick={() => setDupOpen(false)}>
                Fechar
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
