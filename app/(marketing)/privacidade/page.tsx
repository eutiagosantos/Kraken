import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Kraken",
  description:
    "Como a Kraken trata dados pessoais, integração com produtos Meta e seus direitos sob a LGPD.",
  robots: { index: true, follow: true },
};

const privacyContactEmail = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim();

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-2 sm:px-6 lg:px-8">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-neutral-gray">
        Última atualização: 11 de maio de 2026
      </p>
      <h1 className="mt-3 text-center font-display text-3xl font-bold tracking-tight text-neutral-black sm:text-4xl">
        Política de Privacidade
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-neutral-gray">
        Esta política descreve como a plataforma Kraken (&quot;Kraken&quot;, &quot;nós&quot;) trata dados
        pessoais quando você utiliza o site e o aplicativo, incluindo integrações com produtos Meta
        (Facebook, Instagram e tecnologias relacionadas).
      </p>

      <article className="mt-12 space-y-10 text-sm leading-relaxed text-neutral-black sm:text-[15px]">
        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">1. Controlador</h2>
          <p className="mt-3 text-neutral-gray">
            O tratamento de dados realizado pela Kraken observa a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018 — LGPD). O controlador é a pessoa jurídica responsável pela operação
            da Kraken perante você ou sua organização; em caso de dúvida sobre quem atua como
            controlador no seu caso (por exemplo, contrato B2B), consulte seu contrato ou canal
            comercial.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">
            2. Dados que podemos tratar
          </h2>
          <p className="mt-3 text-neutral-gray">
            Dependendo de como você usa a Kraken, podemos tratar categorias como:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-neutral-gray marker:text-brand-purple">
            <li>
              <span className="font-semibold text-neutral-black">Conta e autenticação:</span>{" "}
              identificadores de conta, nome, e-mail, dados de sessão e registros de segurança
              necessários para login e proteção da conta.
            </li>
            <li>
              <span className="font-semibold text-neutral-black">Dados de organização/workspace:</span>{" "}
              informações de equipe, permissões e configurações vinculadas ao uso colaborativo da
              plataforma.
            </li>
            <li>
              <span className="font-semibold text-neutral-black">Integração Meta / Meta Ads:</span>{" "}
              identificadores e metadados de contas de anúncio, páginas, pixels e campanhas obtidos
              via APIs e fluxos autorizados por você; conteúdos e arquivos que você envia para
              criação ou gestão de anúncios (por exemplo, criativos e textos).
            </li>
            <li>
              <span className="font-semibold text-neutral-black">Dados técnicos:</span> endereço IP,
              tipo de dispositivo e navegador, logs de erro e métricas de desempenho, quando
              necessários para operação e segurança.
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">3. Finalidades</h2>
          <p className="mt-3 text-neutral-gray">Utilizamos os dados para, entre outras finalidades:</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-neutral-gray marker:text-brand-purple">
            <li>Fornecer, operar e melhorar a plataforma Kraken;</li>
            <li>Autenticar usuários, prevenir fraudes e abusos;</li>
            <li>
              Executar funcionalidades que você solicita, inclusive publicação e gestão de campanhas
              no ecossistema Meta, quando devidamente autorizado;
            </li>
            <li>Cumprir obrigações legais e regulatórias aplicáveis;</li>
            <li>Comunicar avisos importantes sobre o serviço e suporte.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">
            4. Meta (Facebook / Instagram) e permissões
          </h2>
          <p className="mt-3 text-neutral-gray">
            Quando você conecta uma conta Meta ou autoriza permissões, o tratamento também segue as
            políticas da Meta aplicáveis ao produto utilizado. A Kraken acessa dados estritamente no
            âmbito das permissões concedidas por você e para as finalidades descritas nesta política
            e na interface do aplicativo. Você pode revogar permissões nas configurações da sua conta
            Meta; isso pode limitar ou impedir funcionalidades dependentes dessa integração.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">
            5. Bases legais (LGPD)
          </h2>
          <p className="mt-3 text-neutral-gray">
            Tratamos dados pessoais com base em fundamentos previstos na LGPD, conforme o caso, como
            execução de contrato ou de procedimentos preliminares, cumprimento de obrigação legal,
            legítimo interesse (com avaliação de impacto e salvaguardas adequadas) ou consentimento,
            quando exigido.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">
            6. Compartilhamento e operadores
          </h2>
          <p className="mt-3 text-neutral-gray">
            Podemos compartilhar dados com provedores que nos auxiliam a operar a plataforma (por
            exemplo, hospedagem, autenticação e banco de dados), sempre mediante contratos e medidas
            de segurança compatíveis com a LGPD. A Meta recebe ou processa dados quando você utiliza
            seus produtos diretamente, conforme as políticas da Meta. Não vendemos seus dados
            pessoais.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">
            7. Armazenamento, cookies e localização
          </h2>
          <p className="mt-3 text-neutral-gray">
            Dados podem ser armazenados em infraestrutura de nuvem, inclusive fora do Brasil, desde
            que respeitados os requisitos legais para transferência internacional. Utilizamos cookies
            e tecnologias similares necessários à sessão, segurança e preferências, nos termos da
            legislação aplicável.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">8. Retenção</h2>
          <p className="mt-3 text-neutral-gray">
            Mantemos dados pelo tempo necessário para cumprir as finalidades desta política,
            obrigações legais, resolução de litígios e exercício regular de direitos, apagando ou
            anonimizando quando aplicável.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">
            9. Direitos do titular
          </h2>
          <p className="mt-3 text-neutral-gray">
            Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção,
            anonimização, portabilidade, eliminação de dados desnecessários ou tratados em
            desconformidade, informação sobre compartilhamentos e revogação de consentimento, quando
            cabível.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">10. Crianças e adolescentes</h2>
          <p className="mt-3 text-neutral-gray">
            A Kraken não se destina a menores de 16 anos. Se tomarmos conhecimento de tratamento
            indevido nesses casos, adotaremos medidas para eliminar os dados.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">11. Alterações</h2>
          <p className="mt-3 text-neutral-gray">
            Podemos atualizar esta política periodicamente. A data da última versão aparece no topo
            desta página. Alterações relevantes podem ser comunicadas por meios razoáveis (por
            exemplo, aviso no aplicativo ou por e-mail).
          </p>
        </section>

        <section className="rounded-xl border border-neutral-border/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="font-display text-lg font-bold text-neutral-black">12. Contato</h2>
          <p className="mt-3 text-neutral-gray">
            Para solicitações relacionadas a privacidade e exercício de direitos, utilize o canal
            indicado na aplicação autenticada ou pelo contato comercial da sua organização.
            {privacyContactEmail ? (
              <>
                {" "}
                Você também pode escrever para{" "}
                <a
                  className="font-semibold text-brand-purple underline decoration-brand-purple/30 underline-offset-2 transition-colors hover:text-brand-purple-deep"
                  href={`mailto:${privacyContactEmail}`}
                >
                  {privacyContactEmail}
                </a>
                .
              </>
            ) : null}
          </p>
        </section>
      </article>
    </main>
  );
}
