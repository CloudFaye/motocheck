/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Geist"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      colors: {
        gold: {
          50:  '#fdf8ee',
          100: '#faefd0',
          200: '#f5db97',
          300: '#efc358',
          400: '#e8ae32',
          500: '#d4943a', // primary accent
          600: '#b97320',
          700: '#96541c',
          800: '#7b421e',
          900: '#66371c',
        },
        navy: {
          50:  '#f0f4f9',
          100: '#dae4f0',
          200: '#b8cce3',
          300: '#88aacf',
          400: '#5583b7',
          500: '#34649e',
          600: '#264e84',
          700: '#1e3c6a',
          800: '#1a3059',  // primary dark
          900: '#111e38',
        },
        ink: {
          DEFAULT: '#0f0f0f',
          soft:    '#2d2d2d',
          muted:   '#6b7280',
          faint:   '#9ca3af',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle:  '#f8f8f6',
          warm:    '#faf9f7',
          border:  '#e8e8e4',
        },
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        display: ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.8rem, 3.5vw, 2.8rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'crisp': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'lifted': '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
        'card': '0 0 0 1px rgb(0 0 0 / 0.04), 0 8px 32px -4px rgb(0 0 0 / 0.08)',
        'gold': '0 4px 20px -4px rgb(212 148 58 / 0.35)',
        'inset-border': 'inset 0 0 0 1px rgb(0 0 0 / 0.07)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
