/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
        },
        border: {
          primary: 'var(--border-primary)',
          ornate: 'var(--border-ornate)',
          glow: 'var(--border-glow)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        accent: {
          gold: 'var(--accent-gold)',
          'gold-light': 'var(--accent-gold-light)',
          red: 'var(--accent-red)',
          green: 'var(--accent-green)',
          blue: 'var(--accent-blue)',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Cormorant Garamond', 'serif'],
        editor: ['Inter', 'sans-serif'],
        ui: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 18px -2px rgba(196, 162, 101, 0.45)',
        ornate: '0 2px 14px -4px rgba(196, 162, 101, 0.6)',
      },
      backgroundImage: {
        'parchment-gradient':
          'radial-gradient(120% 80% at 50% 0%, rgba(196,162,101,0.08), transparent 60%)',
      },
    },
  },
  plugins: [],
};
