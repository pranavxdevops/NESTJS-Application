import { marked } from "marked";

export const parseRichText = (content: any): string => {
  if (!content) return '';

  if (Array.isArray(content)) {
    content = content
      .map((block) =>
        block?.children?.map((child: any) => child?.text).join('')
      )
      .join('\n');
  }

  return marked.parse(content) as string; // 👈 cast result to string
};
