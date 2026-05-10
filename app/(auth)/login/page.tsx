import type { Metadata } from "next";
import Image from "next/image";
import { KrakenLoginForm } from "@/components/auth/KrakenLoginForm";

export const metadata: Metadata = {
  title: "Login | Kraken",
  description: "Faça login na sua conta Kraken.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[420px] rounded-xl border border-neutral-border/80 bg-white px-6 py-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:px-10 sm:py-10">
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#ec4899] shadow-lg shadow-purple-500/25">
            <div className="absolute inset-[3px] rounded-[13px] bg-gradient-to-br from-white/25 to-transparent" />
            <Image
              src="/kraken-mark.svg"
              alt=""
              width={40}
              height={40}
              className="relative drop-shadow-md brightness-0 invert"
            />
          </div>
        </div>

        <h1 className="mb-8 text-center font-display text-2xl font-bold tracking-tight text-neutral-black sm:text-[28px]">
          Fazer login na Kraken
        </h1>

        <KrakenLoginForm />
      </div>
    </div>
  );
}
