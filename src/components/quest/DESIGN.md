---
name: Signalis quest inspection and promise
description: Scoped visual rules for the implemented item inspector and PromisePage ending.
colors:
  inspection-surface: "#050505"
  inspection-ink: "#dedacf"
  inspection-muted: "#a5a299"
  bone-panel: "#d5d4c9"
  panel-ink: "#0a0a0a"
  panel-border: "#64645d"
  clue: "#f0c382"
  promise-surface: "#030303"
  promise-ink: "#e8e3d9"
  promise-red: "#e33c49"
typography:
  display:
    fontFamily: "Rajdhani, Arial Narrow, sans-serif"
    fontSize: "clamp(54px, 6.2vw, 94px)"
    fontWeight: 700
    lineHeight: 0.87
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(18px, 2vw, 25px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Courier New, Courier, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.9
    letterSpacing: "normal"
rounded:
  square: "0px"
spacing:
  compact: "12px"
  mobile-content: "20px"
  frame: "24px"
  content: "28px"
components:
  flip-button:
    backgroundColor: "#0b0b0b"
    textColor: "#dfdccf"
    rounded: "{rounded.square}"
    padding: "10px 16px"
  flip-button-hover:
    backgroundColor: "{colors.bone-panel}"
    textColor: "{colors.panel-ink}"
  item-title:
    backgroundColor: "{colors.bone-panel}"
    textColor: "#080808"
    typography: "{typography.title}"
    padding: "14px 28px"
---

# Design System: Signalis quest inspection and promise

## Overview

**Creative North Star: "Tangible objects, then the red gate"**

This guide applies only to `QuestItemArtwork`, `ItemInspectModal`, and `src/pages/PromisePage`, including their local styles and ambience. It is not the visual system for the rest of BaroLab, the terminal, or other quest overlays. The user-supplied Signalis imagery determines the objects and gate; the interface uses spare black system panels, bone-white bands, and restrained red emphasis.

The final implementation is the maintenance reference. Asset provenance and the original direction contract live in [SIGNALIS_DESIGN.md](../../../docs/SIGNALIS_DESIGN.md); keep generation provenance there. No product positioning is implied by this scoped guide.

**Key Characteristics:**

- Recognisable pixelated objects on a black inspection stage.
- Square system frames, monospaced reading text, and condensed uppercase titles.
- Physical rotation initiated by a button; a gate scene with readable text and one exit action.

## Colors

### Primary

Promise red accents the final title and belongs with the supplied carmine gate image. Inspection clues use the warm clue color so the reverse-side reading stands apart from ordinary description text.

### Neutral

Inspection ink and muted ink sit on the inspection surface. Bone panels carry dark headings and the LSTR identifier. Thin neutral borders separate regions. The ending uses its own darker surface and warmer title ink; preserve these local assignments rather than replacing global tokens.

## Typography

The frontmatter records the desktop title and body roles. Monospaced text handles descriptions, small technical labels, buttons, and status strips. Sans-serif uppercase type handles the item name, LSTR mark, and ending headline. Quest narration and controls use English; retain German system fragments and the original lettering inside artwork.

On narrow screens, the promise title uses `clamp(58px, 13vw, 86px)` and the ending narrative steps down to (13px). Inspection descriptions retain their body size. Small metadata must remain secondary; clues also appear in readable text outside the artwork.

## Layout

The inspector is a centered, internally scrollable dialog, capped at (1120px), with viewport padding (24px). Desktop content divides (55% / 45%): object stage left, reading and three inventory slots right. Keep generous black space around the complete object silhouette.

At (760px) and below, the inspector stacks stage above reading content; outer padding becomes (12px). The mobile stage has a bounded height (300px), with smaller book and radio artwork. Preserve access to the flip button, description, reverse clues, collection, and close control through vertical scrolling.

The ending uses the same desktop proportion: gate image left, text right. A directional shade keeps the right reading region dark. On mobile, the gate occupies the upper scene and fades vertically into the text. The ending scrolls on narrow or short screens; never make its wake action depend on a fixed viewport height.

## Elevation & Depth

Panels are flat, with thin borders and tonal separation. Depth belongs to the objects: perspective, hidden reverse faces, and a physical book spine with a shaded rear cover. The active inventory slot uses an inset outline. The ending's gradients protect text contrast; subtle static scanlines sit above the scene without intercepting input.

## Shapes

Use square corners for the scoped controls and panels. Preserve each object's silhouette and pixelated rendering: landscape pass, tall black book, wide analogue receiver. The receiver sprite sheet has two equal cells, selected as distinct front and rear faces. Do not crop or redraw the supplied book illustration to imitate its spine.

The generated pass also uses a two-face atlas. Pass and radio textures and reverse markings are drawn once into fixed 192×123 and 224×224 canvas buffers, then enlarged without smoothing. Do not scale these buffers with device pixel ratio: their visible pixel grid is intentional. Keep the book's existing artwork and rendering unchanged.

## Components

- **Item artwork:** separate physical faces rotate on the Y axis. The book alone adds a spine. Thumbnails remain front-facing and hide reverse surfaces and spine. Artwork is decorative for assistive technology; descriptions and clues carry the readable meaning.
- **Flip button:** outlined, rectangular, at least (48px) high; bone fill on hover and a visible focus outline. It is the sole flip trigger. Its pressed state and label reflect the displayed face. Selecting another item starts on its front.
- **Inventory strip:** three equal slots; an inset outline identifies the selected item. Uncollected slots are disabled and show their unavailable state. Preserve native button semantics and keyboard focus visibility.
- **Dialog:** focus starts on close, stays among enabled controls, and returns when dismissed. Escape, close, and backdrop dismissal remain available. Reverse descriptions are announced politely; do not make clues available only as tiny raster text.
- **Promise sequence:** brief boot output leads to a single interruption and then the gate. The final title receives focus. Reduced motion skips straight to the final scene and removes transitions. Do not add a persistent flashing or glitch loop.
- **Sound control:** explicit opt-in with a pressed state. The local synthesized ambience suspends when toggled off, closes on unmount, and exposes an unavailable state if audio cannot start. No autoplay.
- **Wake action:** a full-width ruled row with red arrow, English action, and small German translation. Activation disables repeated input, fades out, resets the existing local quest, and returns home. Reduced motion removes the exit delay.

## Do's and Don'ts

### Do:

- **Do** keep this visual system scoped to item inspection and the promise ending.
- **Do** preserve the supplied asset appearance and provenance.
- **Do** keep reverse clues readable in text and preserve the chain: radio → sector 404 → pass → home BUILD archive → book → protocol 512 / frequency 240.0. The opening broadcast numbers in the radio description are separate from its destination label.
- **Do** retain keyboard access, visible control focus, reduced motion, and vertical scrolling.

### Don't:

- **Don't** add pointer-driven rotation or flipping.
- **Don't** replace the object imagery with generic cards, icons, or unrelated illustrations.
- **Don't** add continuous flashing, automatic audio, or site navigation over the ending.
- **Don't** apply these local colors, frames, or typography to the rest of the frontend.
