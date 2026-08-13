# Pastoralist Docs App

This package powers the Pastoralist docs site at
[jeffry.in/pastoralist](https://jeffry.in/pastoralist/).

It is a Vite + React app for the marketing homepage, docs pages, local search,
syntax-highlighted examples, Mermaid diagrams, and theme switching.

## Stack

<!-- docs app stack and build contract from app/package.json -->

| Area           | Tooling                                     |
| -------------- | ------------------------------------------- |
| App shell      | Vite, React 19, TanStack Router             |
| Docs content   | MDX files loaded from `src/content/docs`    |
| Code examples  | Shiki, remark-gfm, rehype-slug              |
| Diagrams       | Mermaid                                     |
| Search         | Fuse.js local search                        |
| Styling        | Tailwind CSS 4, daisyUI, shadcn-style UI    |
| Motion         | Framer Motion, XState                       |
| Build contract | Typecheck, client/SSR builds, static render |

## Current Shape

<!-- docs routes and source structure from app/src and app/scripts -->

| Area          | Count / Detail                             |
| ------------- | ------------------------------------------ |
| Docs pages    | 12 MDX pages                               |
| Static routes | 13 HTML files                              |
| Components    | 40 TSX component files                     |
| Source size   | 103 TS, TSX, MDX, and CSS source files     |
| Routes        | `/`, `/docs/$slug`                         |
| Entry points  | `src/main.tsx`, `src/entry-server.tsx`     |
| Docs order    | `src/content/constants.ts`                 |
| Sidebar       | `src/components/docs/Sidebar/constants.ts` |

## Commands

<!-- docs app commands from app/package.json#scripts -->

From this directory:

```bash
pnpm install
pnpm run dev
pnpm run test:unit
pnpm run build
pnpm run preview
```

From the repository root:

```bash
pnpm run dev
pnpm --dir app run build
```

`pnpm run serve` starts the Vite preview server on port `5174`.

`pnpm run build` verifies that every route contains rendered content and that the
homepage includes all four sections without deferred skeletons.

## Editing Docs

Docs live in `src/content/docs/*.mdx`.

When adding or renaming a page:

1. Add the MDX file in `src/content/docs`.
2. Add its metadata and order in `src/content/constants.ts`.
3. Add it to the sidebar in `src/components/docs/Sidebar/constants.ts` when it
   should be navigable.
4. Run `pnpm run build` to catch MDX, route, and type errors.

Use internal docs links like `/docs/security`. The MDX anchor component converts
those links into router links.

## Important Files

<!-- static-site build files from app/package.json, app/src, and app/scripts -->

| File / directory           | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `src/pages/HomePage.tsx`   | Homepage route                               |
| `src/pages/DocsPage.tsx`   | Docs route, MDX loading, TOC, pagination     |
| `src/entry-server.tsx`     | Server renderer for static routes            |
| `src/content/constants.ts` | Docs metadata and route order                |
| `src/content/docs`         | Product documentation                        |
| `src/lib/mdx`              | MDX compilation, caching, heading extraction |
| `src/components/docs`      | Sidebar, search, TOC, pagination, MDX UI     |
| `src/components/home`      | Homepage sections and demos                  |
| `src/styles/global.css`    | Tailwind, daisyUI, themes, docs prose        |
| `src/themes`               | Shiki light and dark themes                  |
| `scripts/prerender.ts`     | Static route rendering and validation        |
| `vite.config.ts`           | Build, aliases, manual chunks                |

## Release Checks

<!-- docs release checks from app/package.json#scripts -->

For docs-only changes, run:

```bash
pnpm run build
```

From the repository root, the broader check is:

```bash
pnpm run format
pnpm --dir app run test:unit
pnpm --dir app run build
```

The build currently emits known warnings for daisyUI's `@property` rule and
large Vite chunks from syntax highlighting and Mermaid bundles.
