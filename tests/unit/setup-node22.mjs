import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const appendExtension = (specifier, extension) => {
  const queryIndex = specifier.indexOf("?");
  if (queryIndex === -1) return `${specifier}${extension}`;
  const path = specifier.slice(0, queryIndex);
  const query = specifier.slice(queryIndex);
  return `${path}${extension}${query}`;
};

const resolveCandidates = (specifier) => [
  appendExtension(specifier, ".ts"),
  appendExtension(specifier, ".tsx"),
  appendExtension(`${specifier}/index`, ".ts"),
  appendExtension(`${specifier}/index`, ".tsx"),
];

const tryResolve = (specifier, context, nextResolve) => {
  try {
    return nextResolve(specifier, context);
  } catch {
    return undefined;
  }
};

const resolveTypeScript = (specifier, context, nextResolve) => {
  try {
    return nextResolve(specifier, context);
  } catch (error) {
    const isFileUrl = specifier.startsWith("file:");
    const isLocal = isFileUrl || specifier.startsWith(".") || specifier.startsWith("/");
    if (!isLocal) throw error;

    const results = resolveCandidates(specifier).map((candidate) =>
      tryResolve(candidate, context, nextResolve),
    );
    const resolved = results.find((result) => result !== undefined);
    if (!resolved) throw error;
    return resolved;
  }
};

const loadTypeScript = (url) => {
  const source = readFileSync(fileURLToPath(url), "utf8");
  return stripTypeScriptTypes(source, { sourceUrl: url });
};

registerHooks({
  resolve: resolveTypeScript,
  load: (url, context, nextLoad) => {
    const isTypeScript = url.startsWith("file:") && extname(new URL(url).pathname) === ".ts";
    if (!isTypeScript) return nextLoad(url, context);
    return { format: "module", shortCircuit: true, source: loadTypeScript(url) };
  },
});

await import("./setup.ts");
