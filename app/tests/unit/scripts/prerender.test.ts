import { assertContainsText, assertExcludesText } from "../../../../tests/unit/scripts/utils";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Effect } from "effect";
import {
  InvalidStaticDocument,
  buildStaticRoutes,
  createStaticDocument,
  validateStaticDocument,
} from "../../../scripts/prerender";

const template = `<!doctype html>
<html>
  <head>
    <meta name="description" content="Old description" />
    <title>Old title</title>
  </head>
  <body>
    <div id="root"><div class="initial-loader"></div></div>
  </body>
</html>`;

const route = {
  pathname: "/pastoralist/docs/setup/",
  outputPath: "docs/setup/index.html",
  title: "Setup",
  description: 'Install "Pastoralist" safely',
};

const buildStaticRoutesCases = [
  {
    name: "builds the homepage and one route per document",
    run: () => {
      const docs = [{ slug: "setup", title: "Setup", description: "Install Pastoralist" }];
      const routes = buildStaticRoutes(docs);

      assert.strictEqual(routes.length, 2);
      assert.deepStrictEqual(routes[0].requiredContent, [
        'id="hero"',
        'id="features"',
        'id="demo"',
        'id="get-started"',
      ]);
      assert.deepStrictEqual(routes[1], {
        pathname: "/pastoralist/docs/setup/",
        outputPath: "docs/setup/index.html",
        title: "Setup",
        description: "Install Pastoralist",
      });
    },
  },
];

describe("buildStaticRoutes", () => {
  buildStaticRoutesCases.forEach(({ name, run }) => test(name, run));
});

const createStaticDocumentCases = [
  {
    name: "injects rendered markup, router state, and route metadata",
    run: () => {
      const rendered = {
        appHtml: "<main><h1>Setup</h1></main>",
        routerHtml: "<script>window.$_TSR={}</script>",
      };
      const html = createStaticDocument(template, route, rendered);

      assertContainsText(html, '<div id="root" data-prerendered="true">');
      assertContainsText(html, "<title>Setup</title>");
      assertContainsText(html, 'content="Install &quot;Pastoralist&quot; safely"');
      assertContainsText(html, rendered.routerHtml);
      assertExcludesText(html, '<div class="initial-loader"></div>');
    },
  },
];

describe("createStaticDocument", () => {
  createStaticDocumentCases.forEach(({ name, run }) => test(name, run));
});

const validateStaticDocumentCases = [
  {
    name: "accepts a complete static document",
    run: async () => {
      const rendered = {
        appHtml: "<main><h1>Setup</h1></main>",
        routerHtml: "<script>window.$_TSR={}</script>",
      };
      const html = createStaticDocument(template, route, rendered);

      await Effect.runPromise(validateStaticDocument(route, html));
    },
  },
  {
    name: "reports incomplete server rendering as a typed failure",
    run: async () => {
      const error = await Effect.runPromise(
        validateStaticDocument(route, template).pipe(Effect.flip),
      );

      assert.ok(error instanceof InvalidStaticDocument);
      assertContainsText(error.reason, "prerendered root");
    },
  },
  {
    name: "rejects React client-render fallbacks",
    run: async () => {
      const rendered = {
        appHtml: '<template data-msg="server rendering aborted"></template>',
        routerHtml: "<script>window.$_TSR={}</script>",
      };
      const html = createStaticDocument(template, route, rendered);
      const error = await Effect.runPromise(validateStaticDocument(route, html).pipe(Effect.flip));

      assert.ok(error instanceof InvalidStaticDocument);
      assertContainsText(error.reason, "client-render fallback");
    },
  },
  {
    name: "rejects routes without rendered page content",
    run: async () => {
      const rendered = {
        appHtml: "<main></main>",
        routerHtml: "<script>window.$_TSR={}</script>",
      };
      const html = createStaticDocument(template, route, rendered);
      const error = await Effect.runPromise(validateStaticDocument(route, html).pipe(Effect.flip));

      assert.ok(error instanceof InvalidStaticDocument);
      assertContainsText(error.reason, "rendered heading");
    },
  },
  {
    name: "rejects an incomplete static homepage",
    run: async () => {
      const homeRoute = buildStaticRoutes([])[0];
      const rendered = {
        appHtml: '<main><h1>Pastoralist</h1><section id="hero"></section></main>',
        routerHtml: "<script>window.$_TSR={}</script>",
      };
      const html = createStaticDocument(template, homeRoute, rendered);
      const error = await Effect.runPromise(
        validateStaticDocument(homeRoute, html).pipe(Effect.flip),
      );

      assert.ok(error instanceof InvalidStaticDocument);
      assertContainsText(error.reason, 'id="features"');
    },
  },
];

describe("validateStaticDocument", () => {
  validateStaticDocumentCases.forEach(({ name, run }) => test(name, run));
});
