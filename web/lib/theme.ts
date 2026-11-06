/** Theme preference persisted in localStorage. */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "persisteapp.theme";

/**
 * Inline script for <head>: applies the saved theme (or the OS preference)
 * before first paint, so the page never flashes the wrong theme.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})();`;

/** Returns the theme to switch to from the current one. */
export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
