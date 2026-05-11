import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ibmPlexSans = localFont({
  src: [
    {
      path: "./fonts/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-sans-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kraken | Upload em Massa para Meta Ads",
  description:
    "Plataforma de upload em massa para Meta Ads. Automatize suas campanhas em múltiplas contas.",
  keywords: [
    "meta ads",
    "facebook ads",
    "upload em massa",
    "automação de anúncios",
  ],
  openGraph: {
    title: "Kraken | Upload em Massa para Meta Ads",
    description: "Publique 100+ campanhas no Meta Ads com 1 clique.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={ibmPlexSans.variable}>
      <body>{children}</body>
    </html>
  );
}
