import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BentoGrid from "@/components/BentoGrid";
import AIShowcase from "@/components/AIShowcase";
import SmartTimeline from "@/components/SmartTimeline";
import AILearningEngine from "@/components/AILearningEngine";
import StatsSection from "@/components/StatsSection";
import TestimonialSection from "@/components/TestimonialSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="site-shell relative">
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <AIShowcase />
      <SmartTimeline />
      <AILearningEngine />
      <StatsSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </main>
  );
}
