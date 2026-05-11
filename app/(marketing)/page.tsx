import { AntiSpy } from "@/components/sections/AntiSpy";
import { Benefits } from "@/components/sections/Benefits";
import { Features } from "@/components/sections/Features";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pricing } from "@/components/sections/Pricing";
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
