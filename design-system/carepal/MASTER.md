# Design System Master File — TheCarePal FS-03

> **Source of Truth:** Governed by `ui-ux-pro-max-skill` and PRD FS-03 (Family Care Dashboard & Daily Care History).
> All pages must strictly conform to these tokens, contrast ratios, and typography specifications.

---

**Project:** TheCarePal (FS-03)  
**Date:** 2026-11-17  
**Category:** Senior Care / Family & Nurse Companion  

---

## 1. Palette & Contrast Architecture

| Token Name | Hex Code | Role & Usage | Contrast Ratio |
|---|---|---|---|
| **Porcelain** | `#F1F3F2` | Page background, day sheet, text on dark stone | Base canvas |
| **Stone Light** | `#D9D3CA` | Hairlines, week-strip days, quiet surfaces | Structural borders |
| **Warm Stone** | `#A89E91` | Icons, chart gridlines, neutral badges | Secondary marks |
| **Dark Stone** | `#3A342D` | Body text, rules, masthead band, scrim | 11:1 on Porcelain |
| **Aqua Blue** | `#46B3C6` | Chart lines, markers, activity bars, selected day | Marks & fills only (NEVER text) |
| **Deep Aqua** | `#17707F` | Buttons, links, focus ring, prominent text | 5:1 on Porcelain |
| **Aqua Tint** | `#D3ECF0` | Normal-range band on charts & vital rulers | Background fills |
| **Correction Red** | `#B3261E` | Out-of-range readings and missed doses | 5.8:1 on Porcelain |

> [!IMPORTANT]
> **Aqua Blue (`#46B3C6`)** must NEVER be used for text on light backgrounds because its contrast ratio on porcelain is only ~2.2:1. Deep Aqua (`#17707F`) is the only aqua permitted for readable text, buttons, and links.

---

## 2. Typography

- **Headlines & Day Masthead:** `Libre Caslon Condensed` / `Libre Caslon Text` (tight letter-spacing `-0.01em`, line height `0.95`–`1.0`). Never used for numbers or long body copy.
- **Body, Inputs, Numbers, UI:** `Atkinson Hyperlegible` (designed by the Braille Institute for low vision, WCAG AAA friendly). Numbers use `font-variant-numeric: tabular-nums`.
- **Devanagari Fallback:** `Noto Sans Devanagari`
- **Scale:** 14px, 16px (base body), 18px (subheaders/summary), 24px (card headings), 36px (mobile day title), 64px (desktop hero).
- **Style Rules:** Sentence case everywhere. No all-caps labels. No tracked-out letter-spacing on buttons.

---

## 3. Strict Anti-Patterns (Forbidden)

1. ❌ **No emojis as icons** (always use SVG icons via Lucide).
2. ❌ **No aqua gradients, glows, or glassmorphism** (aqua must be completely flat).
3. ❌ **No cream/beige with terracotta or near-black with neon**.
4. ❌ **No hero with big numbers, small labels, and background gradients**.
5. ❌ **No rows of identical rounded cards with identical floating drop shadows**.
6. ❌ **No scroll-triggered fade animations** (motion only in response to user tap or first-open flag focus).
7. ❌ **No color-only status indicators** (every out-of-range vital or missed dose must include an explicit shape/symbol and text label like "high", "low", or "missed").

---

## 4. Interaction & Touch Targets

- Minimum touch target: **44×44px** on all interactive elements (buttons, meal portion selectors, date pills, checkboxes).
- Visible keyboard focus ring: 2px solid `#17707F` with 2px offset.
- Independent saves with instant visual feedback (Saved checkmark or Error retry).
- Offline-first resilience: failed network requests do not discard form inputs.
