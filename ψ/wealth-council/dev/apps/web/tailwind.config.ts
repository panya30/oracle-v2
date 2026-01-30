import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Palantir-inspired color palette
      colors: {
        // Base colors - deep dark blues
        palantir: {
          bg: '#0a0e14',
          'bg-elevated': '#0f1419',
          'bg-card': '#141a21',
          'bg-hover': '#1a2330',
          border: '#1e2a3a',
          'border-light': '#2a3a4d',
        },
        // Text colors
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#6e7681',
          inverse: '#0a0e14',
        },
        // Accent colors
        accent: {
          cyan: '#00d4ff',
          'cyan-dim': '#0099cc',
          blue: '#2f81f7',
          purple: '#a371f7',
        },
        // Status colors
        status: {
          success: '#3fb950',
          'success-dim': '#238636',
          warning: '#d29922',
          'warning-dim': '#9e6a03',
          danger: '#f85149',
          'danger-dim': '#da3633',
          info: '#58a6ff',
        },
        // Chart colors
        chart: {
          green: '#26a641',
          red: '#f85149',
          blue: '#58a6ff',
          purple: '#a371f7',
          orange: '#db6d28',
          yellow: '#d29922',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xxs': '0.65rem',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-green': '0 0 20px rgba(63, 185, 80, 0.15)',
        'glow-red': '0 0 20px rgba(248, 81, 73, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `linear-gradient(rgba(30, 42, 58, 0.5) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(30, 42, 58, 0.5) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
