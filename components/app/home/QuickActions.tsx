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
      <section className="rounded-card border border-dashboard-border bg-dashboard-surface p-5 shadow-subtle">
        <h3 className="font-display text-lg font-bold text-neutral-black">Ações rápidas</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {mockQuickActionsMeta.map((action) => {
            const Icon = icons[action.key];
            return (
              <motion.button
                key={action.key}
                type="button"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.18 }}
                onClick={() => {
                  if (action.key === "upload") scrollWizard();
                  else if (action.key === "duplicate") setDupOpen(true);
                  else if (action.href) router.push(action.href);
                }}
                className="flex flex-col items-start gap-3 rounded-xl border border-dashboard-border bg-dashboard-surface p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-dashboard-border-strong"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: action.bg, color: action.color }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-neutral-black">{action.label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-dashboard-muted">{action.description}</p>
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
              className="w-full max-w-sm rounded-card border border-dashboard-border bg-dashboard-surface p-6 shadow-card"
            >
              <p className="font-display text-lg font-bold text-neutral-black">Duplicar upload</p>
              <p className="mt-2 text-sm text-dashboard-muted">
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
