import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b6d7ff',
          300: '#85bcff',
          400: '#4d9aff',
          500: '#2eeaff',
          600: '#1a4fb2',
          700: '#04a4cc',
          800: '#0057b8',
          900: '#623394'
        }
      }
    }
  },
  plugins: [animate]
}

export default config
