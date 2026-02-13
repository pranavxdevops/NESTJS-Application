import type { Config } from "tailwindcss";

export default {
  // darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        source: ['Source Sans Pro', 'sans-serif'],
        geist: ["var(--font-geist)", "sans-serif"],
        geistMono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--color-primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // WFZO Design System Colors
        'wfzo': {
          'gold': {
            25: "hsl(var(--wfzo-gold-25))",
            100: "hsl(var(--wfzo-gold-100))",
            200: "hsl(var(--wfzo-gold-200))",
            500: "hsl(var(--wfzo-gold-500))",
            600: "hsl(var(--wfzo-gold-600))",
            700: "hsl(var(--wfzo-gold-700))",
          },
          'grey': {
            200: "hsl(var(--wfzo-grey-200))",
            400: "hsl(var(--wfzo-grey-400))",
            600: "hsl(var(--wfzo-grey-600))",
            700: "hsl(var(--wfzo-grey-700))",
            800: "hsl(var(--wfzo-grey-800))",
            900: "hsl(var(--wfzo-grey-900))",
          },
          'glass': {
            'stroke': "rgba(255, 255, 255, 0.35)",
            'fill': "rgba(255, 255, 255, 0.07)",
          },
        },
        'yellow': {
          50: "hsl(var(--yellow-50))",
          500: "hsl(var(--yellow-500))",
        },
        'red': {
          50: "hsl(var(--red-50))",
          500: "hsl(var(--red-500))",
        },
        'green': {
          50: "hsl(var(--green-50))",
          500: "hsl(var(--green-500))",
        },
        'blue': {
          50: "hsl(var(--blue-50))",
          500: "hsl(var(--blue-500))",
        },
        'purple': {
          50: "hsl(var(--purple-50))",
          500: "hsl(var(--purple-500))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '7.58px',
      },
      boxShadow: {
        'wfzo': '0 6px 14px -6px rgba(139, 105, 65, 0.12), 0 10px 32px -4px rgba(139, 105, 65, 0.10)',
        'glass': '-11.15px -10.392px 48px -12px rgba(0, 0, 0, 0.15), -1.858px -1.732px 12px -8px rgba(0, 0, 0, 0.15), 2.146px 2px 9.24px 0 rgba(255, 255, 255, 0.13) inset, 1.217px 1.134px 4.62px 0 rgba(255, 255, 255, 0.13) inset',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
