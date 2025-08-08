/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './monitoring/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Anthropic-inspired color scheme
        primary: {
          50: '#fef7ed',
          100: '#fdedd3',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#9a3412',
        },
        status: {
          operational: '#10b981',
          degraded: '#f59e0b',
          partial: '#f97316',
          major: '#ef4444',
          maintenance: '#6b7280',
        },
        dashboard: {
          bg: '#fafafa',
          card: '#ffffff',
          border: '#e5e7eb',
          text: '#111827',
          muted: '#6b7280',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
