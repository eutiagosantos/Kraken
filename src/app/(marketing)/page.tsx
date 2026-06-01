import { AntiSpy } from "@/templates/AntiSpy";
import { Benefits } from "@/templates/Benefits";
import { Features } from "@/templates/Features";
import { Hero } from "@/templates/Hero";
import { HowItWorks } from "@/templates/HowItWorks";
import { Pricing } from "@/templates/Pricing";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <AntiSpy />
        <Benefits />
        <HowItWorks />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
