/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          paper: '#fdf4e4',
          ink: '#0a0a0f'
        }
      },
      boxShadow: {
        panel: '6px 6px 0 #0a0a0f',
        'panel-hover': '10px 10px 0 #0a0a0f',
        sticker: '4px 4px 0 #0a0a0f',
        inset: 'inset 0 0 0 1px rgba(255,255,255,0.08)'
      },
      backgroundImage: {
        speedlines:
          'repeating-linear-gradient(145deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 16px)'
      },
      keyframes: {},
      animation: {}
    }
  },
  plugins: []
};
