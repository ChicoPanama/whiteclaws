import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Keep Tailwind utility classes aligned with the site's existing brand font CSS variables.
        // This avoids accidental overrides (e.g. `font-sans` on <body>) causing typography regressions.
        sans: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'SF Mono', 'monospace'],
        display: ['var(--font-display)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        g: {
          50: '#fafafa',
          100: '#f5f5f5',
          150: '#eeeeee',
          200: '#e0e0e0',
          300: '#bdbdbd',
          400: '#9e9e9e',
          500: '#757575',
          600: '#616161',
          700: '#424242',
          800: '#303030',
          850: '#222222',
          900: '#171717',
          950: '#0d0d0d',
        },
      },
    },
  },
  plugins: [],
}
export default config
