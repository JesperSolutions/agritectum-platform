/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Material Design: Standard 4dp border radius (unified design system)
      borderRadius: {
        material: '4px', // Material Design standard - use for all interactive elements
        lg: 'var(--radius)', // Legacy - migrating to rounded-material
        md: 'calc(var(--radius) - 2px)', // Legacy - migrating to rounded-material
        sm: 'calc(var(--radius) - 4px)', // Legacy - migrating to rounded-material
      },
      // Material Design: Elevation shadows (6 levels)
      boxShadow: {
        'material-1': '0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.24)',
        'material-2': '0 3px 6px 0 rgba(0, 0, 0, 0.15), 0 2px 4px 0 rgba(0, 0, 0, 0.12)',
        'material-3': '0 10px 20px 0 rgba(0, 0, 0, 0.15), 0 3px 6px 0 rgba(0, 0, 0, 0.10)',
        'material-4': '0 15px 25px 0 rgba(0, 0, 0, 0.15), 0 5px 10px 0 rgba(0, 0, 0, 0.05)',
        'material-5': '0 20px 40px 0 rgba(0, 0, 0, 0.2)',
        'material-6': '0 25px 50px 0 rgba(0, 0, 0, 0.25)',
      },
      // Material Design: Standard transition timing
      transitionDuration: {
        material: '250ms',
      },
      // Typography scale with Outfit
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        material: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // AG Brand Colors - 4 official Agritectum colors
        ag: {
          green: {
            50: '#f5f8ec',
            100: '#eaf0d5',
            200: '#d5e1ab',
            300: '#bfd281',
            400: '#b1c66a',
            500: '#A1BA53', // AG Green
            600: '#8a9f47',
            700: '#73853b',
            800: '#5c6a2f',
            900: '#445023',
          },
          red: {
            50: '#fdf2f3',
            100: '#fce4e7',
            200: '#f9c9cf',
            300: '#f0a0aa',
            400: '#e47886',
            500: '#DA5062', // AG Red
            600: '#c23d4f',
            700: '#a33040',
            800: '#872a38',
            900: '#6e2530',
          },
          blue: {
            50: '#f1f6fa',
            100: '#e0ecf4',
            200: '#c4dcea',
            300: '#a4c8dc',
            400: '#90b8d4',
            500: '#7DA8CC', // AG Blue
            600: '#6890b3',
            700: '#567896',
            800: '#476279',
            900: '#3b5060',
          },
          purple: {
            50: '#f8f2f8',
            100: '#f0e3f1',
            200: '#e0c5e1',
            300: '#cca3ce',
            400: '#b882bb',
            500: '#956098', // AG Purple
            600: '#7f5182',
            700: '#69436c',
            800: '#553657',
            900: '#432b45',
          },
        },
        // CSS Variable Colors (for compatibility)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Primary/Secondary use AG brand colors
        primary: {
          DEFAULT: '#7DA8CC', // AG Blue
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#A1BA53', // AG Green
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#956098', // AG Purple
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      // Spacing: 8dp grid system (0.5rem = 8px base unit)
      spacing: {
        // Material Design 8dp increments
        0.5: '0.125rem', // 2px (0.25dp)
        1: '0.25rem', // 4px (0.5dp)
        2: '0.5rem', // 8px (1dp) - base unit
        3: '0.75rem', // 12px (1.5dp)
        4: '1rem', // 16px (2dp)
        6: '1.5rem', // 24px (3dp)
        8: '2rem', // 32px (4dp)
        12: '3rem', // 48px (6dp)
        16: '4rem', // 64px (8dp)
        24: '6rem', // 96px (12dp)
      },
      // Custom animations for micro-interactions
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-2deg)' },
          '75%': { transform: 'rotate(2deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
        'bounce-subtle': 'bounce-subtle 0.4s ease-in-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'wiggle': 'wiggle 0.3s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
