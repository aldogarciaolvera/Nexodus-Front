---
name: global-rules
description: Reglas críticas del sistema, restricciones y directrices de comportamiento que el agente debe seguir SIEMPRE en cualquier interacción de este proyecto.
---
# SuperMegaUltra important
* At the end of everything you do, tell me: "Terminado, Patron."

# Nexodus - AI Agent Instructions

## 1. Context & Clean Architecture
* Use React Native / Expo with `pnpm`.
* Strictly follow Clean Architecture / Feature-Sliced Design.
* `src/assets/`: Static resources.
* `src/components/`: Reusable UI components.
* `src/features/`: Modules grouped by functionality (todo, workout, diet, finance).
* `src/hooks/`: Custom hooks.
* `src/services/`: External API integrations.
* `src/store/`: Global state management.
* `src/utils/`: General utilities.
* Always follow the architecture laid out in `ARCHITECTURE.md`. Do not change anything from it. If any referenced folders do not exist, create them.

## 2. Brand & Visual Identity (Obsidian Cyan)
* Theme: Technical minimalism and stealth luxury (Strict Dark Mode).
* Primary Accent: `#00F0FF` (Electric vivid cyan) for active states.
* Neutral Canvas: `#0D0E11` (Pure base).
* Surfaces: `#171922` for standard cards, `#1B1E28` for elevated overlays.
* Typography: Use `Geist` for headlines/body and `JetBrains Mono` for metrics, numerals, and tags.
* Elevation: Rely strictly on tonal layering and `1px` structural borders (`#252836`); never use drop shadows.
* Always utilize the design specified in `DESIGN.md` for the app's design.

## 3. UI Components & Geometry
* Layout: 4-column single-stack mobile layout with `20px` (1.25rem) margins.
* Cards: Use `rounded-2xl` (16px) geometry.
* Badges & Pills: Use `rounded-full` capsule geometry.
* Bottom Navigation: Floating detached, 24px border radius, translucent glass backdrop (`#12141A` at 80% opacity, 24px blur).
* Progress Bars: Solid `#00F0FF` fill, `4px` or `6px` track height.

## 4. Coding Standards
* Do not mix domains across the `src/features/` folders.
* Build isolated components in `src/components/` before composing screens.
* Ensure all quantitative readouts use monospace typography to prevent tabular shifts.
* Use functional components, modern Hooks, and avoid deprecated React Native APIs.

## 5. README.md
* Always read the `README.md` and add the latest changes or update the information if it has changed.

## 6. Skills
* Always utilize the installed skills whenever possible.

## 7. Expo HAS CHANGED
* Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.