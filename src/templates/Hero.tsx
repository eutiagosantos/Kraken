"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FloatingParticles } from "@/components/motion/FloatingParticles";
import {
  DEMO_PUBLICATION_QUEUE_SUMMARY,
  PublicationQueuePanel,
} from "@/components/publication-queue/PublicationQueuePanel";
import { Stats } from "@/templates/Stats";
import { MarketingButton } from "@/components/ui/MarketingButton";

const headlineWords = [
  "Publique",
  "100+",
  "campanhas",
  "no",
  "Meta",
  "Ads",
  "com",
  "um",
  "clique",
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

const wordContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const wordItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const instant = shouldReduceMotion;

  return (
    <section
      id="inicio"
      className="relative overflow-hidden hero-editorial"
    >
      <Image
        src="/images/hero-bg.svg"
        alt=""
        fill
        priority
        className="pointer-events-none object-cover opacity-[0.07]"
        aria-hidden
      />

      <FloatingParticles />

      <motion.div
        className="pointer-events-none absolute left-0 top-0 hidden h-full w-1 hero-accent-bar lg:block"
        aria-hidden
        initial={instant ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        style={{ transformOrigin: "top" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <motion.p
              className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-silver"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              Upload em massa · Meta Ads
            </motion.p>

            <motion.h1
              className="text-balance font-display text-[clamp(2.25rem,5.5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.04em] text-neutral-black"
              variants={wordContainer}
              initial="hidden"
              animate="visible"
            >
              {headlineWords.map((word, index) => {
                const isHighlight = word === "100+" || word === "campanhas";

                return (
                  <motion.span
                    key={`${word}-${index}`}
                    variants={wordItem}
                    className="mr-[0.28em] inline-block"
                  >
                    {isHighlight ? (
                      <span className="relative inline-block">
                        <span className="relative z-[1]">{word}</span>
                        {word === "campanhas" && (
                          <span
                            className="absolute -bottom-1 left-0 h-3 w-full bg-brand-purple/20"
                            aria-hidden
                          />
                        )}
                      </span>
                    ) : (
                      word
                    )}
                  </motion.span>
                );
              })}
            </motion.h1>

            <motion.div
              className="editorial-rule mt-8 max-w-xs"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.45}
            />

            <motion.p
              className="mt-8 max-w-lg text-lg leading-relaxed text-neutral-gray"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.5}
            >
              Centralize contas, valide criativos e dispare lotes inteiros em
              minutos — sem planilhas, sem retrabalho, sem erro humano.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-4"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.7}
            >
              <MarketingButton href="/cadastro" variant="primary" className="gap-2">
                Começar grátis
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </MarketingButton>
              <MarketingButton href="#como-funciona" variant="outlined">
                Ver como funciona
              </MarketingButton>
            </motion.div>

            <Stats delay={0.9} />
          </div>

          <div className="relative mx-auto w-full max-w-[440px] pb-8 lg:mx-0 lg:max-w-none lg:pb-0">
            <span
              className="pointer-events-none absolute -right-6 -top-8 select-none font-display text-[9rem] font-bold leading-none tracking-tighter text-neutral-black/[0.04] lg:-right-10 lg:text-[11rem]"
              aria-hidden
            >
              100+
            </span>

            <motion.div
              className="relative will-change-transform"
              initial={instant ? false : { opacity: 0, y: 30 }}
              animate={{
                opacity: 1,
                y: shouldReduceMotion ? 0 : [0, -8, 0],
              }}
              transition={{
                opacity: { duration: 0.6, ease: "easeOut", delay: 1.1 },
                y: shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.7,
                    },
              }}
            >
              <motion.div
                className="absolute -inset-6 rounded-[28px] blur-2xl"
                aria-hidden
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        boxShadow: [
                          "0 0 40px rgba(113,50,245,0.15)",
                          "0 0 80px rgba(113,50,245,0.35)",
                          "0 0 40px rgba(113,50,245,0.15)",
                        ],
                      }
                }
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <PublicationQueuePanel
                variant="marketing"
                summary={DEMO_PUBLICATION_QUEUE_SUMMARY}
                animate
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
