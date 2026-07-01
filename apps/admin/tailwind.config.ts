import type { Config } from 'tailwindcss';
import { auraTailwindTheme } from '@repo/shared';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: auraTailwindTheme as unknown as NonNullable<Config['theme']>['extend'],
  },
  plugins: [],
};

export default config;
