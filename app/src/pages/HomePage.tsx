import { HeroSection } from "@/components/home/HeroSection";
import { CodeBlockSection } from "@/components/home/CodeBlockSection";
import { TransformSection } from "@/components/home/TransformSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <CodeBlockSection />
      <TransformSection />
    </>
  );
}
