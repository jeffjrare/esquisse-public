---
name: visual-craft
description: The look of a screen: typography, colour, surfaces, layout and iconography, and the generic defaults that make an interface read as machine-made. Use before rendering a UI direction, choosing a font pairing, a palette or an accent, styling cards, panels or a page layout, picking an icon set, or judging whether a redesign has any character.
---

# Visual craft: a look someone chose

**As of:** 2026-11-22

**Paths:** `styles/`, `*.css`, `globals.css`, `tailwind.config.*`, `theme.*`, `components/`, `layouts/`, `pages/`, `screens/`, `views/`

**Stack:** `tailwindcss`, `@radix-ui/*`, `@mui/material`, `@chakra-ui/react`, `@mantine/core`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a browser-support or reference-product fact, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree. Where tokens live and how they are named belongs to `esq:design-system`; which colour pairs must hold, and the focus indicator, to `esq:accessibility`. This module says what a look is made of and what makes one generic; those two say how it is kept and how it stays usable.

A look is a set of decisions a person would recognise from one screen to the next. An interface that takes every default is consistent and forgettable. Each rule below names the move, why it pays, and how to see it on the rendered screen.

## Typography

- **Pair two faces with a job each, or one family used with intent.** A display face for headings and a text face for reading, differing in structure (a grotesque with a serif, a humanist with a mono for data), never two near-identical sans. *Why:* contrast between faces is what makes hierarchy legible before size does any work. *Check:* cover the headings; if the body could be the heading face, the pairing adds nothing.
- **One modular scale, ratio chosen for the density.** About 1.2 for a dense tool, 1.25–1.333 for an app, 1.5 or more for an editorial or marketing page, with `clamp()` between a phone and a desktop step. *Why:* sizes picked one by one drift into eight near-equal steps. *Check:* list the distinct font sizes on the screen; more than six is drift.
- **Hierarchy by weight and colour before size.** A heading one step larger and two weights heavier reads more clearly than one three steps larger. Secondary text takes a quieter ink, not a smaller size below 14 px. *Check:* the screen's primary heading is identifiable in a greyscale, blurred capture.
- **Variable fonts carry the weight axis, self-hosted.** One file covers every weight, and intermediate weights (450, 550) tune hierarchy on screen. `font-variation-settings` is Baseline widely available since 2021-03 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/font-variation-settings), checked 2026-11-22); prefer `font-weight` over the raw axis where it is enough. Self-hosting is `esq:design-system`'s rule under a strict CSP.
- **Measure 45–75 characters, leading by size.** Body 1.5–1.6, headings 1.1–1.25, tight tracking on large display text and none on body. `text-wrap: balance` on headings is Baseline since 2024-05 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/text-wrap-balance), checked 2026-11-22); `pretty` on body is progressive enhancement, not yet in every engine ([MDN](https://developer.mozilla.org/docs/Web/CSS/text-wrap-style), checked 2026-11-22). *Check:* a paragraph at desktop width runs under ~75 characters per line.

## Colour

- **Build ramps in `oklch`, so equal steps look equal.** Lightness in `oklch` is perceptual: a ramp stepping L evenly reads evenly, and one hue changed keeps its lightness. `oklch()` is Baseline widely available since 2023-05 ([MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/oklch), checked 2026-11-22); relative colour syntax (`oklch(from var(--accent) calc(l - .1) c h)`) is Baseline newly available since 2024-09 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/relative-color), checked 2026-11-22), so give it a static fallback where older browsers matter.
- **Neutrals are tinted toward the brand hue, not pure grey.** A chroma of about 0.005–0.02 in the accent's hue makes the greys belong to the product. *Why:* pure `#f5f5f5` greys are what every default ships. *Check:* sample the background; a chroma of exactly zero is the default talking.
- **One accent, spent where the eye should go.** The accent marks the main action, the current place and the one moment of reward; everything else is neutral plus semantic colours (success, warning, danger). *Why:* an accent used on ten elements points nowhere. *Check:* count accent-coloured elements on a screen; more than about three competes.
- **The dark theme is designed, not inverted.** Raise surfaces by lightening them (elevation reads as lighter in the dark), lower chroma on large fills, avoid pure black grounds and pure white text, and re-pick the accent for its new ground. Contrast in both themes is `esq:accessibility`'s rule. *Check:* the dark capture has at least two distinguishable surface levels.

