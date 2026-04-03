/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. カラーパレットの定義
      colors: {
        vanity: {
          dark: '#0a0a0a',   // 漆黒
          gold: '#8a7a5a',   // 金褐色
          deepRed: '#450a0a', // ゴダール的な赤
        },
      },
      // 2. タイポグラフィの定義
      // 3. アニメーションの拡張
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '0' },
          '10%, 90%': { opacity: '1' },
          '91%': { opacity: '0' },
        },
        // 霧の中から浮かび上がるようなフェードイン
        'subtle-in': {
          '0%': { opacity: '0', filter: 'blur(4px)', transform: 'scale(0.98)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' },
        },
        // 映画の終わりのような静かなフェードアウト
        'shroud-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0', background: '#000' },
        }
      },
      animation: {
        flash: 'flash 2s steps(1) infinite',
        'subtle-in': 'subtle-in 1.5s ease-out forwards',
        'shroud-out': 'shroud-out 2s ease-in forwards',
      }
    },
  },
  // 4. プラグインの導入
  plugins: [
    require('tailwindcss-animate'), // tailwindcss-animateプラグイン（要インストール）
  ],
}
