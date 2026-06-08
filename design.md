# Hisako Ops Design System

This document outlines the comprehensive design system for the **Hisako Ops** internal CRM and document factory application. It acts as the single source of truth for UI/UX patterns, typography, color palettes, and component structures used throughout the project.

## 1. Core Stack & Frameworks

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 (using `@theme inline` configuration)
- **Component Library:** Shadcn UI (Base-Nova style variant)
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Forms & State:** React Hook Form + Zod (standard Shadcn integration)

## 2. Typography

The application uses a clean, modern sans-serif stack to maintain high legibility for data-dense CRM interfaces.

- **Primary Font (Sans):** **Inter** (via `next/font/google`)
  - Configured as the default sans font via the `--font-sans` CSS variable.
  - Used for all standard text, headings, and UI elements.
- **Monospace Font:** **Geist Mono** (via `--font-geist-mono` variable)
  - Used for code snippets, references (e.g., invoice/client refs), and data presentation.
- **Global Antialiasing:** The `antialiased` utility is applied globally on the `<body>` tag.

## 3. Color Palette

The project uses an **OKLCH-based** semantic color system for robust dynamic theming (Light and Dark modes). It strictly adheres to Shadcn's variable structure but maps them to custom OKLCH values for perfectly neutral grays.

### Light Theme
- **Background (`--background`):** Pure White `oklch(1 0 0)`
- **Foreground (`--foreground`):** Dark Gray/Black `oklch(0.145 0 0)`
- **Surface (Cards/Popovers):** Pure White `oklch(1 0 0)`
- **Primary:** Dark Gray/Black `oklch(0.205 0 0)` (Text: Pure White `oklch(0.985 0 0)`)
- **Secondary/Muted/Accent:** Light Gray `oklch(0.97 0 0)`
- **Borders & Inputs:** Gray `oklch(0.922 0 0)`
- **Destructive:** Red `oklch(0.577 0.245 27.325)`

### Dark Theme
- **Background (`--background`):** Dark Gray `oklch(0.145 0 0)`
- **Foreground (`--foreground`):** Off-White `oklch(0.985 0 0)`
- **Surface (Cards/Popovers/Sidebar):** Slightly Lighter Gray `oklch(0.205 0 0)`
- **Primary:** Light Gray `oklch(0.922 0 0)` (Text: Dark Gray `oklch(0.205 0 0)`)
- **Secondary/Muted/Accent:** Medium-Dark Gray `oklch(0.269 0 0)`
- **Borders & Inputs:** Translucent White `oklch(1 0 0 / 10%)` and `oklch(1 0 0 / 15%)`
- **Destructive:** Light Red `oklch(0.704 0.191 22.216)`

### Custom Accent Colors (Inline Utilities)
While Shadcn manages the structural gray/neutral hierarchy, specific interactive and high-visibility elements utilize distinct hard-coded utility classes:
- **Brand Accent / Primary Actions:** Coral Red/Orange **`#E8400C`**
  - *Usage:* Primary call-to-action buttons (e.g., "Generate Document", "New Invoice"), active timeline indicators, and bar chart fills.
  - *Hover State:* `hover:bg-[#E8400C]/90`
- **Success / Positive Values:** Emerald
  - *Usage:* Retainer amounts, paid invoice statuses, billable hours.
  - *Classes:* `text-emerald-600` (Light) / `text-emerald-500` (Dark)
- **Warning / Outstanding Values:** Red
  - *Usage:* Overdue invoices, negative margins.
  - *Classes:* `text-red-600`

## 4. UI/UX Elements & Spacing

### Borders & Radius
- **Global Border Radius (`--radius`):** `0.625rem` (10px). This provides a modern, slightly rounded but professional aesthetic.
- Radius utilities map structurally (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, etc.) based on this base calculation.
- **Borders:** Thin `1px` borders using `border-zinc-200` (Light) and `border-zinc-800` (Dark) are standard for cards, tables, and dropdowns to create structural definition without heavy drop-shadows.

### Component Styling
- **Cards (`<Card>`):** 
  - Standard backgrounds use `bg-white` / `bg-zinc-950`.
  - Empty states utilize dashed borders and subdued backgrounds (`bg-zinc-50/50` / `bg-zinc-900/50`).
- **Tables (`<Table>` / Native HTML Tables):**
  - Headers: `bg-zinc-50` (Light) / `bg-zinc-900` (Dark) with `font-medium`.
  - Rows: Separated by `divide-y divide-zinc-200 dark:divide-zinc-800`.
- **Badges (`<Badge>`):** 
  - Standard: Neutral grays.
  - Status Indicators: Colored backgrounds with matching borders/text (e.g., Paid = `bg-emerald-50 text-emerald-600 border-emerald-200`).
- **Tabs (`<Tabs>`):** 
  - Layouts prioritize a horizontal row of pills (`grid-cols-6`) with subtle background transitions.

## 5. Layout & Grids

- **Max Constraints:** Most content views are constrained using `max-w-6xl` or `max-w-4xl` to ensure optimal reading widths.
- **Grid Systems:** 
  - Overviews generally follow a `1-column` to `3-column` shift on `lg` breakpoints (e.g., `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`).
  - Standard gap spacing is `gap-4` to `gap-6` (16px - 24px).
- **Background layering:** To add depth, the base page background is often slightly offset from the bright white elements, utilizing `bg-zinc-50` (Light) or `bg-zinc-950/50` (Dark) behind main content wrappers.

## 6. Interaction & Motion

- **Transitions:** Standard subtle transitions on interactive elements (`transition-colors`, opacity fades on hover).
- **Tooltips & Dropdowns:** Rely on Shadcn's native Radix UI primitives, featuring brief fade-in/out animations and z-index management.
- **Data Visualization:** Recharts bar charts are completely clean: no axis lines, no tick lines (`tickLine={false} axisLine={false}`), and bars have rounded top corners (`radius={[4, 4, 0, 0]}`).

## 7. Iconography

All icons are sourced from **Lucide React**. Common mappings include:
- `Globe` for websites
- `FileText` for documents and proposals
- `Plus` / `Edit` / `RefreshCw` for standard actions
- `DollarSign` for finance
- `CheckCircle2` for completed pipeline stages
- `ChevronDown` for secondary dropdown menus

---

## 8. Drop-in Configuration Files

To perfectly replicate this design system in a new Next.js project, use the following configurations exactly as they are.

### `src/app/globals.css`
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

### `components.json` (Shadcn Configuration)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

### `src/app/layout.tsx` (Font Configuration)
Ensure your root layout injects the Inter font variables.
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

---
*This design system is implemented via standard Tailwind utility classes and CSS variables, ensuring high maintainability and consistency across the Hisako Ops platform.*
