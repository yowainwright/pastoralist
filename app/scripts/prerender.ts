import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Effect, Schema } from "effect";
import { DOCS } from "../src/content/constants";
import type { DocMeta } from "../src/content/types";

const DIST_DIR = path.resolve(import.meta.dir, "../dist");
const SERVER_ENTRYPOINT = new URL("../dist-server/entry-server.js", import.meta.url).href;
const ROOT_MARKUP = '<div id="root"><div class="initial-loader"></div></div>';

export interface StaticRoute {
  readonly pathname: string;
  readonly outputPath: string;
  readonly title: string;
  readonly description: string;
  readonly requiredContent?: readonly string[];
  readonly forbiddenContent?: readonly string[];
}

export interface RenderedRoute {
  readonly appHtml: string;
  readonly routerHtml: string;
}

type Renderer = (pathname: string) => Promise<RenderedRoute>;

interface RendererModule {
  render: Renderer;
}

export class StaticSiteOperationError extends Schema.TaggedError<StaticSiteOperationError>(
  "StaticSiteOperationError",
)("StaticSiteOperationError", {
  operation: Schema.String,
  target: Schema.String,
  cause: Schema.Defect,
}) {
  get message(): string {
    return `${this.operation} failed for ${this.target}`;
  }
}

export class InvalidStaticDocument extends Schema.TaggedError<InvalidStaticDocument>(
  "InvalidStaticDocument",
)("InvalidStaticDocument", {
  routeFile: Schema.String,
  reason: Schema.String,
}) {
  get message(): string {
    return `${this.routeFile}: ${this.reason}`;
  }
}

const HOME_ROUTE: StaticRoute = {
  pathname: "/pastoralist/",
  outputPath: "index.html",
  title: "Pastoralist - Dependency Management Tool",
  description: "Manage package.json overrides, resolutions, and patches with Pastoralist",
  requiredContent: ['id="hero"', 'id="features"', 'id="demo"', 'id="get-started"'],
  forbiddenContent: ['<template id="B:', "min-h-[32rem]", "min-h-[40rem]", "min-h-[24rem]"],
};

const makeDocRoute = (doc: DocMeta): StaticRoute => ({
  pathname: `/pastoralist/docs/${doc.slug}/`,
  outputPath: path.join("docs", doc.slug, "index.html"),
  title: doc.title,
  description: doc.description,
});

export const buildStaticRoutes = (docs: readonly DocMeta[]): readonly StaticRoute[] => {
  const docRoutes = docs.map(makeDocRoute);
  return [HOME_ROUTE].concat(docRoutes);
};

const escapeAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const applyMetadata = (html: string, route: StaticRoute): string => {
  const title = `<title>${route.title}</title>`;
  const description = escapeAttribute(route.description);
  const meta = `<meta name="description" content="${description}" />`;
  const withTitle = html.replace(/<title>[^<]*<\/title>/, title);
  return withTitle.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, meta);
};

export const createStaticDocument = (
  template: string,
  route: StaticRoute,
  rendered: RenderedRoute,
): string => {
  const root = `<div id="root" data-prerendered="true">${rendered.appHtml}</div>`;
  const withApp = template.replace(ROOT_MARKUP, root);
  const withMetadata = applyMetadata(withApp, route);
  return withMetadata.replace("</body>", `${rendered.routerHtml}</body>`);
};

const invalidDocument = (route: StaticRoute, reason: string) =>
  Effect.fail(new InvalidStaticDocument({ routeFile: route.outputPath, reason }));

const findMissingContent = (route: StaticRoute, html: string): string | undefined =>
  route.requiredContent?.find((content) => !html.includes(content));

const findForbiddenContent = (route: StaticRoute, html: string): string | undefined =>
  route.forbiddenContent?.find((content) => html.includes(content));

