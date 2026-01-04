import { HeroSection } from "@/components/home/HeroSection";
import { CodeBlockSection } from "@/components/home/CodeBlockSection";
import { TransformSection } from "@/components/home/TransformSection";
import { GetStartedSection } from "@/components/home/GetStartedSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <CodeBlockSection />
      <TransformSection />
      <GetStartedSection />
    </>
  );
}
