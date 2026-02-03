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
      // Material Design: Typography scale with Roboto
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        material: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Taklaget Brand Colors (RESERVED FOR MARKETING PAGES ONLY)
        // UI components should use slate colors from design system
        brand: {
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316', // Primary orange
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af', // Primary dark blue
            900: '#1e3a8a',
          },
          warm: {
            50: '#fefce8',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
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
        // Primary/Secondary use brand colors (for marketing compatibility)
        // UI components should use slate-700 for primary buttons
        primary: {
          DEFAULT: '#f97316', // Brand orange (marketing only)
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1e40af', // Brand dark blue (marketing only)
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#fbbf24', // Brand warm yellow (marketing only)
          foreground: '#1e40af',
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
