/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '0' },
          '10%, 90%': { opacity: '1' },
          '91%': { opacity: '0' },
        }
      },
      animation: {
        flash: 'flash 2s steps(1) infinite', // steps(1)で中間を飛ばしてパッと切り替える
      }
    },
  },
  plugins: [],
}
