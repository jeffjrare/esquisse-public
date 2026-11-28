---
name: visual-craft
description: The look of a screen: ambition by its mode, typography, colour, surfaces, layout, browser parts and iconography, territories drawn from the product's domain, references found outside software, and the generic defaults that make an interface read as machine-made. Use before rendering a UI direction, choosing a font pairing, a palette or an accent, styling cards, panels or a page layout, picking an icon set, or judging whether a redesign has any character.
---

# Visual craft: a look someone chose

**As of:** 2026-11-27

**Paths:** `styles/`, `*.css`, `globals.css`, `tailwind.config.*`, `theme.*`, `components/`, `layouts/`, `pages/`, `screens/`, `views/`

**Stack:** `tailwindcss`, `@radix-ui/*`, `@mui/material`, `@chakra-ui/react`, `@mantine/core`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a browser-support or reference-product fact, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree. Where tokens live and how they are named belongs to `esq:design-system`; which colour pairs must hold, and the focus indicator, to `esq:accessibility`. This module says what a look is made of and what makes one generic; those two say how it is kept and how it stays usable.

A look is a set of decisions a person would recognise from one screen to the next. An interface that takes every default is consistent and forgettable. Each rule below names the move, why it pays, and how to see it on the rendered screen.

## Ambition follows what the screen is for

Name the surface's mode before choosing anything, from the screen, never from the product: a tool's landing page persuades, its settings screen operates ([impeccable](https://github.com/pbakaus/impeccable) `skill/SKILL.src.md` § Modes, checked 2026-11-27).

- **Operate** (app screens, dashboards, editors, settings): the person completes a task. Scanability, consistency and the patterns they already know outrank expression; character shows as precision in the details, and colour mostly encodes action, selection and status, its rarity giving the accent force. Motion serves feedback and continuity, never choreography the person waits through.
- **Persuade** (landing, pricing, campaigns): the visitor decides. Colour may own large regions, imagery is real, and one rehearsed motion sequence may carry the voice.
- **Read** (docs, articles, help): measure, rhythm and type do the work; ornament gets out of the way.

*Check:* the brief names the mode of each screen it renders, and a direction for an Operate screen spends its signature in one region, not on every control.

## Typography

- **Pair two faces with a job each, or one family used with intent.** A display face for headings and a text face for reading, differing in structure (a grotesque with a serif, a humanist with a mono for data), never two near-identical sans. *Why:* contrast between faces is what makes hierarchy legible before size does any work. *Check:* cover the headings; if the body could be the heading face, the pairing adds nothing.
- **One modular scale, ratio chosen for the density.** About 1.2 for a dense tool, 1.25–1.333 for an app, 1.5 or more for an editorial or marketing page, with `clamp()` between a phone and a desktop step. *Why:* sizes picked one by one drift into eight near-equal steps. *Check:* list the distinct font sizes on the screen; more than six is drift.
- **Hierarchy by weight and colour before size.** A heading one step larger and two weights heavier reads more clearly than one three steps larger. Secondary text takes a quieter ink, not a smaller size below 14 px. *Check:* the screen's primary heading is identifiable in a greyscale, blurred capture.
- **Variable fonts carry the weight axis, self-hosted.** One file covers every weight, and intermediate weights (450, 550) tune hierarchy on screen. `font-variation-settings` is Baseline widely available since 2021-03 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/font-variation-settings), checked 2026-11-22); prefer `font-weight` over the raw axis where it is enough. Self-hosting is `esq:design-system`'s rule under a strict CSP.
- **Fluid type stays zoomable.** In `clamp(min, fluid, max)` for a font size, use `rem` bounds and keep the maximum at most 2.5 × the minimum: viewport units do not grow with zoom, and past that ratio browser zoom cannot reach the 200% WCAG 1.4.4 asks ([Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) `guides/css/responsive-design.md`, checked 2026-11-27). Line heights are unitless.
- **Nothing that holds text has a fixed height.** Buttons, badges, tabs and cards take `min-block-size`, never `height`, so text survives the spacing overrides WCAG 1.4.12 requires (line height 1.5, letter spacing 0.12em) and a longer French label ([Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) `guides/visual-design/typography.md`, checked 2026-11-27). *Check:* grep the changed styles for `height:` on a text-bearing element.
- **Measure 45–75 characters, leading by size.** Body 1.5–1.6, headings 1.1–1.25, tight tracking on large display text and none on body. `text-wrap: balance` on headings is Baseline since 2024-05 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/text-wrap-balance), checked 2026-11-22); `pretty` on body is progressive enhancement, not yet in every engine ([MDN](https://developer.mozilla.org/docs/Web/CSS/text-wrap-style), checked 2026-11-22). Neither goes on `*` (each costs layout time), and `balance` never goes on text inside a visible box, whose width it does not change. *Check:* a paragraph at desktop width runs under ~75 characters per line.

## Colour

- **Build ramps in `oklch`, so equal steps look equal.** Lightness in `oklch` is perceptual: a ramp stepping L evenly reads evenly, and one hue changed keeps its lightness. `oklch()` is Baseline widely available since 2023-05 ([MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/oklch), checked 2026-11-22); relative colour syntax is Baseline newly available since 2024-09 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/relative-color), checked 2026-11-22), so give it a static fallback where older browsers matter.
- **Derive tints and shades with `color-mix(in oklab, …)`, never by setting lightness alone.** Browsers do not yet gamut-map, so `oklch(from var(--accent) 0.9 c h)` lands on an unpredictable colour; mix toward white or black instead, and nudge lightness by at most 30% on top if the mix washes out. Never mix a neutral `in oklch`: below a chroma of about 0.02 Chromium resolves the powerless hue to 0°, and greys turn pink (bug 565837690). `in oklch` is for gradients between two saturated hues ([Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) `guides/visual-design/color.md` and `visual-effects.md`, checked 2026-11-27). *Check:* grep for `in oklch` beside a neutral or a transparent stop.
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

