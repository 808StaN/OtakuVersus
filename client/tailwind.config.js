/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#06070c',
          900: '#0f1221',
          800: '#171b30',
          700: '#202640',
          paper: '#fdf4e4',
          ink: '#0a0a0f'
        },
        neon: {
          cyan: '#ffd84a',
          pink: '#ff4f72',
          violet: '#ff951c',
          blue: '#ffb74d',
          magenta: '#ff3b30'
        }
      },
      boxShadow: {
        panel: '6px 6px 0 #0a0a0f',
        'panel-hover': '10px 10px 0 #0a0a0f',
        sticker: '4px 4px 0 #0a0a0f',
        inset: 'inset 0 0 0 1px rgba(255,255,255,0.08)'
      },
      backgroundImage: {
        'hero-glow':
          'linear-gradient(130deg, #131932 0%, #0a0f22 45%, #241118 100%), repeating-linear-gradient(120deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 18px)',
        halftone:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)',
        speedlines:
          'repeating-linear-gradient(145deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 16px)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 216, 74, 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 79, 114, 0.08)' }
        },
        bounceInk: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' }
        },
        jitter: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-0.8deg)' },
          '75%': { transform: 'rotate(0.8deg)' }
        },
        impact: {
          '0%': { transform: 'scale(0.94)' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        glow: 'pulseGlow 2.2s ease-in-out infinite',
        bounce: 'bounceInk 1.2s ease-in-out infinite',
        jitter: 'jitter 0.7s steps(2) infinite',
        impact: 'impact 0.35s ease-out'
      }
    }
  },
  plugins: []
};
