
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'mobile': { 'max': '767px' },
				'tablet': { 'min': '768px', 'max': '1023px' },
				'desktop': { 'min': '1024px' },
				'mobile-only': { 'max': '767px' },
				'tablet-only': { 'min': '768px', 'max': '1023px' },
				'desktop-only': { 'min': '1024px' },
			},
			fontFamily: {
				'bebas': ['Bebas Neue', 'cursive'],
				'epilogue': ['Epilogue', 'sans-serif'],
				'outfit': ['Outfit', 'sans-serif'],
				'racing': ['Racing Sans One', 'cursive'],
				'sans': ['Outfit', 'sans-serif'], // Default sans font
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					green: 'hsl(var(--accent-green))',
					blue: 'hsl(var(--accent-blue))',
					red: 'hsl(var(--accent-red))',
					purple: 'hsl(var(--accent-purple))'
				},
				gold: 'hsl(var(--gold))',
				"tournament-gold": "hsl(var(--tournament-gold))",
				"tournament-silver": "hsl(var(--tournament-silver))",
				"tournament-bronze": "hsl(var(--tournament-bronze))",
				"tournament-accent": "hsl(var(--tournament-accent))",
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				}
			},
			backgroundImage: {
				"gradient-tournament-gold": "var(--gradient-tournament-gold)",
				"gradient-tournament-silver": "var(--gradient-tournament-silver)",
				"gradient-tournament-bronze": "var(--gradient-tournament-bronze)",
			},
			boxShadow: {
				"tournament-glow": "var(--shadow-tournament-glow)",
				"tournament-subtle": "var(--shadow-tournament-subtle)",
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				fadeIn: {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				slideUp: {
					from: { transform: 'translateY(100%)' },
					to: { transform: 'translateY(0)' }
				},
				// SABO Tech Border Animations
				'sabo-border-pulse': {
					'0%, 100%': { opacity: '1', filter: 'brightness(1)' },
					'50%': { opacity: '0.8', filter: 'brightness(1.2)' }
				},
				'sabo-tech-lines': {
					'0%': { backgroundPosition: '0 0, 0 0' },
					'100%': { backgroundPosition: '50px 0, 0 50px' }
				},
				'sabo-warning-pulse': {
					'0%': { boxShadow: '0 0 15px hsl(var(--accent-red) / 0.3)' },
					'100%': { boxShadow: '0 0 25px hsl(var(--accent-red) / 0.6)' }
				},
				'sabo-premium-rotate': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'sabo-data-flow': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fadeIn 0.3s ease-out',
				'slide-up': 'slideUp 0.2s ease-out',
				'spin-slow': 'spin 3s linear infinite',
				// SABO Tech Border Animations
				'sabo-border-pulse': 'sabo-border-pulse 3s ease-in-out infinite',
				'sabo-tech-lines': 'sabo-tech-lines 4s linear infinite',
				'sabo-warning-pulse': 'sabo-warning-pulse 2s ease-in-out infinite alternate',
				'sabo-premium-rotate': 'sabo-premium-rotate 6s linear infinite',
				'sabo-data-flow': 'sabo-data-flow 2s ease-in-out infinite'
			},
			spacing: {
				'safe-top': 'var(--safe-area-inset-top)',
				'safe-bottom': 'var(--safe-area-inset-bottom)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
