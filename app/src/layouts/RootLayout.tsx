import { type ReactNode, lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Sidebar = lazy(() =>
  import("@/components/docs/Sidebar").then((m) => ({ default: m.Sidebar })),
);

interface HomeLayoutProps {
  children: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <section className="flex flex-col min-h-screen relative">
      <Header />
      <main className="drawer flex-1 relative">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <section className="drawer-content flex flex-col pt-[68px]">
          <article className="flex-1">{children}</article>
        </section>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </main>
      <Footer />
    </section>
  );
}
