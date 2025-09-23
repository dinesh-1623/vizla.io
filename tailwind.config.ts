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
        vizla: {
          canvas: "var(--vizla-canvas)",
          elev1: "var(--vizla-elev1)",
          elev2: "var(--vizla-elev2)",
          glass: "var(--vizla-glass)",
          glassBorder: "var(--vizla-glassBorder)",
          glassElev: "var(--vizla-glassElev)",
          text: {
            primary: "var(--vizla-text-primary)",
            secondary: "var(--vizla-text-secondary)",
            muted: "var(--vizla-text-muted)",
            disabled: "var(--text-disabled)",
          },
          brand: {
            primary: "var(--vizla-brand-primary)",
            secondary: "var(--vizla-brand-secondary)",
          },
          success: "var(--vizla-success)",
          warning: "var(--vizla-warning)",
          danger: "var(--vizla-danger)",
          info: "var(--vizla-info)",
          ring: {
            focus: "var(--vizla-ring-focus)",
            hover: "var(--ring-hover)",
          },
          borderSubtle: "var(--vizla-border-subtle)",
          /* Heatmap Palettes */
          lagoon: {
            1: "var(--vizla-lagoon-1)",
            2: "var(--vizla-lagoon-2)",
            3: "var(--vizla-lagoon-3)",
            4: "var(--vizla-lagoon-4)",
            5: "var(--vizla-lagoon-5)",
            6: "var(--vizla-lagoon-6)",
            7: "var(--vizla-lagoon-7)",
          },
          indigo: {
            1: "var(--vizla-indigo-1)",
            2: "var(--vizla-indigo-2)",
            3: "var(--vizla-indigo-3)",
            4: "var(--vizla-indigo-4)",
            5: "var(--vizla-indigo-5)",
            6: "var(--vizla-indigo-6)",
            7: "var(--vizla-indigo-7)",
          },
          neutral: {
            1: "var(--vizla-neutral-1)",
            2: "var(--vizla-neutral-2)",
            3: "var(--vizla-neutral-3)",
            4: "var(--vizla-neutral-4)",
            5: "var(--vizla-neutral-5)",
            6: "var(--vizla-neutral-6)",
            7: "var(--vizla-neutral-7)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      ringColor: {
        DEFAULT: "var(--ring-focus)",
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
