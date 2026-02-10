import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { HomeLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { DocsLayout } from "./layouts/DocsLayout";
import { DocsPage } from "./pages/DocsPage";

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
    <DocsLayout>
      <DocsPage />
    </DocsLayout>
  ),
});

export const routeTree = rootRoute.addChildren([indexRoute, docsRoute]);
