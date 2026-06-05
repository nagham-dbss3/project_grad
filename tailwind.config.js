/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          soft: 'var(--primary-soft)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          soft: 'var(--secondary-soft)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          soft: 'var(--accent-soft)',
        },
        highlight: {
          DEFAULT: 'var(--highlight)',
          foreground: 'var(--highlight-foreground)',
          soft: 'var(--highlight-soft)',
        },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        success: { DEFAULT: 'var(--success)', foreground: 'var(--success-foreground)' },
        warning: { DEFAULT: 'var(--warning)', foreground: 'var(--warning-foreground)' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
        '4xl': 'calc(var(--radius) + 16px)',
      },
      fontFamily: {
        sans: ['Tajawal', 'Nunito', 'system-ui', 'sans-serif'],
        display: ['Quicksand', 'Tajawal', 'sans-serif'],
        arabic: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgb(17 36 56 / 0.08), 0 4px 16px -4px rgb(17 36 56 / 0.06)',
        card: '0 1px 3px rgb(17 36 56 / 0.06), 0 4px 20px -6px rgb(17 36 56 / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
