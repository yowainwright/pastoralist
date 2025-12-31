import type { ReactNode } from "react";
import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/docs/Sidebar";

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section className="flex flex-col min-h-screen relative">
      <BackgroundBlobs />

      <Header />

      <main className="drawer lg:drawer-open flex-1">
        <input
          id="my-drawer-2"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={(e) => setDrawerOpen(e.target.checked)}
        />
        <section className="drawer-content flex flex-col">
          <article className="flex-1">{children}</article>
        </section>
        <Sidebar />
      </main>

      <Footer />

      <TrackingPixel />
    </section>
  );
}

function BackgroundBlobs() {
  return (
    <figure
      className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none"
      aria-hidden="true"
    >
      <span
        className="hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block"
        style={{
          clipPath:
            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        }}
      />
      <span
        className="hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block"
        style={{
          clipPath:
            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
        }}
      />
    </figure>
  );
}

function TrackingPixel() {
  return (
    <img
      referrerPolicy="no-referrer-when-downgrade"
      src="https://static.scarf.sh/a.png?x-pxid=6f41d7dd-fce9-49ea-ae43-040a51f458bd"
      alt=""
      aria-hidden="true"
      style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
    />
  );
}
