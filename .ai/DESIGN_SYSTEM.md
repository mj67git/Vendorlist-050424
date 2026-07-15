# Design System Specification

## 1. Color Palette
We utilize a sophisticated, corporate-grade palette that communicates precision:
- **Primary Text**: Deep Charcoal (`text-slate-900`)
- **Body Text**: Charcoal Medium (`text-slate-600`)
- **Subdued Text**: Muted Slate (`text-slate-400`)
- **Main Background**: Off-White (`bg-slate-50/50`)
- **Card Background**: Pure White (`bg-white`)
- **Brand Colors**:
  - Teal Accent: `text-teal-600`, `bg-teal-50`
  - Emerald Success: `text-emerald-600`, `bg-emerald-50`
  - Amber Warning: `text-amber-600`, `bg-amber-50`
  - Rose Danger: `text-rose-600`, `bg-rose-50`

## 2. Typography
- **Primary Sans**: `Inter` (sans-serif) for clean Latin structures and interface headers.
- **Primary Persian**: Standard web-safe sans-serif fonts optimized for high readability in corporate Persian platforms.
- **Mono Space**: `JetBrains Mono` or standard monospace for technical metrics, CAS numbers, IRC codes, and timestamps in logs.

## 3. Borders & Shadows
- **Card Corners**: Rounded Medium (`rounded-xl` or `12px`) for a soft, friendly, yet professional structure.
- **Input Corners**: Rounded Regular (`rounded-lg` or `8px`).
- **Shadow Profile**:
  - Subdued Card Elevation: `shadow-sm`
  - Floating Drawers & Popups: `shadow-xl` combined with dynamic backdrop blurs (`backdrop-blur-sm`).

## 4. Layout & Spacing Rhythm
- **Layout Container**: Fluid, desktop-first container pattern (`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
- **Grid Spacing**: 16px to 24px (`gap-4` to `gap-6`) standard spacing profile to maintain a relaxed visual rhythm.
- **Margin Rhythms**: Staggered margins to emphasize visual sections. No repetitive boilerplate gaps.
- **Transitions & Micro-Animations**: Smooth entry translations (`transition-all duration-200 ease-out`). Scale and hover effects on key navigation elements.
