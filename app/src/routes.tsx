import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";

const HomeLayout = lazy(() =>
  import("./layouts/RootLayout").then((m) => ({ default: m.HomeLayout })),
);
const DocsLayout = lazy(() =>
  import("./layouts/DocsLayout").then((m) => ({ default: m.DocsLayout })),
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })),
);

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-base-content/50">Loading...</div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HomeLayout>
        <HomePage />
      </HomeLayout>
    </Suspense>
  ),
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DocsLayout>
        <DocsPage />
      </DocsLayout>
    </Suspense>
  ),
});

export const routeTree = rootRoute.addChildren([indexRoute, docsRoute]);
