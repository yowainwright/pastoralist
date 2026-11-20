import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { DocsLayout } from "./layouts/DocsLayout";
import { HomeLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { getDocHeadings } from "./content";

const DocsPage = lazy(() =>
  import("./pages/DocsPage").then(({ DocsPage: component }) => ({ default: component })),
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
  beforeLoad: ({ params, location }) => {
    if (params.slug !== "onboarding") return;
    const setup = { slug: "setup" };
    const { search, hash } = location;
    throw redirect({ to: "/docs/$slug/", params: setup, search, hash, replace: true });
  },
  loader: ({ params }) => getDocHeadings(params.slug),
  component: DocsRoute,
});

function DocsRoute() {
  const headings = docsRoute.useLoaderData();
  return (
    <DocsLayout>
      <Suspense fallback={null}>
        <DocsPage headings={headings} />
      </Suspense>
    </DocsLayout>
  );
}

export const routeTree = rootRoute.addChildren([indexRoute, docsRoute]);

export const createAppRouter = () =>
  createRouter({
    routeTree,
    basepath: "/pastoralist",
    trailingSlash: "always",
  });

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
