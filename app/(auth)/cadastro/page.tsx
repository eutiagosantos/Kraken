import type { Metadata } from "next";
import Image from "next/image";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Cadastro | Kraken",
  description: "Crie sua conta Kraken em poucos passos.",
};

export default function CadastroPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[440px] rounded-xl border border-neutral-border/80 bg-white px-6 py-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:px-10 sm:py-10">
        <div className="mb-7 flex justify-center">
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

        <h1 className="text-center font-display text-2xl font-bold tracking-tight text-neutral-black sm:text-[28px]">
          Crie sua conta Kraken
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-neutral-gray">
          Em menos de um minuto você começa a operar com segurança.
        </p>

        <div className="mt-7">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
