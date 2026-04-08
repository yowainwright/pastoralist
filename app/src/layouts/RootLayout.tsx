import type { ReactNode } from "react";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/docs/Sidebar";

interface HomeLayoutProps {
  children: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section className="flex flex-col min-h-screen relative">
      <Header />
      <main className="drawer flex-1 relative">
        <input
          id="my-drawer-2"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={(e) => setDrawerOpen(e.target.checked)}
        />
        <section className="drawer-content flex flex-col pt-[68px]">
          <article className="flex-1">{children}</article>
        </section>
        <Sidebar />
      </main>
      <Footer />
    </section>
  );
}
