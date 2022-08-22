import React from 'react';
import { MDXProvider } from '@mdx-js/react'
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import { MDXComponents } from 'mdx/types';

export interface PreProps {
  children: {
    props: {
      children: string;
      className?: string;
    }
  }
}

const components = {
  pre: ({ children: { props: { children, className = '' }}}: PreProps) => {
    const matches = className?.match(/language-(?<lang>.*)/);
    const language = matches?.groups?.lang ? matches.groups.lang : '';
    return (
      <Highlight
        {...defaultProps}
        code={children}
        language={language as Language}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <>
          <pre className={className} style={style}>
            {tokens.map((line, i) => !line[0].empty ? (
               <div {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ) : null)}
          </pre>
          </>
        )}
      </Highlight>
    );
  },
}

export const Doc = ({ Component }: any) => (
  <MDXProvider components={components as MDXComponents}>
      <Component />
  </MDXProvider>
)
