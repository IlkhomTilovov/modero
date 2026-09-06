import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        warm: {
          cream: "hsl(var(--warm-cream))",
          beige: "hsl(var(--warm-beige))",
          brown: "hsl(var(--warm-brown))",
        },
        wood: {
          dark: "hsl(var(--dark-wood))",
        },
        gold: {
          accent: "hsl(var(--gold-accent))",
        },
        sage: {
          green: "hsl(var(--sage-green))",
        },
        "media-foreground": "hsl(var(--media-foreground))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        whatsapp: {
          DEFAULT: "hsl(var(--whatsapp))",
          foreground: "hsl(var(--whatsapp-foreground))",
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Manrope', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-r": {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-l": {
          from: { opacity: "0", transform: "translateX(-40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "set-card": {
          "0%": { opacity: "0", transform: "translateY(28px) scale(0.97)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "set-title": {
          from: { opacity: "0", transform: "translateY(14px)", letterSpacing: "0.02em" },
          to: { opacity: "1", transform: "translateY(0)", letterSpacing: "-0.02em" },
        },
        "set-img": {
          from: { transform: "scale(1.08)" },
          to: { transform: "scale(1)" },
        },
        "slide-cinema-r": {
          "0%": { opacity: "0", transform: "translateX(60px) scale(0.96)", filter: "blur(8px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)", filter: "blur(0)" },
        },
        "slide-cinema-l": {
          "0%": { opacity: "0", transform: "translateX(-60px) scale(0.96)", filter: "blur(8px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)", filter: "blur(0)" },
        },
        "slide-out-l": {
          "0%": { opacity: "1", transform: "translateX(0) scale(1)", filter: "blur(0)" },
          "100%": { opacity: "0", transform: "translateX(-80px) scale(0.96)", filter: "blur(8px)" },
        },
        "slide-out-r": {
          "0%": { opacity: "1", transform: "translateX(0) scale(1)", filter: "blur(0)" },
          "100%": { opacity: "0", transform: "translateX(80px) scale(0.96)", filter: "blur(8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-r": "slide-in-r 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-l": "slide-in-l 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        "set-card": "set-card 0.75s cubic-bezier(0.22, 1, 0.36, 1) both",
        "set-title": "set-title 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "set-img": "set-img 1.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-cinema-r": "slide-cinema-r 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-cinema-l": "slide-cinema-l 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-out-l": "slide-out-l 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-out-r": "slide-out-r 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
