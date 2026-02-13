
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema, type Schema } from "hast-util-sanitize";

type MarkdownProps = {
  content: string | null | undefined;
  className?: string;
  /**
   * Allow rendering of raw HTML inside Markdown. When enabled,
   * content is parsed with rehype-raw and sanitized with rehype-sanitize.
   * Default: false
   */
  allowHtml?: boolean;
  /**
   * Preserve inline styles like text-align coming from CMS HTML.
   * Only used when allowHtml is true. Default: false
   */
  allowInlineStyles?: boolean;
};

/**
 * Safe Markdown renderer.
 * - Supports bold, italics, lists, tables, strikethrough, task lists (GFM)
 * - Does NOT render raw HTML from Markdown for safety
 */
export default function Markdown({ content, className, allowHtml = false, allowInlineStyles = false }: MarkdownProps) {
  if (!content) return null;
  // When rendering HTML, optionally extend sanitize schema to keep specific inline styles
  const schema: Schema | undefined = allowHtml
    ? allowInlineStyles
      ? {
          ...(defaultSchema as Schema),
          attributes: {
            ...(defaultSchema.attributes || {}),
            // Allow style attribute on common elements (trusted CMS content)
            '*': [
              ...(((defaultSchema.attributes || {})['*'] as any[]) || []),
              'style',
            ],
            p: [
              'style',
              ...((((defaultSchema.attributes || {}).p as any[]) || [])),
            ],
            div: [
              'style',
              ...((((defaultSchema.attributes || {}).div as any[]) || [])),
            ],
            span: [
              'style',
              ...((((defaultSchema.attributes || {}).span as any[]) || [])),
            ],
            h1: ['style', ...((((defaultSchema.attributes || {}).h1 as any[]) || []))],
            h2: ['style', ...((((defaultSchema.attributes || {}).h2 as any[]) || []))],
            h3: ['style', ...((((defaultSchema.attributes || {}).h3 as any[]) || []))],
            h4: ['style', ...((((defaultSchema.attributes || {}).h4 as any[]) || []))],
            h5: ['style', ...((((defaultSchema.attributes || {}).h5 as any[]) || []))],
            h6: ['style', ...((((defaultSchema.attributes || {}).h6 as any[]) || []))],
            li: ['style', ...((((defaultSchema.attributes || {}).li as any[]) || []))],
          },
        }
      : (defaultSchema as Schema)
    : undefined;
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={allowHtml ? [rehypeRaw, [rehypeSanitize, schema]] : []}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
