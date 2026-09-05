# Signalis quest visual direction

Scope: the local browser quest, item inspection and `/promise`. The rest of BaroLab keeps its existing design. The user supplied six image references and explicitly requested close visual fidelity, revised item descriptions and button-only flipping.

Quest UI and narrative copy use English, retaining German system phrases and the lettering within the artwork. `QuestOnboarding` shares the inspector's black/bone frame, LSTR header and square controls; its `ACHTUNG` notice offers `DISMISS` or `TRACE SIGNAL`. It describes an unidentified transmission without exposing pagination implementation details. Copy uses semantic paragraphs rather than escaped line breaks.

## Direction contract

THESIS: inspect tangible, recognisable Signalis objects, then enter the red gate scene.

OWN-WORLD: black, bone-white system panels, orange-grey identity card, yellow/red figure on a black book, dark analogue receiver; carmine gates and restrained typography.

STORY: collect three objects; inspect their reverse for clues; synchronise; remember the promise and wake.

FIRST VIEWPORT: desktop inspection puts a large object left and description right. The ending puts the user's gate image left, the promise right. Mobile stacks image and reading content.

FORM: the user's precise references govern the composition; button-triggered physical rotation is the signature interaction. No pointer-driven flips.

FINISH: verify desktop/mobile, keyboard, reduced motion, clue access, wake/reset and raster provenance.

## Behaviour and implementation

- `questItems.js` owns names, descriptions and the unchanged clue chain: sector 404, footer build version, protocol 512 / frequency 240.0.
- `QuestItemArtwork.jsx` uses separate physical faces. The book spine is a CSS surface; the user-supplied cover illustration is retained intact.
- The pass and radio render through fixed low-resolution canvas buffers (192×123 and 224×224), enlarged with nearest-neighbour CSS sampling, including their reverse clue markings. The generated pass atlas has presentation margins cropped at render time. The book and gate are deliberately excluded from this pixel rendering pass at the user's request.
- `ItemInspectModal.jsx` changes face only through its flip button; selecting another item starts on the front. Only collected items can be selected. Escape closes and keyboard focus stays in the dialog.
- `/promise` closes the global terminal on entry and omits the site's navigation and global dialogs so keyboard focus cannot escape behind the ending. Brief boot output leads to an interruption and the gate. Reduced motion skips the interruption. Wake fades out, resets the existing browser-local quest and returns home.
- Ambience is synthesized locally and starts only from the sound button. It closes on page unmount. No backend requests or new storage keys are introduced.
- The responsive ending remains vertically scrollable on short and narrow screens. CRT lines are a static subtle overlay; no persistent glitch or flashing loop.

## Asset provenance

The images were provided by the user as Signalis reference artwork; they are not claimed as original BaroLab art. Source copies remain outside the repository. The book and gate preserve the supplied pixels; the pass and radio are generated from references with their prompts embedded in the PNG metadata.

| Asset in `public/quest/` | Source |
|---|---|
| `king-in-yellow.png` | User image 1, `codex-clipboard-557c9139-03da-4109-881b-3f87e4ffdd3f.png`; image 2 informed physical book thickness |
| `red-gate.png` | User image 4, `codex-clipboard-7c3b2d8e-36a9-4203-bac9-411f280665fb.png`; user identified the source as [The Red Gate Redraw on Reddit](https://www.reddit.com/r/signalis/comments/1je1oyr/the_red_gate_redraw/). The ending visibly links to this original artist's post. |
| `adler-pass-sides.png` | Built-in ImageGen using user images 5 and 6 (`codex-clipboard-8285ff38-d1b4-4f87-a287-0bd98f5b2f66.png`, `codex-clipboard-93d2e461-61df-42e0-b7f8-ff026554fe44.png`) as face references and `radio-sides.png` as material/style reference |
| `radio-sides.png` | Built-in ImageGen edit using user image 3, `codex-clipboard-2365296f-c2af-4f84-a8c7-2e8edf2f6adb.png`; front reference, generated matching rear |

Pass generation prompt (built-in ImageGen), also embedded in the PNG:

> Create a game inventory texture atlas for the ADLR identity pass, using image 1 as exact FRONT design reference and image 2 as exact BACK design reference. Image 3 (radio) is ONLY material/rendering style reference: match its restrained, worn, matte PS1/Signalis game-object treatment, not its hardware. Output a wide 3.12:1 image, TWO equal rectangular cells touching at exact center. Each cell is a face of the same card, aspect 1.56:1, fills its entire cell edge to edge, straight-on orthographic texture, NO perspective, NO background, NO padding, NO shadow beyond edges. LEFT is front: orange-brown blocks, off-white grey card, black-haired pale male portrait in left third, ADLR-S2301 / VERWALTUNG lettering at top right, grey administration typography, small emblem and barcodes in exact reference positions, FKOM bottom right. RIGHT is back: light grey/orange-brown blocks, horizontal broad black magnetic stripe across upper middle, little barcodes and industrial emblem as reference. Preserve layouts, portrait identity, colors, recognizable lettering and proportions closely. Redraw as matching original low-resolution survival horror game item textures, subtle fine wear and flat baked shading, muted tones, crisp pixel clusters, limited palette, no photorealism or painterly blur, no new branding or decorative motifs. Leave lower-left grey area on BACK mostly empty for a game clue rendered later. Do not add SEKTOR 404 or any quest clue. The image must split into front/back at exactly 50% width.

Radio generation prompt, also embedded in the PNG:

> Use the attached radio image as the EXACT appearance reference for a game inventory asset. Output one 2:1 wide sprite sheet with TWO equal square cells on a perfectly flat pure BLACK (#000000) background. LEFT cell: faithfully preserve the reference radio receiver front with its wide stacked black hi-fi equipment shape, many small keys and knobs, orange LCD, cassette deck above, original labels. Do not redesign the hardware. Remove ALL white background. RIGHT cell: matching plausible rear face of the SAME wide black radio receiver at the SAME size, connectors, power cable socket, black metal vents, four screws, and an aged rectangular identification label, nothing futuristic. Both fully contained, centered within their respective cell, each occupies approximately 80% width and 58% height of its square cell. Orthographic, almost straight-on, same angle and outer silhouette, no rotations. Preserve the deliberately LOW RESOLUTION PS1 / SIGNALIS chunky game-texture appearance of the reference, muted olive-black plastic, restrained gray highlights, amber display, NOT photorealistic, NOT glossy, do not add dramatic distress or neon. No text or labels outside the objects, no white edges, no watermark. Front and back should sit precisely in their own half so the left and right 50% can be used as two distinct frames in CSS.
