/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'paper': {
          DEFAULT: '#f4f1ea',
          dark: '#e8e4d8', // 少し暗めのバリエーション（ホバー用など）
        },
        'ink': '#2c2c2c', // 紙に合う「墨」のような色もセットで定義すると◎
      },　
    },
  },
  plugins: [],
}
