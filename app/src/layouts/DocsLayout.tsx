import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/docs/Sidebar";

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDrawerOpen(event.target.checked);
  };
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <section className="flex flex-col min-h-screen relative">
      <Header />

      <main className="drawer lg:drawer-open flex-1 relative">
        <input
          id="my-drawer-2"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={handleDrawerChange}
        />
        <section className="drawer-content flex flex-col pt-[68px]">
          <article className="flex-1">{children}</article>
        </section>
        <Sidebar onClose={closeDrawer} />
      </main>

      <Footer />
    </section>
  );
}
