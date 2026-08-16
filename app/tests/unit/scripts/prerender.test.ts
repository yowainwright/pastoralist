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

describe("buildStaticRoutes", () => {
  test("builds the homepage and one route per document", () => {
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
  });
});

describe("createStaticDocument", () => {
  test("injects rendered markup, router state, and route metadata", () => {
    const rendered = {
      appHtml: "<main><h1>Setup</h1></main>",
      routerHtml: "<script>window.$_TSR={}</script>",
    };
    const html = createStaticDocument(template, route, rendered);

    assert.ok(html.includes('<div id="root" data-prerendered="true">'));
    assert.ok(html.includes("<title>Setup</title>"));
    assert.ok(html.includes('content="Install &quot;Pastoralist&quot; safely"'));
    assert.ok(html.includes(rendered.routerHtml));
    assert.ok(!html.includes('<div class="initial-loader"></div>'));
  });
});

describe("validateStaticDocument", () => {
  test("accepts a complete static document", async () => {
    const rendered = {
      appHtml: "<main><h1>Setup</h1></main>",
      routerHtml: "<script>window.$_TSR={}</script>",
    };
    const html = createStaticDocument(template, route, rendered);

    await Effect.runPromise(validateStaticDocument(route, html));
  });

  test("reports incomplete server rendering as a typed failure", async () => {
    const error = await Effect.runPromise(
      validateStaticDocument(route, template).pipe(Effect.flip),
    );

    assert.ok(error instanceof InvalidStaticDocument);
    assert.ok(error.reason.includes("prerendered root"));
  });

  test("rejects React client-render fallbacks", async () => {
    const rendered = {
      appHtml: '<template data-msg="server rendering aborted"></template>',
      routerHtml: "<script>window.$_TSR={}</script>",
    };
    const html = createStaticDocument(template, route, rendered);
    const error = await Effect.runPromise(validateStaticDocument(route, html).pipe(Effect.flip));

    assert.ok(error instanceof InvalidStaticDocument);
    assert.ok(error.reason.includes("client-render fallback"));
  });

  test("rejects routes without rendered page content", async () => {
    const rendered = {
      appHtml: "<main></main>",
      routerHtml: "<script>window.$_TSR={}</script>",
    };
    const html = createStaticDocument(template, route, rendered);
    const error = await Effect.runPromise(validateStaticDocument(route, html).pipe(Effect.flip));

    assert.ok(error instanceof InvalidStaticDocument);
    assert.ok(error.reason.includes("rendered heading"));
  });

  test("rejects an incomplete static homepage", async () => {
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
    assert.ok(error.reason.includes('id="features"'));
  });
});
