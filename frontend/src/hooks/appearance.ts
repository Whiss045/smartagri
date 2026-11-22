// Theme + font size: valid values, saving to the browser, and applying to the page.
// They are applied as attributes on <html>, and tokens.css reacts to those attributes.
export const THEMES = ["light", "warm", "dark"] as const;
export const FONT_SIZES = ["small", "medium", "large"] as const;
export type Theme = (typeof THEMES)[number];
export type FontSize = (typeof FONT_SIZES)[number];
export type Appearance = { theme: Theme; font: FontSize };

const KEY = "smartagri_appearance";
const DEFAULTS: Appearance = { theme: "light", font: "medium" };

// Reads the saved choice. Anything missing, invalid or blocked by the browser falls back to defaults.
export function loadAppearance(): Appearance {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      theme: THEMES.includes(raw.theme) ? raw.theme : DEFAULTS.theme,
      font: FONT_SIZES.includes(raw.font) ? raw.font : DEFAULTS.font,
    };
  } catch {
    return DEFAULTS;
  }
}

// Sets the attributes on <html>
export function applyAppearance(a: Appearance): void {
  document.documentElement.dataset.theme = a.theme;
  document.documentElement.dataset.font = a.font;
}

// Applies the choice now and remembers it for next time
export function saveAppearance(a: Appearance): void {
  applyAppearance(a);
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* private mode or blocked storage: the choice just won't survive a reload */
  }
}
