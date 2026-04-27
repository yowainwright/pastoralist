# Pastoralist Docs App

This package powers the Pastoralist docs site at
[jeffry.in/pastoralist](https://jeffry.in/pastoralist/).

It is a Vite + React app for the marketing homepage, docs pages, local search,
syntax-highlighted examples, Mermaid diagrams, and theme switching.

## Stack

| Area           | Tooling                                  |
| -------------- | ---------------------------------------- |
| App shell      | Vite, React 19, TanStack Router          |
| Docs content   | MDX files loaded from `src/content/docs` |
| Code examples  | Shiki, remark-gfm, rehype-slug           |
| Diagrams       | Mermaid                                  |
| Search         | Fuse.js local search                     |
| Styling        | Tailwind CSS 4, daisyUI, shadcn-style UI |
| Motion         | Framer Motion, XState                    |
| Build contract | `tsc && vite build`                      |

## Current Shape

| Area        | Count / Detail                             |
| ----------- | ------------------------------------------ |
| Docs pages  | 11 MDX pages                               |
| Components  | 35 TSX component files                     |
| Source size | 98 TS, TSX, MDX, and CSS source files      |
| Routes      | `/`, `/docs/$slug`                         |
| Entry point | `src/main.tsx`                             |
| Docs order  | `src/content/index.ts`                     |
| Sidebar     | `src/components/docs/Sidebar/constants.ts` |

## Commands

From this directory:

```bash
bun install
bun run dev
bun run build
bun run preview
```

From the repository root:

```bash
bun run dev
bun run --cwd app build
```

`bun run serve` starts the Vite preview server on port `5174`.

## Editing Docs

Docs live in `src/content/docs/*.mdx`.

When adding or renaming a page:

1. Add the MDX file in `src/content/docs`.
2. Add its metadata and order in `src/content/index.ts`.
3. Add it to the sidebar in `src/components/docs/Sidebar/constants.ts` when it
   should be navigable.
4. Run `bun run build` to catch MDX, route, and type errors.

Use internal docs links like `/docs/security`. The MDX anchor component converts
those links into router links.

## Important Files

| File / directory         | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `src/pages/HomePage.tsx` | Homepage route                               |
| `src/pages/DocsPage.tsx` | Docs route, MDX loading, TOC, pagination     |
| `src/content/docs`       | Product documentation                        |
| `src/lib/mdx`            | MDX compilation, caching, heading extraction |
| `src/components/docs`    | Sidebar, search, TOC, pagination, MDX UI     |
| `src/components/home`    | Homepage sections and demos                  |
| `src/styles/global.css`  | Tailwind, daisyUI, themes, docs prose        |
| `src/themes`             | Shiki light and dark themes                  |
| `vite.config.ts`         | Build, aliases, manual chunks                |

## Release Checks

For docs-only changes, run:

```bash
bun run build
```

From the repository root, the broader check is:

```bash
bun run format
bun run --cwd app build
```

The build currently emits known warnings for daisyUI's `@property` rule and
large Vite chunks from syntax highlighting and Mermaid bundles.
