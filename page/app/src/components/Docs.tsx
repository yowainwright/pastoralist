import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { MDXComponents } from "mdx/types";

// No need for custom pre component as rehype-pretty-code handles the syntax highlighting
const components = {};

export const Docs = ({ Component }: any) => (
  <MDXProvider components={components as MDXComponents}>
    <article className="prose w-full max-w-4xl flex-grow">
      <Component />
    </article>
  </MDXProvider>
);
