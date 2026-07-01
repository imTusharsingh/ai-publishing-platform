/**
 * AuraNews design tokens from Stitch "AI News Orchestrator" project.
 * Shared across apps/web (public) and apps/admin.
 */
export const auraColors = {
  primary: '#15157d',
  'on-primary': '#ffffff',
  'primary-container': '#2e3192',
  'on-primary-container': '#9da1ff',
  'primary-fixed': '#e1e0ff',
  'primary-fixed-dim': '#c0c1ff',
  'on-primary-fixed': '#04006d',
  'on-primary-fixed-variant': '#373a9b',
  secondary: '#006c49',
  'on-secondary': '#ffffff',
  'secondary-container': '#6cf8bb',
  'on-secondary-container': '#00714d',
  'secondary-fixed': '#6ffbbe',
  'secondary-fixed-dim': '#4edea3',
  'on-secondary-fixed': '#002113',
  'on-secondary-fixed-variant': '#005236',
  tertiary: '#0c0092',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#2421b6',
  'on-tertiary-container': '#9ea1ff',
  'tertiary-fixed': '#e1e0ff',
  'tertiary-fixed-dim': '#c0c1ff',
  'on-tertiary-fixed': '#07006c',
  'on-tertiary-fixed-variant': '#2f2ebe',
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',
  background: '#faf8ff',
  'on-background': '#131b2e',
  surface: '#faf8ff',
  'on-surface': '#131b2e',
  'surface-dim': '#d2d9f4',
  'surface-bright': '#faf8ff',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f2f3ff',
  'surface-container': '#eaedff',
  'surface-container-high': '#e2e7ff',
  'surface-container-highest': '#dae2fd',
  'surface-variant': '#dae2fd',
  'on-surface-variant': '#464652',
  outline: '#777683',
  'outline-variant': '#c7c5d4',
  'inverse-surface': '#283044',
  'inverse-on-surface': '#eef0ff',
  'inverse-primary': '#c0c1ff',
  'surface-tint': '#4f54b4',
};

export const auraSpacing = {
  'stack-xs': '0.25rem',
  'stack-sm': '0.5rem',
  'stack-md': '1rem',
  'stack-lg': '2rem',
  gutter: '1.5rem',
  'margin-mobile': '1rem',
  'margin-desktop': '2rem',
  'container-max': '1280px',
};

export const auraFontSize = {
  display: ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
  'headline-lg': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
  'headline-md': ['1.5rem', { lineHeight: '1.25', fontWeight: '600' }],
  'headline-sm': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
  'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-md': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
  'body-sm': ['0.875rem', { lineHeight: '1.45', fontWeight: '400' }],
  'label-md': ['0.875rem', { lineHeight: '1.25', fontWeight: '500' }],
  'label-sm': ['0.75rem', { lineHeight: '1.2', fontWeight: '500' }],
};

export const auraTailwindTheme = {
  colors: auraColors,
  spacing: auraSpacing,
  fontSize: auraFontSize,
  maxWidth: {
    'container-max': auraSpacing['container-max'],
  },
  fontFamily: {
    display: ['var(--font-geist)', 'system-ui', 'sans-serif'],
    sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  },
  borderRadius: {
    DEFAULT: '0.125rem',
    lg: '0.25rem',
    xl: '0.5rem',
    full: '0.75rem',
  },
  boxShadow: {
    card: '0 1px 2px 0 rgb(21 21 125 / 0.06)',
    panel: '0 4px 12px 0 rgb(21 21 125 / 0.08)',
  },
};
