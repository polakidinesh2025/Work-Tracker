import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      screens: {
        // Phones and tablets without a mouse: `touch:hidden`, `touch:inline-flex`, ...
        touch: { raw: '(hover: none) and (pointer: coarse)' }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } }
      },
      animation: {
        'slide-in': 'slide-in 180ms cubic-bezier(0.2, 0, 0, 1)',
        'sheet-up': 'sheet-up 200ms cubic-bezier(0.2, 0, 0, 1)'
      },
      colors: {
        status: {
          backlog: '#6B7280',
          todo: '#3B82F6',
          progress: '#F59E0B',
          blocked: '#EF4444',
          done: '#10B981'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
