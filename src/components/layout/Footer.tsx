"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram, MessageCircle } from "lucide-react";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { Reveal } from "@/components/motion/Reveal";

const columns = [
  {
    title: "Navegação",
    links: [
      { label: "Login", href: "/login" },
      { label: "Cadastro", href: "/cadastro" },
      { label: "Início", href: "#inicio" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Benefícios", href: "#beneficios" },
      { label: "Planos", href: "#planos" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Anti-Spy", href: "#anti-spy" },
      { label: "Upload em massa", href: "#beneficios" },
      { label: "Suporte", href: "#recursos-adicionais" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", href: "#" },
      { label: "Privacidade", href: "/privacidade" },
      { label: "Contato", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative bg-neutral-black text-neutral-border">
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -top-px left-0 h-6 w-full text-neutral-black"
        aria-hidden
      >
        <path
          d="M0 24 C240 0 480 48 720 24 C960 0 1200 48 1440 24 L1440 48 L0 48 Z"
          fill="currentColor"
        />
      </svg>

      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" direction="up">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Link
              href="#inicio"
              aria-label="Kraken"
              className="flex items-center text-neutral-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-black"
            >
              <KrakenMarkTile size="sm" />
              <span className="sr-only">Kraken</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-neutral-silver">
              Escale campanhas no Meta Ads com precisão, velocidade e proteção
              contra espionagem — da preparação à publicação em massa.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-2xl">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-display text-sm font-bold text-neutral-white">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="nav-link-underline nav-link-underline-light text-sm text-neutral-silver transition-colors hover:text-neutral-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="editorial-rule my-12 opacity-40" />

        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-silver">
            © {new Date().getFullYear()} Kraken. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.2, rotate: -10 }}>
              <Link
                href="https://instagram.com"
                aria-label="Instagram"
                className="inline-flex rounded-full border border-white/10 p-2 text-neutral-silver transition-colors hover:border-brand-purple hover:text-neutral-white"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
              <Link
                href="https://wa.me"
                aria-label="WhatsApp"
                className="inline-flex rounded-full border border-white/10 p-2 text-neutral-silver transition-colors hover:border-brand-purple hover:text-neutral-white"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
