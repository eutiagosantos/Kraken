import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Cadastro | DirectAds",
  description: "Crie sua conta DirectAds.",
};

export default function CadastroPage() {
  return (
    <AuthShell
      title="Crie sua conta"
      description="Preencha os dados abaixo para começar."
      panelTitle="Comece a escalar com segurança."
      panelSubtitle="Cadastre-se para organizar times, contas e publicações — com o mesmo visual da marca DirectAds na sua operação."
    >
      <RegisterForm />
    </AuthShell>
  );
}