## The parts nobody draws

The browser paints these with defaults that belong to no design; a direction that styles everything else and leaves them reads as unfinished ([impeccable](https://github.com/pbakaus/impeccable) `skill/reference/craft-floor.md`, checked 2026-11-27).

- **`color-scheme` on `:root`** (`light dark`, or the one theme there is), so native controls, scrollbars and the first paint follow the theme instead of flashing white; `light-dark()` pairs a token's two values in one declaration. Where tokens live is `esq:design-system`'s.
- **`accent-color`** on native checkboxes, radios, ranges and progress; **`::selection`** and **`caret-color`** in the palette; **`scrollbar-color`** and `scrollbar-width: thin` on scroll regions inside the page.
- **Links carry `text-underline-offset`** and a thickness chosen with the text face, not the browser's.
- **Numbers that are compared use `font-variant-numeric: tabular-nums`**, in one format per screen (never `$48,210` beside `$124,860.40`).

*Check:* select text, focus a field, scroll a panel and tick a checkbox in the capture; each shows the direction's colour.

## Iconography and imagery

- **One icon family, one stroke, one size grid.** Lucide, Phosphor, Heroicons, Material Symbols: pick one and its stroke width, size icons on the type scale, never mix outline and filled except to mark selected. *Check:* every icon on the screen comes from the same set.
- **Illustration pays where the screen is otherwise empty or emotional.** Empty states, onboarding, a success moment. In a dense working view it competes with the data. A product photograph or real content beats a stock illustration.

## Territories

A direction drawn from the module's lists alone is a better default, not a character. Character comes from the product's own world: a **territory** is a material world the product's people already live in, and a direction borrows its moves from one.

- **Extract the territory from the domain, never from software.** Read the spec, the mandate and the app's own content for the trade's documents (invoices, tickets, forms, logbooks), its tools and instruments, its materials, its places and their signage, its printed matter (catalogues, labels, manuals) and its vocabulary. Name 2–3 territories, each in one line with the material it rests on. *Why:* every product in a class shares the same reference apps; nobody else shares its trade's workbench. *Check:* each territory names a physical or printed thing a person in the trade handles, not a mood ("warm", "modern").
- **Translate it into moves, one per dimension.** Type from its printed matter (a stencil, a ledger's tabular figures, a label's condensed caps); a palette sampled from its materials, then built as an `oklch` ramp under the rules above; a texture from its surfaces; a shape language from its objects (a ticket's notch, a tag's punched hole, a form's ruled boxes); an iconography drawn from its tools; a motion metaphor from how its things move (a stamp, a slip, a fold). Name any dimension left unused on purpose. *Check:* every move in the direction's brief traces to the territory or to a rule above.
- **The pastiche guard: the territory informs, it never illustrates every surface.** One signature region carries it strongly (the hero, the header, an empty state, the reward moment); the rest takes the territory only through type, palette and rhythm. Skeuomorphic clip-art, wood grain on every panel and a costume of the trade on each control are the theme park, not the territory. The usability floor always wins: contrast, targets, focus and legible data are never traded for flavour. *Check:* remove the signature region; the screen still reads as one product, and still works.
- **The test is two readers.** Would someone from that trade recognise their world in it, and would someone outside it still read the screen at a glance? A yes to the first alone is pastiche; to the second alone, the default.

Three worked examples, from unrelated trades:

- **A bakery's ordering app.** Territories: the kraft bag and its stamped label; the chalkboard of the day's bakes; the flour-dusted proving tray. Moves: a slab serif from the stamp for headings, a palette sampled from kraft, crust and flour, a paper grain in the hero only, a stamp-press as the order's confirmation moment.
- **A freight dispatcher's tool.** Territories: the bill of lading; the yard's painted signage; the departure board. Moves: tabular mono figures and ruled rows from the bill, a high-visibility safety accent spent on the one late load, split-flap motion for a status change, dense rows because the screen is used all day.
- **A clinic's booking screen.** Territories: the appointment card; the wayfinding system of the corridors; the printed prescription pad. Moves: a calm humanist sans from wayfinding, colour-coded zones as the shape and colour language of the time slots, the card's perforated edge as the confirmation, generous targets and quiet motion because people arrive anxious.

## The generic defaults

A direction may use one of these with intent; one resting on several at once reads as nobody chose it. Each is a sign and its fix. The list is the shared vocabulary of 2025–2026 design writing and of the most-used agent design skills, not a measured standard ([925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [uxdesign.cc](https://uxdesign.cc/ai-design-isnt-ugly-it-s-fluent-and-thats-the-problem-131b2f4eb78c), checked 2026-11-22; [anthropics/skills `frontend-design`](https://github.com/anthropics/skills/tree/main/skills/frontend-design), [impeccable](https://github.com/pbakaus/impeccable) `craft-floor.md`, [unslop](https://github.com/heydamir/unslop) `references/signs.md`, checked 2026-11-27).

**Type and colour**
- **Inter (or the system sans) for everything** → a pairing with a job for each face, or a characterful text face (a humanist sans, a grotesque with real contrast, a serif for reading).
- **The purple-to-blue gradient** on the hero or the main button → a flat accent picked for this product, its hue tied to the brand or the domain, with gradient only as a subtle surface tint if at all.
- **Gradient text** in a heading, a number or the logo → solid text; emphasis from weight or size.
- **Headings at weight 800–900** → 500–600, hierarchy from the scale.
- **Tracked-out uppercase labels** (an eyebrow above every heading, `PAID THIS MONTH`) → sentence case at normal tracking; the heading carries itself.
- **Five near-identical tints of one hue for text** → three text roles from one neutral ramp.
- **Every element highlighted** → one accent, once or twice per screen.
- **Grey-on-white with one blue link colour** → tinted neutrals and an accent spent on the main action.
- **Monospace as a "technical" costume** → mono only for code, data and measurements.

**Surfaces**
- **Soft-shadow rounded cards everywhere**, one radius on every corner → the single separation method above, radius scaled to the element (small on inputs, larger on sheets), cards only where content is a card; never a card in a card.
- **A coloured bar down one side of a rounded box** → a full border, a tint, or a leading icon or label.
- **Zero-offset coloured glows**, neon borders, glass with a white inner highlight → surface steps and hairlines at 6–10% opacity; blur only as a specific effect.
- **Radial washes and blurred blobs behind content** → remove; texture only from the territory.

**Composition and chrome**
- **The centred hero plus three feature cards**, or a grid of identical icon-heading-text cards as the page structure → a composition led by the product itself: the real screen, a left-aligned headline with a working example, an asymmetric grid.
- **The hero-metric template** (a big number, a small label, supporting stats) → the number inside the sentence or the chart that gives it meaning.
- **Section numbers 01 / 02 / 03** on things that are not a sequence → no number; a real sequence keeps its steps.
- **Template chrome**: meta joined with middle dots (`A · B · C`), labels as `WORD — fragment`, `→` on every button, a greeting headline (`Welcome back, Sam 👋`) → the page's own title and the action's own verb.
- **Emoji or Unicode glyphs as icons**, a ✨ for anything AI → one icon family, with illustration where a moment deserves it.
- **Light or dark picked by product category** → picked from the scene of use: who, where, under what light.

**The five looks a model reaches for when nobody chose** (`frontend-design`, checked 2026-11-27). Each is a whole default, worth refusing unless the territory itself is that world:
1. warm cream (near `#F4F1EA`), a high-contrast serif display and a terracotta accent (near `#D97757`, Anthropic's own interface accent, so on another product it reads as a tell);
2. near-black with one acid-green or vermilion accent;
3. broadsheet: hairline rules, zero radius, dense newspaper columns;
4. the SaaS card kit: identical rounded cards, one radius, the same `rgba(0,0,0,.1)` shadow, gradient washes;
5. template chrome (above) on any subject, with tinted near-black (`#0B0B0B`) standing in for black.

*Check:* before a direction is shown, name which of these it uses and why; the brief lists the moves it took from this module.

## Where references come from

Look at a reference for one move, never copy it, and cite it with its URL and the date it was checked. Each was checked on the date given; re-check before quoting a detail.

**Outside software, per territory, first.** These are where a direction finds what no app class shares: the trade's own publications and suppliers' catalogues; signage and wayfinding systems of its places; its packaging and labels; museum and archive collections of its objects and printed matter (digitised collections are searchable by object type); studios and type foundries that have worked for that trade. A search names the trade and the object, never the project, the client or the user. *Check:* each direction names the reference move it took and where it came from.

**The convergent baseline: products every designer already looks at.** Useful to see the state of a class; a direction built from them alone pulls back toward the average.

- **Tool / dashboard:** Linear, its 2024 UI redesign and the later refresh of quieter borders and header consistency ([Linear](https://linear.app/now/behind-the-latest-design-refresh), checked 2026-11-22) — density, restraint, a near-monochrome palette with one accent.
- **Consumer mobile:** CapWords, the 2025 Apple Design Award winner for Delight and Fun, and Mela, a 2025 Interaction finalist ([Apple](https://www.apple.com/newsroom/2025/06/apple-unveils-winners-and-finalists-of-the-2025-apple-design-awards/), checked 2026-11-22) — illustration and playful feedback around one main action; calm, content-first lists.
- **Content / reading:** iA Writer, a 2025 Apple Design Award Interaction finalist (same source) — typography as the whole interface.
- **Marketing site:** Readymag's "best websites of 2025" ([Readymag](https://blog.readymag.com/websites-of-the-year-2025/), checked 2026-11-22) — a pool of editorial compositions; pick one from the product's own industry rather than the most decorated.
