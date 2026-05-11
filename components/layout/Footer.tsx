import Link from "next/link";
import { KrakenMarkTile } from "@/components/branding/KrakenMarkTile";
import { Instagram, MessageCircle } from "lucide-react";

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
    <footer className="bg-neutral-black text-neutral-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Link
              href="#inicio"
              className="flex items-center gap-2 font-display text-lg font-bold text-neutral-white"
            >
              <KrakenMarkTile size="sm" />
              Kraken
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
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-neutral-silver transition-colors hover:text-neutral-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider my-12 opacity-40" />

        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-silver">
            © {new Date().getFullYear()} Kraken. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://instagram.com"
              aria-label="Instagram"
              className="rounded-full border border-white/10 p-2 text-neutral-silver transition-colors hover:border-brand-purple hover:text-neutral-white"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="https://wa.me"
              aria-label="WhatsApp"
              className="rounded-full border border-white/10 p-2 text-neutral-silver transition-colors hover:border-brand-purple hover:text-neutral-white"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
