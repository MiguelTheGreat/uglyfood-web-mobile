# UglyFood AI — Archival Harvest Marketplace & Computer Vision Grader

**Live GitHub Pages App:** [https://miguelthegreat.github.io/uglyfood-web-mobile/](https://miguelthegreat.github.io/uglyfood-web-mobile/)

An interactive, responsive Web & Mobile experience for **UglyFood AI**—an AI-powered agricultural marketplace connecting Philippine smallholder farmers directly with cost-conscious individuals (**B2C**) and commercial commissaries (**B2B**) to rescue imperfect ("ugly") yet 100% lab-verified safe produce at **45%–52% below traditional retail rates**.

---

## 1. Design Language Architecture

This project merges two disciplined design systems:

1. **[Lumina Museum Design System](https://github.com/MiguelTheGreat/lumina-design-system) (Content Layer & Motion Engine)**
   - **Palettes:** *Museum Paper* (`#f5f2e9` light theme) and *Gallery Noir* (`#131210` dark theme) with warm metallic bronze accents (`#a67c52` / `#c99e6e`), SVG tactile `.paper-grain`, and `.ambient-vignette`.
   - **Typography Triad:** `Syncopate` (uppercase tracked kickers, badges, controls), `Cormorant Garamond` (editorial headings & italic epigraphs), and `Inter` (clean UI & telemetry).
   - **Signature Card Archetypes:**
     - **01 · 3D Isometric Etched Folio Slab (`.folio-stage`)** — Featured in the Hero Harvest Ledger.
     - **02 · Accordion Exhibition Strips (`.accordion-stage`)** — Interactive UN Sustainable Development Goals (SDGs 1, 2, 10, 12) exhibition.
     - **03 · Horizontal Volume Index Bands (`.volume-band-list`)** — Partner Smallholder Farm Collectives directory with radial mouse-tracking aura.
     - **04 · Colophon Cards (`.colophon-card`)** — Interactive AI Visual Grading Rubric filters.
     - **05 · 5 Editorial Share Card Archetypes (`.share-card-frame`)** — Switchable `etched`, `museum`, `noir`, `broadsheet`, and `keepsake` personal impact certificate.
   - **Motion Primitives:** 4-Panel Split-Curtain Intro, Dual-Ring Magnetic Cursor with contextual inspect labels, and Web Audio API synthesized paper rustle feedback.

2. **Apple HIG Liquid Glass (`css/liquid-glass.css` — Functional Chrome Layer Only)**
   - **Strict Layer Separation:** Content cards in the Marketplace, Farmer Atelier, and Impact Ledger remain opaque *Museum Paper / Gallery Noir* surfaces; refractive Liquid Glass is reserved exclusively for floating chrome.
   - **Floating Navigation & Role Switcher Capsules:** Detached `.liquid-glass` pills with progressive SVG optical edge refraction (`#liquid-glass-refract`), specular top/bottom rims, and separated icon-only utility groups.
   - **Clear Liquid Glass (`liquid-glass--clear`) + Mandatory 35% Dimming Layer:** Applied over full-bleed botanical photography inside the AI Computer Vision Scanner HUD and Hero specimen preview.
   - **Concentric Inset Sheets (`28px` outer radius, `12px` padding, `16px` inner radius):** Powering the Product Detail AI Trust Report Sheet and Slide-Over Harvest Cart Drawer.
   - **Transient Content-Layer Exception:** The Max Price Ceiling range slider and Farmer Inventory availability switches transform their interactive thumb/knob into refractive Liquid Glass *only while actively dragged or pressed*.
   - **Auto-Minimizing Mobile Tab Bar:** Floating bottom dock that minimizes on scroll down and re-expands on scroll up, with a visually separated semantic Search orb at the trailing end.
   - **Full Accessibility Support:** Implements `prefers-reduced-transparency`, `prefers-contrast: more`, and `prefers-reduced-motion`.

---

## 2. Core Functional Features

- **Persistent Role Switcher (Demo Mode):** Switch seamlessly between **Individual Buyer (B2C 1 kg retail packs)**, **Commercial Buyer (B2B 25 kg wholesale crates)**, and **Local Farmer (Supplier)** without authentication.
- **Mobile Viewport Simulator Toggle:** Click the smartphone icon in the top-right floating utility pill to preview the 430px mobile frame and floating iOS Liquid Glass bottom dock directly on desktop.
- **AI Produce Scanner & Computer Vision Grader:**
  - Test 4 one-click sample imperfect crop presets (*Twisted Carrots*, *Spotted Mangoes*, *Oversized Ribbed Tomatoes*, *Curved Eggplants*) or drag-and-drop any custom image file.
  - Simulates laser scanning, bounding-box defect & safety overlays, NIR spectrometer telemetry, and **One-Click Publish to Live Marketplace** (persisted via `localStorage`).
- **Farmer Supplier Atelier:** Live KPIs, active harvest inventory management (stock boosts, live availability toggles, deletion), and incoming B2C/B2B orders table.
- **UN SDG Sustainability Dashboard & Cart Checkout:** Interactive mock checkout updates both personal impact metrics and the Farmer Atelier incoming order feed in real time.