## Surfaces and depth

- **Pick one way to separate, and use it everywhere.** Either hairline borders on flat surfaces, or tonal steps between surfaces, or shadows for raised layers only (menus, dialogs). Mixing all three on one card is the default. *Why:* depth is information: what floats is temporary, what is flat is the page. *Check:* name what each shadow on the screen means; one you cannot name is decoration.
- **Surfaces differ by a visible step.** Two adjacent surfaces within about 1.1:1 of each other read as one. A tonal step of roughly 3–5 L in `oklch` reads as a layer without a line.
- **Texture is a signature, used once.** Grain, a subtle noise, a duotone image treatment or a pattern in one region (the hero, an empty state) gives a screen a material; on every panel it is noise. Keep it under the reduced-data and contrast rules.

## Layout

- **Density is a choice stated in the direction.** A tool people use all day earns compact rows (32–36 px) and visible structure; a consumer screen earns air and larger targets. *Why:* the default is a middle density that suits no one. Touch target floors are `esq:accessibility`'s.
- **One spacing scale on a 4 px or 8 px base, and one grid.** Columns and gutters declared, content aligned to them; a deliberate break (a full-bleed image, an offset heading) is visible because the rest holds. *Check:* the left edges on the screen align to a handful of lines, not a dozen.
- **Vertical rhythm groups before it separates.** Space inside a group is smaller than space between groups, at least 1.5–2×. *Check:* squint; the groups the content has are the groups the eye sees.

## Iconography and imagery

- **One icon family, one stroke, one size grid.** Lucide, Phosphor, Heroicons, Material Symbols: pick one and its stroke width, size icons on the type scale, never mix outline and filled except to mark selected. *Check:* every icon on the screen comes from the same set.
- **Illustration pays where the screen is otherwise empty or emotional.** Empty states, onboarding, a success moment. In a dense working view it competes with the data. A product photograph or real content beats a stock illustration.

## The generic defaults

A direction may use one of these with intent; one resting on several at once reads as nobody chose it. The list is the shared vocabulary of 2025–2026 design writing, not a measured standard ([925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [uxdesign.cc](https://uxdesign.cc/ai-design-isnt-ugly-it-s-fluent-and-thats-the-problem-131b2f4eb78c), checked 2026-11-22).

- **Inter (or the system sans) for everything** → a pairing with a job for each face, or a characterful text face (a humanist sans, a grotesque with real contrast, a serif for reading).
- **The purple-to-blue gradient** on the hero or the main button → a flat accent picked for this product, its hue tied to the brand or the domain, with gradient only as a subtle surface tint if at all.
- **Soft-shadow rounded cards everywhere**, one radius on every corner → the single separation method above, radius scaled to the element (small on inputs, larger on sheets), cards only where content is a card.
- **Emoji as icons** → one icon family, with illustration where a moment deserves it.
- **The centred hero plus three feature cards** → a composition led by the product itself: the real screen, a left-aligned headline with a working example, an asymmetric grid.
- **Grey-on-white with one blue link colour** → tinted neutrals and an accent spent on the main action.

*Check:* before a direction is shown, name which of these it uses and why; the brief lists the moves it took from this module.

## Reference products, by class

Look at what these do, never copy them. Each was checked on the date given; re-check before quoting a detail.

- **Tool / dashboard:** Linear, its 2024 UI redesign and the later refresh of quieter borders and header consistency ([Linear](https://linear.app/now/behind-the-latest-design-refresh), checked 2026-11-22) — density, restraint, a near-monochrome palette with one accent.
- **Consumer mobile:** CapWords, the 2025 Apple Design Award winner for Delight and Fun, and Mela, a 2025 Interaction finalist ([Apple](https://www.apple.com/newsroom/2025/06/apple-unveils-winners-and-finalists-of-the-2025-apple-design-awards/), checked 2026-11-22) — illustration and playful feedback around one main action; calm, content-first lists.
- **Content / reading:** iA Writer, a 2025 Apple Design Award Interaction finalist (same source) — typography as the whole interface.
- **Marketing site:** Readymag's "best websites of 2025" ([Readymag](https://blog.readymag.com/websites-of-the-year-2025/), checked 2026-11-22) — a pool of editorial compositions; pick one from the product's own industry rather than the most decorated.
