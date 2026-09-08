'use client';

import { isValidElement, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import { safeHref } from './site-catalog';

/** Puck's inline editor must retain its element and raw Markdown source. */
export function MarkdownText({ children, block = false }: { children: ReactNode; block?: boolean }) {
  if (isValidElement(children) || typeof children !== 'string') return <>{children}</>;
  return <Markdown skipHtml urlTransform={url => safeHref(url) || ''}
    allowedElements={block ? undefined : ['p', 'strong', 'em', 'a', 'code', 'br']}
    unwrapDisallowed
    components={{
      p: ({ children }) => block ? <p>{children}</p> : <>{children}</>,
      a: ({ href, children }) => href ? <a href={href}>{children}</a> : <>{children}</>,
      img: () => null,
    }}>{children}</Markdown>;
}
