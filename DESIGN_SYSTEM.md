# LUMINA. — Museum Design System Specification (AI Agent Blueprint)

> **Purpose:** This document is the single source of truth for AI coding agents building any new web app in the **Lumina / Stanza** aesthetic. Follow these tokens, typography rules, animations, and card archetypes directly—do **not** invent new color palettes, fonts, button styles, or generic card layouts.

---

## 1. Core Identity & Non-Negotiable Rules

### DO
- **Always load the Typography Triad** from Google Fonts:
  - `Syncopate` (400, 700) — uppercase kickers, brand wordmarks, buttons, indices (`letter-spacing: 0.16em–0.32em`)
  - `Cormorant Garamond` (400, 500, 600, italic) — editorial headings, card titles, italic epigraphs
  - `Inter` (300, 400, 500, 600) — body copy, descriptions, form inputs, metadata
- **Always use the Museum Paper / Gallery Noir tokens** (`lib/lumina-tokens.css`):
  - Light background: `#f5f2e9` (`--bg-paper`), Ink: `#1a1917` (`--ink-primary`), Accent: `#a67c52` (`--accent-warm`)
  - Dark background: `#131210` (`--bg-paper`), Ink: `#efeae0` (`--ink-primary`), Accent: `#c99e6e` (`--accent-warm`)
- **Always include tactile atmosphere** on full pages:
  - `<div class="paper-grain" aria-hidden="true"></div>`
  - `<div class="ambient-vignette" aria-hidden="true"></div>`
- **Always use `--ease-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`)** for motion and `--ease-accordion` (`cubic-bezier(0.19, 1, 0.22, 1)`) for expanding strips.
- **Keep radii crisp**: `3px` for cards/modals (`--radius-sharp`), `5px` for 3D slabs (`--radius-slab`), `999px` for pill controls and toasts (`--radius-pill`).

### DON'T
- **Never** use purple/violet gradients, neon glows, harsh pure `#000000` or `#ffffff` backgrounds, or generic Tailwind blue buttons.
- **Never** use pulsing status pills above headlines, heavy drop-shadows, or nested rounded bento boxes.
- **Never** use `linear` or default `ease` for hero reveals or panel transitions.

---

## 2. Drop-In Starter Template

Copy this exact `<head>` and `<body>` shell when starting any new Lumina-family site:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project. | Editorial Title</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&family=Syncopate:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./lib/lumina-tokens.css">
  <link rel="stylesheet" href="./lib/lumina-animations.css">
  <link rel="stylesheet" href="./lib/lumina-components.css">
</head>
<body>
  <!-- Tactile Surfaces -->
  <div class="paper-grain" aria-hidden="true"></div>
  <div class="ambient-vignette" aria-hidden="true"></div>
  <div class="lumina-scroll-progress" aria-hidden="true"></div>

  <!-- Dual-Ring Magnetic Cursor -->
  <div id="cursor-ring"><span id="cursor-label"></span></div>
  <div id="cursor-dot"></div>

  <!-- 4-Panel Split-Curtain Intro -->
  <div id="intro-overlay" class="lumina-curtain">
    <div class="curtain-panel"></div>
    <div class="curtain-panel"></div>
    <div class="curtain-panel"></div>
    <div class="curtain-panel"></div>
    <div class="curtain-content">
      <div class="reveal-mask"><h1 id="intro-text" class="reveal-up">PROJECT.</h1></div>
      <div class="reveal-rule"></div>
      <div class="reveal-mask"><p id="intro-subtext" class="reveal-up">Curated Subtitle</p></div>
      <div class="reveal-progress-track"><div class="reveal-progress-bar"></div></div>
    </div>
  </div>

  <!-- Your Content Here -->

  <script src="./lib/lumina-motion.js"></script>
  <script>
    LuminaDesign.initTheme();
    LuminaDesign.initCursor();
    LuminaDesign.initRadialAura();
    LuminaDesign.initScrollProgress();
    LuminaDesign.playCurtain({ title: 'PROJECT.', subtitle: 'Curated Subtitle' });
  </script>
</body>
</html>
```

---

## 3. Component & Card Selection Guide

Pick the exact component for the job—no design brainstorming required:

| Use Case | Component Class | File |
| :--- | :--- | :--- |
| Featured hero item / album / collection cover | `.folio-stage` + `.folio-book` (3D Isometric Etched Folio Slab) | `lib/lumina-components.css` |
| Multi-item visual showcase / gallery index | `.accordion-stage` + `.accordion-strip` | `lib/lumina-components.css` |
| Full-width editorial list / chapter index | `.volume-band-list` + `.volume-band` | `lib/lumina-components.css` |
| Action links / contact / colophon / file links | `.colophon-card` | `lib/lumina-components.css` |
| Shareable quote / social export card | `.share-card-frame[data-style="etched\|museum\|noir\|broadsheet\|keepsake"]` | `lib/lumina-components.css` |
| Primary pill control button | `.ctrl-btn` | `lib/lumina-components.css` |
| Sharp editorial CTA | `.lumina-cta` | `lib/lumina-components.css` |
| Page transition / intro loader | `.lumina-curtain` + `LuminaDesign.playCurtain()` | `lib/lumina-animations.css` |
| Custom cursor with contextual labels | `#cursor-ring` + `data-cursor-inspect="VIEW"` | `lib/lumina-animations.css` |
| Ephemeral feedback | `LuminaDesign.showToast("Copied")` | `lib/lumina-motion.js` |
| Tactile sound feedback | `LuminaDesign.playPaperRustle()` | `lib/lumina-motion.js` |

---

## 4. Machine-Readable Files in This Repository

- [`llms.txt`](./llms.txt) — Concise AI agent entrypoint
- [`tokens.json`](./tokens.json) — Structured design tokens (Light/Dark colors, fonts, motion curves, share card palettes)
- [`components.json`](./components.json) — Full HTML/CSS/JS snippet catalog for every card and animation
- [`lib/lumina-tokens.css`](./lib/lumina-tokens.css) — Drop-in CSS variables & tactile paper surfaces
- [`lib/lumina-animations.css`](./lib/lumina-animations.css) — Drop-in animations & cursor CSS
- [`lib/lumina-components.css`](./lib/lumina-components.css) — Drop-in cards, buttons, nav, modals, toasts
- [`lib/lumina-motion.js`](./lib/lumina-motion.js) — Zero-dependency JS controller (`window.LuminaDesign`)
