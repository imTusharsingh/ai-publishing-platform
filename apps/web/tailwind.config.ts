import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        'surface-muted': '#f8fafc',
        content: '#0f172a',
        'content-muted': '#475569',
        'content-subtle': '#94a3b8',
        line: '#e2e8f0',
        accent: '#0f172a',
        'accent-foreground': '#ffffff',
        danger: '#dc2626',
        'danger-surface': '#fef2f2',
        'danger-border': '#fecaca',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        panel: '0 1px 3px 0 rgb(15 23 42 / 0.08)',
      },
      maxWidth: {
        page: '72rem',
      },
    },
  },
  plugins: [],
};

export default config;
