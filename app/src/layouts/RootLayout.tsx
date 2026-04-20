import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface HomeLayoutProps {
  children: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <section className="flex flex-col min-h-screen relative">
      <Header />
      <main className="flex-1 relative pt-[68px]">
        <article className="flex-1">{children}</article>
      </main>
      <Footer />
    </section>
  );
}
