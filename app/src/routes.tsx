import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { HomeLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";

const DocsLayout = lazy(() =>
  import("./layouts/DocsLayout").then((m) => ({ default: m.DocsLayout })),
);
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })),
);

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <HomeLayout>
      <HomePage />
    </HomeLayout>
  ),
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  component: () => (
    <Suspense
      fallback={
        <section className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </section>
      }
    >
      <DocsLayout>
        <DocsPage />
      </DocsLayout>
    </Suspense>
  ),
});

export const routeTree = rootRoute.addChildren([indexRoute, docsRoute]);
