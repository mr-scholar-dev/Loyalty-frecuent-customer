import { SiteHeader } from "@/components/marketing/SiteHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { CapabilitiesStrip } from "@/components/marketing/CapabilitiesStrip";
import { ProblemSolution } from "@/components/marketing/ProblemSolution";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { BenefitsSection } from "@/components/marketing/BenefitsSection";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { AiAssistantSection } from "@/components/marketing/AiAssistantSection";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { PricingPreview } from "@/components/marketing/PricingPreview";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FinalCta } from "@/components/marketing/FinalCta";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <CapabilitiesStrip />
        <ProblemSolution />
        <HowItWorks />
        <BenefitsSection />
        <ProductShowcase />
        <AiAssistantSection />
        <SecuritySection />
        <PricingPreview />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
