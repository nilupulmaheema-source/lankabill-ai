/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sl: {
          navy: '#0f172a',
          emerald: '#059669',
          amber: '#d97706',
          ruby: '#dc2626',
          saffron: '#f59e0b',
          teal: '#0d9488',
        }
      },
      screens: {
        'xs': '400px',
      }
    },
  },
  plugins: [],
}
