// tailwind.config.js
import { heroui } from '@heroui/theme'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './node_modules/@heroui/theme/dist/components/(button|input|ripple|spinner|form).js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-roboto)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
      colors: {
        'surface-primary': 'var(--color-surface-primary)',
        'surface-secondary': 'var(--color-surface-secondary)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-strong': 'var(--color-border-strong)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
      },
    },
  },
  darkMode: 'selector',
  plugins: [heroui()],
}
