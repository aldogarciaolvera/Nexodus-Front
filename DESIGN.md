# Diseno del Proyecto
---
name: Obsidian Cyan
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#303034'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#c0c6d7'
  on-secondary: '#2a313e'
  secondary-container: '#404755'
  on-secondary-container: '#aeb5c6'
  tertiary: '#fff5de'
  on-tertiary: '#3b2f00'
  tertiary-container: '#fed639'
  on-tertiary-container: '#715d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#dce2f4'
  secondary-fixed-dim: '#c0c6d7'
  on-secondary-fixed: '#151c28'
  on-secondary-fixed-variant: '#404755'
  tertiary-fixed: '#ffe179'
  tertiary-fixed-dim: '#eac324'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  display:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-metric:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a high-precision, distraction-free command center for high-performing executives and founders. The design narrative blends **technical minimalism** with **stealth luxury**: deep obsidian surfaces, disciplined information density, and needle-sharp visual hierarchy.

The emotional resonance is calibrated for control, cognitive clarity, and effortless mastery. Rather than visually competing for the user's attention, the interface behaves like an ultra-responsive carbon-composite cockpit instrument—whispering through slate-gray metadata and igniting only when vital actions or states demand focus with focused bursts of high-voltage cyan.

## Colors

The palette operates under a strict dark-room regime. Deep charcoal and true blacks form a tiered foundation, preventing light pollution and eye strain during late-night or early-morning reviews.

- **Primary (`#00F0FF`)**: Electric vivid cyan. Reserved exclusively for active indicators, affirmative checkmarks, precision metrics, and live progression states. Never used for large background fills.
- **Secondary (`#8E95A5`)**: Cool muted slate. Carries secondary metadata, inactive iconography, structural labels, and inactive border treatments.
- **Neutral Surface Floor (`#0D0E11`)**: Deep pitch background representing ground zero.
- **Layered Charcoal Surfaces**: Tier 1 card fill is `#171922`; elevated floating overlays sit at `#1B1E28`.
- **Micro-Stroke Borders**: Hairline structural containment strokes use `#252836`, elevating to `#2E3245` on interaction or focus.
- **Pure White (`#FFFFFF`)**: High-contrast, uncompromised readability for key numerals, active headers, and primary text.

## Typography

Typography pairs the crisp neutral architecture of **Geist** for headlines and standard body copy with the surgical, analytical cadence of **JetBrains Mono** for quantitative readouts, timestamps, telemetry, and tracking tags.

- **Numerals & Metrics**: Always render financial units, workout tempos, and time intervals in mono to ensure alignment without tabular shifts.
- **Letter Spacing**: Display headings employ negative tracking for an engineered, modern tension. Label caps enforce open tracking (`0.08em`) to guarantee legibility at small sizes.

## Layout & Spacing

Layouts follow a structured fluid grid optimized for vertical mobile-first consumption with adaptable multi-column scaling on broader viewports:
- **Mobile (< 768px)**: 4-column single-stack layout. Standard canvas margins set to `1.25rem` (`20px`) with docked bottom navigation anchoring the viewport.
- **Tablet & Desktop (≥ 768px)**: 12-column structure with modular grid widgets, scaling outer canvas margins to `2.5rem` (`40px`).

Vertical rhythm relies on tight, mathematical nesting: cards internally space header and body segments with `space-md` (`14px`), while external component gaps maintain a strict `space-lg` (`20px`) rhythm to preserve breathing room between critical life categories.

## Elevation & Depth

This design system rejects heavy, muddy drop shadows in favor of **tonal layering**, **specular micro-borders**, and **glass translucency**, with full support for Dark (Obsidian Cyan) and Light modes:

1. **Surface 0 (Canvas)**: `#0B0D11` base in dark mode (`#F8FAFC` in light mode).
2. **Surface 1 (Primary Container)**: `#14171F` bounded by a `1px` solid outline of `#222836` (`#FFFFFF` with `#E2E8F0` border in light mode).
3. **Surface 2 (Elevated & Active States)**: `#1B202A` (`#F1F5F9` in light mode).
4. **Docked Overlays & Floating Navigation**: Translucent obsidian glass backdrop (`rgba(16, 19, 26, 0.85)` with 24px blur), crowned by a hairline `1px` border of `#222836`.
5. **Cyan Glow**: Reserved strictly for high-priority or live statuses—a diffused glow of `rgba(0, 240, 255, 0.25)` or `#38BDF8` applied to indicator dots or critical action triggers.

## Shapes

Shapes reflect precision-milled hardware. Primary cards and interaction modules use sleek `rounded-2xl` corners (`1rem` / `16px`), creating an ergonomic, soft-edged container for dense technical data. 

Micro-controls—such as segmented filter tabs, priority pills, and status tags—use complete capsule geometry (`rounded-full`) to clearly differentiate interactive triggers from static containing cards.

## Components

### Buttons & Segmented Filters
- **Primary Button**: Solid `#00F0FF` fill with stark `#0D0E11` text, bold weight, `rounded-xl` (`12px`) shape, with an optional gentle cyan glow on hover.
- **Ghost/Tertiary Action**: Transparent fill with a `1px` stroke of `#252836`, shifting to `#2E3245` with `#FFFFFF` text on press.
- **Segmented Filter Pills**: Compact, fully rounded horizontal track (`#171922`). The active pill switches to `#1B1E28` with an inset `1px` stroke of `#2E3245` and pure white text; inactive items sit at `#8E95A5`.

### Checkboxes
- **Base State**: 20x20px box, `rounded-md` (`6px`), with an empty interior and a `1.5px` border in `#2E3245`.
- **Selected State**: Border transitions to `#00F0FF`, accompanied by a solid `#00F0FF` fill and an obsidian `#0D0E11` micro-checkmark icon, confirming completion with high contrast.

### Progress Bars
- Continuous track height of `4px` or `6px` in `#252836` with pill-rounded termini.
- Fill is solid `#00F0FF`. Critical thresholds or milestones may utilize a subtle linear gradient fading into `#00E5FF` at the leading edge.

### Badges, Tags & Chips
- **Time Tags**: JetBrains Mono at `11px`, framed inside a subtle charcoal pill (`rgba(255, 255, 255, 0.04)` fill, `1px` `#252836` outline) with a muted slate label (`#8E95A5`).
- **Priority Indicators**: A 6px circular dot (High: `#FF4365`, Medium: `#FFB800`, Low: `#8E95A5`), paired with uppercase label-caps.

### Cards
- Constructed with `#171922`, wrapped in a crisp hairline stroke of `#252836`, and curved to `rounded-2xl` (`16px`).
- Internal hierarchy: Header row contains category tag and contextual action, mid-section houses primary metric display or task description in `#FFFFFF`, and the base holds the progress bar and timestamp tags.

### Docked Bottom Navigation Bar
- Floats detached with `margin: 1rem` above the bottom edge, curved to `rounded-3xl` (`24px`).
- Features a translucent obsidian glass backdrop (`#12141A` at 80% opacity, `blur(24px)`) bordered by a `1px` stroke of `#252836`.
- 5 equal slots: **Home**, **Tasks**, **Gym**, **Meals**, **Money**.
- Inactive items display 20px icons in `#8E95A5` with no label. Active item (e.g., **Tasks**) transitions to `#00F0FF`, supported by an ambient micro-dot directly underneath the icon to anchor user state without clutter.