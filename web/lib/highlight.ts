/** Code tokens: [text, light color, dark color]. Compact so the static page stays small. */
export type CodeToken = [text: string, light: string, dark: string];
export type TokenLines = CodeToken[][];
/** Highlighted code per `highlightKey(language, code)`. */
export type Highlights = Record<string, TokenLines>;

export const highlightKey = (language: string, code: string) => `${language}\u0000${code}`;
