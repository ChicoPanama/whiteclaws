import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // next/font injects --font-body, --font-mono, --font-display on <html>.
        sans: ['var(--fb)', 'sans-serif'],
        mono: ['var(--fm)', 'monospace'],
        display: ['var(--fd)', 'sans-serif'],
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
