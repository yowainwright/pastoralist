import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Effect, Schema } from "effect";
import { DOCS } from "../src/content/constants";
import { isMainModule } from "../../scripts/is-main";
import type { DocMeta } from "../src/content/types";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(currentDir, "../dist");
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

const { String: StringSchema, Defect } = Schema;

export class StaticSiteOperationError extends Schema.TaggedError<StaticSiteOperationError>(
  "StaticSiteOperationError",
)("StaticSiteOperationError", {
  operation: StringSchema,
  target: StringSchema,
  cause: Defect,
}) {
  get message(): string {
    const message = `${this.operation} failed for ${this.target}`;
    return message;
  }
}

export class InvalidStaticDocument extends Schema.TaggedError<InvalidStaticDocument>(
  "InvalidStaticDocument",
)("InvalidStaticDocument", {
  routeFile: StringSchema,
  reason: StringSchema,
}) {
  get message(): string {
    const message = `${this.routeFile}: ${this.reason}`;
    return message;
  }
}

const REQUIRED_HOME_CONTENT = ['id="hero"', 'id="features"', 'id="demo"', 'id="get-started"'];
const FORBIDDEN_HOME_CONTENT = [
  '<template id="B:',
  "min-h-[32rem]",
  "min-h-[40rem]",
  "min-h-[24rem]",
];
const HOME_ROUTE: StaticRoute = {
  pathname: "/pastoralist/",
  outputPath: "index.html",
  title: "Pastoralist - Dependency Management Tool",
  description: "Manage package.json overrides, resolutions, and patches with Pastoralist",
  requiredContent: REQUIRED_HOME_CONTENT,
  forbiddenContent: FORBIDDEN_HOME_CONTENT,
};

const makeDocRoute = ({ slug, title, description }: DocMeta): StaticRoute => {
  const pathname = `/pastoralist/docs/${slug}/`;
  const outputPath = path.join("docs", slug, "index.html");
  const route = { pathname, outputPath, title, description };
  return route;
};

export const buildStaticRoutes = (docs: readonly DocMeta[]): readonly StaticRoute[] => {
  const docRoutes = docs.map(makeDocRoute);
  const staticRoutes = [HOME_ROUTE].concat(docRoutes);
  return staticRoutes;
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
  const metadata = withTitle.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, meta);
  return metadata;
};

export const createStaticDocument = (
  template: string,
  route: StaticRoute,
  rendered: RenderedRoute,
): string => {
  const root = `<div id="root" data-prerendered="true">${rendered.appHtml}</div>`;
  const withApp = template.replace(ROOT_MARKUP, root);
  const withMetadata = applyMetadata(withApp, route);
  const staticDocument = withMetadata.replace("</body>", `${rendered.routerHtml}</body>`);
  return staticDocument;
};

const invalidDocument = ({ outputPath: routeFile }: StaticRoute, reason: string) => {
  const failure = Effect.fail(new InvalidStaticDocument({ routeFile, reason }));
  return failure;
};

const findMissingContent = (route: StaticRoute, html: string): string | undefined =>
  route.requiredContent?.find((content) => !html.includes(content));

const findForbiddenContent = (route: StaticRoute, html: string): string | undefined =>
  route.forbiddenContent?.find((content) => html.includes(content));

const DOCUMENT_CHECKS = [
  { content: 'data-prerendered="true"', required: true, reason: "missing prerendered root" },
  { content: "$_TSR", required: true, reason: "missing router state" },
  { content: ROOT_MARKUP, required: false, reason: "contains initial loader" },
  {
    content: "Switched to client rendering",
    required: false,
    reason: "contains a client-render fallback",
  },
  {
    content: "server rendering aborted",
    required: false,
    reason: "contains a client-render fallback",
  },
  {
    content: "server rendering errored",
    required: false,
    reason: "contains a client-render fallback",
  },
  { content: "<h1", required: true, reason: "missing rendered heading" },
];

export const validateStaticDocument = Effect.fn("staticSite.validate")(function* (
  route: StaticRoute,
  html: string,
) {
  const failed = DOCUMENT_CHECKS.find(
    ({ content, required }) => html.includes(content) !== required,
  );
  if (failed) yield* invalidDocument(route, failed.reason);
  const missingContent = findMissingContent(route, html);
  if (missingContent) yield* invalidDocument(route, `missing required content: ${missingContent}`);
  const forbiddenContent = findForbiddenContent(route, html);
  if (forbiddenContent) {
    yield* invalidDocument(route, `contains deferred content: ${forbiddenContent}`);
  }
});

const operationError =
  (operation: string, target: string) =>
  (cause: unknown): StaticSiteOperationError =>
    new StaticSiteOperationError({ operation, target, cause });

const readUtf8 = Effect.fn("staticSite.readUtf8")((filePath: string) => {
  const onError = operationError("read", filePath);
  const read = Effect.tryPromise({
    try: () => readFile(filePath, "utf8"),
    catch: onError,
  });
  return read;
});

const writeUtf8 = Effect.fn("staticSite.writeUtf8")(function* (filePath: string, content: string) {
  const directory = path.dirname(filePath);
  const onDirectoryError = operationError("create directory", directory);
  const onWriteError = operationError("write", filePath);
  yield* Effect.tryPromise({
    try: () => mkdir(directory, { recursive: true }),
    catch: onDirectoryError,
  });
  yield* Effect.tryPromise({
    try: () => writeFile(filePath, content),
    catch: onWriteError,
  });
});

const isRendererModule = (value: unknown): value is RendererModule => {
  const isObject = typeof value === "object" && value !== null;
  if (!isObject) return false;
  if (!("render" in value)) return false;
  const isRenderFunction = typeof value.render === "function";
  return isRenderFunction;
};

const loadRenderer = Effect.fn("staticSite.loadRenderer")(function* () {
  const onError = operationError("load renderer", SERVER_ENTRYPOINT);
  const serverModule: unknown = yield* Effect.tryPromise({
    try: () => import(SERVER_ENTRYPOINT),
    catch: onError,
  });
  if (isRendererModule(serverModule)) {
    const { render } = serverModule;
    return render;
  }

  const cause = new TypeError("Server entrypoint does not export render()");
  const failure = yield* Effect.fail(onError(cause));
  return failure;
});

const renderRoute = Effect.fn("staticSite.renderRoute")((
  renderer: Renderer,
  route: StaticRoute,
) => {
  const onError = operationError("render", route.pathname);
  const rendered = Effect.tryPromise({
    try: () => renderer(route.pathname),
    catch: onError,
  });
  return rendered;
});

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

if (isMainModule(import.meta.url)) {
  await Effect.runPromise(prerenderStaticSite());
}