export const validateStaticDocument = Effect.fn("staticSite.validate")(function* (
  route: StaticRoute,
  html: string,
) {
  if (!html.includes('data-prerendered="true"')) {
    return yield* invalidDocument(route, "missing prerendered root");
  }
  if (!html.includes("$_TSR")) return yield* invalidDocument(route, "missing router state");
  if (html.includes(ROOT_MARKUP)) return yield* invalidDocument(route, "contains initial loader");
  const hasClientFallback =
    html.includes("Switched to client rendering") ||
    html.includes("server rendering aborted") ||
    html.includes("server rendering errored");
  if (hasClientFallback) {
    return yield* invalidDocument(route, "contains a client-render fallback");
  }
  if (!html.includes("<h1")) return yield* invalidDocument(route, "missing rendered heading");
  const missingContent = findMissingContent(route, html);
  if (missingContent)
    return yield* invalidDocument(route, `missing required content: ${missingContent}`);
  const forbiddenContent = findForbiddenContent(route, html);
  if (forbiddenContent) {
    return yield* invalidDocument(route, `contains deferred content: ${forbiddenContent}`);
  }
});

const operationError =
  (operation: string, target: string) =>
  (cause: unknown): StaticSiteOperationError =>
    new StaticSiteOperationError({ operation, target, cause });

const readUtf8 = Effect.fn("staticSite.readUtf8")((filePath: string) =>
  Effect.tryPromise({
    try: () => readFile(filePath, "utf8"),
    catch: operationError("read", filePath),
  }),
);

const writeUtf8 = Effect.fn("staticSite.writeUtf8")(function* (filePath: string, content: string) {
  const directory = path.dirname(filePath);
  yield* Effect.tryPromise({
    try: () => mkdir(directory, { recursive: true }),
    catch: operationError("create directory", directory),
  });
  yield* Effect.tryPromise({
    try: () => writeFile(filePath, content),
    catch: operationError("write", filePath),
  });
});

const isRendererModule = (value: unknown): value is RendererModule => {
  const isNotObject = typeof value !== "object" || value === null;
  if (isNotObject) return false;
  if (!("render" in value)) return false;
  const isRenderFunction = typeof value.render === "function";
  return isRenderFunction;
};

const loadRenderer = Effect.fn("staticSite.loadRenderer")(function* () {
  const serverModule: unknown = yield* Effect.tryPromise({
    try: () => import(SERVER_ENTRYPOINT),
    catch: operationError("load renderer", SERVER_ENTRYPOINT),
  });
  if (isRendererModule(serverModule)) return serverModule.render;

  const cause = new TypeError("Server entrypoint does not export render()");
  return yield* Effect.fail(operationError("load renderer", SERVER_ENTRYPOINT)(cause));
});

const renderRoute = Effect.fn("staticSite.renderRoute")((renderer: Renderer, route: StaticRoute) =>
  Effect.tryPromise({
    try: () => renderer(route.pathname),
    catch: operationError("render", route.pathname),
  }),
);

const writeStaticRoute = Effect.fn("staticSite.writeRoute")(function* (
  renderer: Renderer,
  template: string,
  route: StaticRoute,
) {
  const rendered = yield* renderRoute(renderer, route);
  const document = createStaticDocument(template, route, rendered);
  yield* validateStaticDocument(route, document);
  const outputFile = path.join(DIST_DIR, route.outputPath);
  yield* writeUtf8(outputFile, document);
});

export const prerenderStaticSite = Effect.fn("staticSite.prerender")(function* () {
  const renderer = yield* loadRenderer();
  const template = yield* readUtf8(path.join(DIST_DIR, "index.html"));
  const routes = buildStaticRoutes(DOCS);
  const writes = routes.map((route) => writeStaticRoute(renderer, template, route));
  yield* Effect.all(writes, { concurrency: "unbounded", mode: "validate", discard: true });
  yield* Effect.sync(() =>
    process.stdout.write(`Prerendered and verified ${routes.length} routes.\n`),
  );
});

if (import.meta.main) {
  await Effect.runPromise(prerenderStaticSite());
}
