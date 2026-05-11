"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { cn } from "@/lib/utils";
import { buttonVariantClasses } from "@/components/ui/Button";

const nav = [
  { label: "Home", href: "#inicio" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Planos", href: "#planos" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-neutral-border bg-neutral-white/95 backdrop-blur-md transition-shadow duration-300",
          scrolled && "shadow-micro"
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="#inicio"
            className="flex items-center gap-2 font-display text-lg font-bold text-brand-purple transition-colors hover:text-brand-purple-deep"
          >
            <KrakenMarkTile size="sm" priority />
            Kraken
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-neutral-gray transition-colors hover:text-brand-purple"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center px-4 py-2.5 text-sm",
                buttonVariantClasses.outlined
              )}
            >
              Login
            </Link>
            <Link
              href="/cadastro"
              className={cn(
                "inline-flex items-center justify-center px-4 py-2.5 text-sm",
                buttonVariantClasses.subtle
              )}
            >
              Cadastrar
            </Link>
            <Link
              href="#planos"
              className={cn(
                "inline-flex items-center justify-center px-4 py-2.5 text-sm",
                buttonVariantClasses.primary
              )}
            >
              Ver Planos
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex rounded-lg border border-neutral-border p-2 md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

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
              className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,320px)] flex-col border-l border-neutral-border bg-neutral-white shadow-subtle md:hidden"
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
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "inline-flex w-full items-center justify-center",
                    buttonVariantClasses.outlined
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "inline-flex w-full items-center justify-center",
                    buttonVariantClasses.subtle
                  )}
                >
                  Cadastrar
                </Link>
                <Link
                  href="#planos"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "inline-flex w-full items-center justify-center",
                    buttonVariantClasses.primary
                  )}
                >
                  Ver Planos
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
