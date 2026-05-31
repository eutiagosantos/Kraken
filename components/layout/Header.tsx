"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { MarketingButton } from "@/components/ui/MarketingButton";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Home", href: "#inicio" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Planos", href: "#planos" },
  { label: "Docs", href: "/docs/mcp" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-50 border-b border-neutral-border/60 bg-[#FAFAF7]/90 backdrop-blur-md transition-[box-shadow] duration-300 ease-in-out",
          scrolled && "shadow-micro"
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link
            href="#inicio"
            aria-label="Kraken"
            className="flex items-center text-brand-purple transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30 focus-visible:ring-offset-2"
          >
            <KrakenMarkTile size="landing" priority />
            <span className="sr-only">Kraken</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link-underline text-sm font-semibold text-neutral-gray transition-colors hover:text-neutral-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <MarketingButton
              href="/login"
              variant="outlined"
              className="px-4 py-2.5 text-sm"
            >
              Login
            </MarketingButton>
            <MarketingButton
              href="/cadastro"
              variant="subtle"
              className="btn-shimmer px-4 py-2.5 text-sm"
            >
              Cadastrar
            </MarketingButton>
            <MarketingButton
              href="#planos"
              variant="primary"
              className="btn-shimmer px-4 py-2.5 text-sm"
            >
              Ver Planos
            </MarketingButton>
          </div>

          <button
            type="button"
            className="inline-flex rounded-lg border border-neutral-border p-2 md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0 z-40 bg-neutral-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,320px)] flex-col border-l border-neutral-border bg-[#FAFAF7] shadow-subtle md:hidden"
            >
              <div className="flex items-center justify-between border-b border-neutral-border px-4 py-4">
                <span className="font-display font-bold text-brand-purple">
                  Menu
                </span>
                <button
                  type="button"
                  className="rounded-lg p-2"
                  aria-label="Fechar"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 p-4">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-semibold text-neutral-black hover:bg-brand-purple-subtle hover:text-brand-purple"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-3 border-t border-neutral-border p-4">
                <MarketingButton
                  href="/login"
                  variant="outlined"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Login
                </MarketingButton>
                <MarketingButton
                  href="/cadastro"
                  variant="subtle"
                  className="btn-shimmer w-full"
                  onClick={() => setOpen(false)}
                >
                  Cadastrar
                </MarketingButton>
                <MarketingButton
                  href="#planos"
                  variant="primary"
                  className="btn-shimmer w-full"
                  onClick={() => setOpen(false)}
                >
                  Ver Planos
                </MarketingButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
