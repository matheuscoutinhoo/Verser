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
          elevated: 'var(--surface-elevated)',
        },
        border: {
          primary: 'var(--border-primary)',
          strong: 'var(--border-strong)',
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
          'gold-soft': 'var(--accent-gold-soft)',
          'gold-light': 'var(--accent-gold-light)',
          red: 'var(--accent-red)',
          'red-soft': 'var(--accent-red-soft)',
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
        soft: 'var(--shadow-sm)',
        elevated: 'var(--shadow-md)',
        deep: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
        ornate: '0 2px 14px -4px rgba(196, 162, 101, 0.6)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      backgroundImage: {
        'parchment-gradient':
          'radial-gradient(120% 80% at 50% 0%, rgba(196,162,101,0.08), transparent 60%)',
        'subtle-grid':
          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        fast: '140ms',
        DEFAULT: '220ms',
        slow: '360ms',
      },
    },
  },
  plugins: [],
};
