/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		// Material Design: Standard 4dp border radius
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'material': '4px', // Material Design standard
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
  			'material': '250ms',
  		},
  		// Material Design: Typography scale with Roboto
  		fontFamily: {
  			'sans': ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
  			'material': ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
  		},
		colors: {
			// Taklaget Brand Colors
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
				}
			},
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			primary: {
				DEFAULT: '#f97316', // Brand orange
				foreground: '#ffffff'
			},
			secondary: {
				DEFAULT: '#1e40af', // Brand dark blue
				foreground: '#ffffff'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: '#fbbf24', // Brand warm yellow
				foreground: '#1e40af'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			}
		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
