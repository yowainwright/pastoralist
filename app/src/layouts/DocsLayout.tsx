import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/docs/Sidebar";

interface DocsLayoutProps {
  children: ReactNode;
}

const styles = {
  shell: "relative flex min-h-screen flex-col",
  main: "drawer lg:drawer-open relative min-h-[calc(100vh-68px)] flex-1",
  drawerContent: "drawer-content flex min-h-[calc(100vh-68px)] flex-col pt-[68px]",
  article: "flex min-h-[calc(100vh-68px)] flex-1 flex-col",
} as const;

export function DocsLayout({ children }: DocsLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDrawerOpen(event.target.checked);
  };
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <section className={styles.shell}>
      <Header />

      <main className={styles.main}>
        <input
          id="my-drawer-2"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={handleDrawerChange}
        />
        <section className={styles.drawerContent}>
          <article className={styles.article}>{children}</article>
        </section>
        <Sidebar onClose={closeDrawer} />
      </main>

      <Footer />
    </section>
  );
}
