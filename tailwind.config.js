/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bleu-cobalt': '#506EF9',
        'bleu-turquin': '#394869',
        'baby-blue': '#8DADBE',
        'chocolat': '#381D01',
        'ambre': '#F2BA05',
        'lin': '#F2EADA',
      },
      fontFamily: {
        nikkei: ['var(--font-nikkei)', 'sans-serif'],
        open: ['var(--font-open)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


