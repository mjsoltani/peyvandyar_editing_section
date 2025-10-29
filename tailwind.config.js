/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Vazir', 'IRANSans', 'Sahel', 'Tahoma', 'sans-serif'],
        'display': ['IRANSans', 'Vazir', 'sans-serif'],
        'body': ['Vazir', 'IRANSans', 'Sahel', 'sans-serif'],
        'warm': ['Sahel', 'Vazir', 'IRANSans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}