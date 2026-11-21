/**
 * MYai design tokens. Colours were sampled from the marketing poster (PLAN section 2)
 * and are approximate: replace them with the values from the brand files once supplied (decision 2).
 * The same values are mirrored as CSS variables in ../tokens.css for Tailwind on the web.
 * Mobile (phase 3) reads this file directly.
 */
export const colors = {
  bg: "#010416",
  bgDeep: "#0C0825",
  surface: "#00051B",
  surfaceRaised: "#06113E",
  border: "#332D6F",
  primary: "#5B71FA",
  primarySoft: "#6989F8",
  secondary: "#BD32C1",
  highlight: "#FFBEFF",
  text: "#FEFEFE",
  textMuted: "#857EAE",
  danger: "#F2557A",
  success: "#3DD68C",
} as const;

export const radii = { sm: 8, md: 12, lg: 20, xl: 28, full: 9999 } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const motion = { fast: 120, base: 200, slow: 320 } as const;

/** The wordmark gradient: blue to magenta. */
export const brandGradient = [colors.primary, colors.secondary] as const;

export type ColorToken = keyof typeof colors;
