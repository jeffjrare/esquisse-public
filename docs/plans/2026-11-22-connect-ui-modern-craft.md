# Connect /esq:ui to modern UI craft

**Branch:** esq/connect-ui-modern-craft

**Origin:** main

## Context
`/esq:ui` holds the right intentions: a gate of six measured checks, motion that has to be rendered, a "departure departs" rule, and judging at phone width. It holds no craft knowledge, though. It is the only judging command that never calls `esq expertise match`: `plan`, `build` and `review` call it (`plugin/skills/review/SKILL.md:51`). So during an audit it never reads `accessibility.md`, `design-system.md`, `forms-and-failures.md`, `pwa-and-push.md` or `capacitor-*.md`. No module covers look-and-feel (typography, colour, surfaces, layout, iconography) or motion and component states. "Modern" therefore rests on Pass 3's up-to-8 web searches, repaid on every run, and the model falls back on its own habits: the "drab" outcome the user judged in 2026-09 (memory `ui-redesign-aims-at-character`).

## Goal
The next `/esq:ui` run renders directions built on dated, sourced craft knowledge: typography, colour, surfaces, layout, iconography, motion, component states and mobile patterns. Plan, build and review then implement the chosen direction against the same modules. Each direction is also gated on the states of its components, non-text contrast and accessible names.

## Done looks like
- An `/esq:ui` run, bare or `--greenfield`, reads `visual-craft`, `motion-and-states` and `accessibility` every time, plus every module the slice's files or the stack match. It names them in its report.
- `visual-craft` gives the model concrete, dated moves for type, colour, surfaces, layout and iconography. It names the generic "AI look" defaults a direction must not lean on, and 2–3 reference products per app class, each with the date checked.
- `motion-and-states` gives duration and easing tokens, the modern CSS primitives with their browser support as checked, the component state matrix and the mobile patterns.
- No direction reaches the page unless:
  - each interactive element shows a distinct hover, press, focus and disabled state (and selected or loading where it has one);
  - its control boundaries and icons hold 3:1;
  - every icon-only control has an accessible name;
  - the touch target is 48 px when the product ships on Android, 44 px otherwise.
- Pass 3 no longer re-searches a fact a fresh module already dates; it searches only what the modules do not cover.
- The README's `/esq:ui` row and its Expertise section say all of this.
- A later `/esq:build` or `/esq:review` on a stylesheet or component file reads `visual-craft` / `motion-and-states` through `**Paths:**` matching, with no change to the CLI.

## Approaches considered
- **Two expertise modules, plus wiring `/esq:ui` to `esq expertise match`** (chosen). It reuses the existing catalog, parser, `check-plugin.sh` gate and stale-date mechanism with no CLI change. Because modules match by path, the knowledge also reaches `/esq:plan`, `/esq:build` and `/esq:review` when they implement the chosen direction: the direction and its build share one referent. The cost is two ~50-line research-backed files and edits to one skill.
- **Put the craft content in `plugin/skills/ui/references/` instead** (structural alternative, rejected). Only `/esq:ui` would read it. The builder implementing a direction would go back to its own habits, so the craft would be lost between direction and code, which is the gap this work exists to close. It would also bypass the dated / stale mechanism.

## Recommendation
Two expertise modules plus wiring, in two phases ordered by value:
- **Phase 1** ships look-and-feel (the user's stated pain) and the wiring, so the very next `/esq:ui` run benefits.
- **Phase 2** adds motion, component states, the mobile patterns and the gate's seventh item.

Settled choices:
- **`/esq:ui` always reads the three UI modules, whatever matched.** Matching is path-based, and `--greenfield` has no files to match; `ui` is the one command whose whole domain these modules are.
- **Touch target: 48 px when the stack or the spec ships Android** (`@capacitor/android`, an `android/` tree), **44 px otherwise.** Material asks 48 dp, Apple's HIG 44 pt. WCAG 2.5.8's 24 px stays the floor `accessibility.md` already states. The build re-checks both platform guides and records the source and date in the module.
- **Gate item 7 reads computed styles through the driver.** It forces `:hover` / `:active` / `:focus-visible` (CDP `CSS.forcePseudoState` when the driver exposes it, otherwise driver hover and press), compares each state against rest, and takes accessible names from the driver's accessibility snapshot. These are values, not images, so the announced ceiling of 12 captures is unchanged.
- **Module research is paid once, in build**: at most 3 searches per load-bearing claim, every claim carrying its source and check date (`D-expertise-modules-announced-by-stack` format).

## Phases

### Phase 1 — Look-and-feel knowledge, wired into /esq:ui
- **Goal:** the next `/esq:ui` run reads a dated `visual-craft` module and every module the slice touches, and the README says so.
- **Files touched:** `plugin/expertise/visual-craft.md` (new), `plugin/skills/ui/SKILL.md`, `README.md`
- **Expertise:** `esq:design-system`, `esq:accessibility`
- **Tasks:**
  - Task 1.1: **add the `visual-craft` expertise module.**
    - Frontmatter `name: visual-craft` and a description of at most 460 characters, then `**As of:** <build date>`.
    - `**Paths:**` covering stylesheets, screens and components (`styles/`, `*.css`, `globals.css`, `tailwind.config.*`, `theme.*`, `components/`, `layouts/`, `pages/`, `screens/`, `views/`), so `src/components/SearchInput.tsx` matches it.
    - `**Stack:**` with `tailwindcss` and the component libraries that set a look (`@radix-ui/*`, `@mui/material`, `@chakra-ui/react`, `@mantine/core`).
    - Body in the house shape (rule → *Why* → *Check*, ~45–60 lines):
      - **typography:** pairing, scale ratio, variable fonts, hierarchy by weight and colour before size, measure and leading;
      - **colour:** `oklch` ramps, tinted neutrals, one accent's budget, dark theme designed rather than inverted;
      - **surfaces and depth:** elevation, border versus shadow, texture and grain;
      - **layout:** density, grid, vertical rhythm;
      - **iconography and imagery:** one icon family and stroke, when illustration pays;
      - **the generic-AI-look defaults** a direction must not rest on all at once (Inter everywhere, the purple-to-blue gradient, soft-shadow rounded cards, emoji as icons, centred-hero-plus-three-cards), each with the move that replaces it;
      - **2–3 reference products per app class** (tool / dashboard, consumer mobile, marketing site, content), each with its date checked.
    - Cross-references so the modules do not collide: tokens are `design-system`'s, contrast pairs are `accessibility`'s.
    - No `**Paths:**` span may match `frontend/src/App.tsx`: `tests/cli/expertise.test.mjs:108` holds that no shipped module matches it, and that test stays as it is.
  - Task 1.2: **wire `/esq:ui` to the expertise catalog.**
    - **Pass 1:** chain `esq expertise match --all --paths -` (the slice's files on stdin; in `--greenfield`, whatever stack files exist) into its read wave.
    - `Read` every module that matched by path or stack, plus `visual-craft`, `motion-and-states` (once it exists, i.e. after Phase 2, so the wording names it by id and an id the catalog lacks gets one line, never a stop) and `accessibility`, always.
    - Same wording as review: modules are files, not skills; a `stale` module gets one line and is still read.
    - **Pass 3:** a fact a non-stale module dates is inherited, not re-searched. Searches go only to what the modules leave open; the announced bound of 8 stays.
    - **Pass 4:** each direction's signature is checked against `visual-craft`'s generic-defaults list, and the brief names which moves it took from the module.
    - The report names the modules read.
  - Task 1.3: **README, in the same commit as 1.2.**
    - Add the `esq:visual-craft` row to the § Expertise module table, in alphabetical order.
    - Say in § Expertise that `/esq:ui` inherits a fresh module's dated facts instead of re-searching them.
    - In § Expertise, `/esq:plan`, `/esq:build` and `/esq:review` become "`/esq:plan`, `/esq:build`, `/esq:review` and `/esq:ui`". Add one clause that `/esq:ui` always reads the UI modules.
    - The `/esq:ui` table row gains "against the UI craft and accessibility expertise modules".
- **Verification:**
  - `(auto)` `printf 'src/styles/globals.css\n' | esq expertise match --paths -` — the answer lists `esq:visual-craft` with that path in `matched`, alongside `esq:design-system`
  - `(auto)` `printf 'src/components/SearchInput.tsx\n' | esq expertise match --paths -` — the answer lists `esq:visual-craft` with that path in `matched`
  - `(auto)` `bash scripts/check-plugin.sh` — exits 0: the new module's frontmatter, date, paths, stack and description length parse

### Phase 2 — Motion, component states and the seventh gate item
- **Goal:** directions carry modern motion and full component states. The gate refuses one whose controls lack a state, contrast at 3:1 or a name.
- **Files touched:** `plugin/expertise/motion-and-states.md` (new), `plugin/expertise/accessibility.md`, `plugin/skills/ui/SKILL.md`, `README.md`
- **Expertise:** `esq:accessibility`, `esq:capacitor-ios`, `esq:capacitor-android`, `esq:pwa-and-push`
- **Tasks:**
  - Task 2.1: **add the `motion-and-states` expertise module.**
    - `**Paths:**`: `components/`, `*.css`, `animations/`, `motion/`, `*Button.*`, `*Sheet.*`, `*Drawer.*`, `*Nav*`, `*Toast*`.
    - `**Stack:**`: `motion`, `framer-motion`, `@capacitor/haptics`, `@formkit/auto-animate`.
    - Body:
      - **duration and easing tokens** (short and long, enter and exit asymmetry, `linear()` springs);
      - the native primitives with their browser support as checked: `@starting-style` + `transition-behavior: allow-discrete`, same-document and cross-document view transitions, scroll-driven animations, the Popover API, anchor positioning, container queries, `:has()`;
      - when a script library earns its place;
      - **the component state matrix:** rest / hover / press / focus-visible / disabled / selected / loading / error, what each must change and what it must not shift (layout);
      - **mobile patterns:** `env(safe-area-inset-*)`, `100dvh`/`svh`, the virtual keyboard (`interactive-widget`, `visualViewport`), `@media (hover: hover)` and `(pointer: coarse)`, `inputmode` / `enterkeyhint`, bottom navigation and sheets, Capacitor haptics on the main action.
    - Reduced motion is cited from `accessibility`, never restated.
    - The same `frontend/src/App.tsx` constraint as Task 1.1 holds (`tests/cli/expertise.test.mjs:108`).
  - Task 2.2: **align the touch-target threshold in `accessibility.md`.** Name 48 px for Android-shipping products and 44 px otherwise (CSS px, which a WebView maps 1:1 to dp and pt at the platform's reference density; say so rather than treating physical pixels as interchangeable), beside the existing 24 px AA floor, with the platform guides' source and date. Bump `**As of:**`.
  - Task 2.3: **seventh item in `/esq:ui`'s Pass 4 gate**, with item 3 changed to the platform threshold. Item 7 has three parts:
    - **(a) state matrix:** for every interactive element, each forced state (hover, press, focus-visible) and each real one (disabled; selected or loading where the element has that state) changes a painted property (`color`, `background-color`, `border-color`, `outline`, `box-shadow`, `opacity`, `transform`, an SVG `fill` or `stroke`) against rest. Press also differs from hover. Exempt only what `motion-and-states` exempts.
    - **(b) non-text contrast:** each control boundary and icon holds 3:1 against what it touches. The ratio is computed from the rendered element's computed colours (`border-color`, `color`, SVG `fill`/`stroke`, after opacity) against the computed background behind it, in both themes. A pair the driver cannot resolve, such as an image ground, is stated unverified.
    - **(c) accessible names:** every icon-only control has a non-empty name in the driver's accessibility snapshot.
    - Like 2, 3, 4 and 6, it is a driver read in the same session, stated unchecked when the driver cannot evaluate script.
    - Update the "six" wording wherever the skill counts the gate.
    - **README in the same commit:** add the `esq:motion-and-states` row to the module table, and change the `esq:accessibility` row's "24×24 px targets" to "24×24 px targets (44 px, or 48 px when shipping Android)". The `/esq:ui` row's "gated on contrast, focus, target size, phone width, reduced motion and states" gains "component states, control contrast and accessible names".
- **Verification:**
  - `(auto)` `printf 'src/components/ui/Button.tsx\n' | esq expertise match --paths -` — the answer lists `esq:motion-and-states` with that path in `matched`
  - `(auto)` `./scripts/audit.sh` — PASS (whole-repo final run: check-plugin, structure, product suites including `tests/cli/expertise.test.mjs`)

## Risks
- **Pre-mortem: the likeliest way this does not change what the user sees** is a module that restates generic advice ("use a type scale") instead of concrete, dated moves, so directions stay drab. Task 1.1's references and its generic-defaults list, each with a replacing move, answer this. The proof is the next real `/esq:ui` run judged on the phone, an observation outside this unit, left unproved here.
- **Pass 3 inheritance vs freshness.** Inheriting a module fact saves searches. But a module goes stale after 180 days: the stale line plus a re-search of only the stale claims is the rule.
- **Item 7's forced pseudo-states depend on the driver.** CDP `forcePseudoState` exists in Playwright / Chromium, not every MCP browser. The skill states the item unchecked rather than inferring it (same rule as items 2, 3, 4 and 6).
- **Touch target 48 vs 44:** the Android signal must come from the stack or the spec. A PWA used on Android without a Capacitor shell gets 44, which is a deliberate choice recorded in the module.
- **`visual-craft` and `design-system` both match `globals.css` and `tailwind.config.*`.** That is intended (look vs token hygiene), and each module's cross-reference sentence keeps them from contradicting.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-22

**Plan committed at:** d0b86d7

**Commits:** 5e7a01b, 6c9270c

**Verified:** 6c9270ca5d6d0ee61291542ef34745b25674ef7c
- `printf 'src/styles/globals.css\n' | esq expertise match --paths -`
- `printf 'src/components/SearchInput.tsx\n' | esq expertise match --paths -`
- `bash scripts/check-plugin.sh`

**What got built:** A dated, sourced `visual-craft` expertise module (typography, colour, surfaces, layout, iconography, the generic-AI-look defaults with their replacing moves, reference products per app class), and `/esq:ui` now chains `esq expertise match --all --paths -` into Pass 1, always reads visual-craft, motion-and-states and accessibility, inherits non-stale module facts in Pass 3, checks each signature against the generic defaults in Pass 4, and names the modules read in its report; README says so.

**Verification:**
- (auto) printf 'src/styles/globals.css\n' | esq expertise match --paths - — lists esq:design-system and esq:visual-craft, each with src/styles/globals.css in matched — PASS
- (auto) printf 'src/components/SearchInput.tsx\n' | esq expertise match --paths - — lists esq:visual-craft with src/components/SearchInput.tsx in matched — PASS
- (auto) bash scripts/check-plugin.sh — exit 0, '23 skills and 21 expertise modules validate' (re-run after the last commit) — PASS
- extra: node --test tests/cli/expertise.test.mjs — 8 pass (frontend/src/App.tsx still matches no module); scripts/check-structure.sh clean. Whole audit skipped: the phase touched one module file, one skill and the README, no CLI or shared code; Phase 2 (last) runs ./scripts/audit.sh

**Decided for you:**
- design: reference products are Linear (tool), CapWords and Mela (consumer mobile), iA Writer (content) and Readymag's 2025 list (marketing) — each was checkable today with a dated source; the Awwwards SOTY winner could not be confirmed — undo: edit § Reference products in plugin/expertise/visual-craft.md
- product: `/esq:ui` reads a module matched by stack as well as by path (`matched` or `stack` non-empty) — greenfield has no files, so stack is its only signal — undo: drop 'or `stack`' in Pass 1 of plugin/skills/ui/SKILL.md

**Surprises / decisions made during execution:** - Tasks 1.2 and 1.3 share one commit (6c9270c), as the plan requires ('README, in the same commit as 1.2').
- Research spent 7 web searches in total. `text-wrap: pretty` support differs by source, so the module calls it progressive enhancement rather than citing a version.
- Also updated the README's 'An interface that works but looks dull?' paragraph so it does not contradict the new behaviour.
- Pass 1 names `esq:motion-and-states` already; until Phase 2 ships it, the run prints its one 'not in the expertise catalog' line, as planned.

**Backlog candidates:** None.

**For Phase 2:** 1. `plugin/expertise/visual-craft.md` defers motion and component states to `esq:motion-and-states` only implicitly; Phase 2's module should cross-reference visual-craft (look) and accessibility (reduced motion, contrast). 2. `/esq:ui` Pass 1 already reads `esq:motion-and-states` by id, so Phase 2 needs no wiring there, only the gate item 7 and the 'six' wording. 3. visual-craft's Paths include `components/` and `*.css`; Phase 2's module overlaps those by design, and `frontend/src/App.tsx` must still match nothing (tests/cli/expertise.test.mjs).

### Phase 2 — completed 2026-11-22

**Plan committed at:** 41722b1

**Commits:** 6dd50b0, f0bbef2, a8643d2

**Verified:** a8643d26c634cbc78c508713edba9767d8cc0697
- `printf 'src/components/ui/Button.tsx\n' | esq expertise match --paths -`
- `./scripts/audit.sh`

**What got built:** A dated `motion-and-states` expertise module (duration and easing tokens, native CSS primitives with browser support read from web-features 3.47.0 and MDN BCD 8.1.10, when a motion library earns its place, the component state matrix, mobile patterns); `accessibility.md` names 44 px / 48 px-on-Android touch targets with Android and Apple sources; `/esq:ui`'s gate gains item 7 (state matrix, non-text contrast, accessible names) and item 3 takes the platform threshold; README says so.

**Verification:**
- (auto) printf 'src/components/ui/Button.tsx\n' | esq expertise match --paths - — lists esq:motion-and-states with src/components/ui/Button.tsx in matched (beside accessibility, design-system, visual-craft) — PASS
- (auto) ./scripts/audit.sh — exit 0, 'Clean — 7 checks (product)', product suites passed, 29 s — PASS
- extra, per task: bash scripts/check-plugin.sh — '23 skills and 22 expertise modules validate'; node --test tests/cli/expertise.test.mjs — 8 pass (frontend/src/App.tsx still matches no module); scripts/check-structure.sh exit 0

**Decided for you:**
- design: the state matrix exempts only a link inline in running text (hover/focus underline) and purely decorative elements — every other control owes every state it has — undo: edit the 'Exempt' line under § The component state matrix in plugin/expertise/motion-and-states.md
- design: motion tokens follow Material 3's ladder (100–200 ms feedback, 250–400 ms surfaces, enter emphasized-decelerate, exit emphasized-accelerate at about two thirds of the enter time) — the one public token set checkable today with exact values — undo: edit § Duration and easing in plugin/expertise/motion-and-states.md
- product: gate item 3 also takes 48 px when the spec names Android, beside the `@capacitor/android` / `android/` stack signals — the plan's Android signal is 'the stack or the spec' — undo: drop 'or the spec names Android' from item 3 in plugin/skills/ui/SKILL.md

**Surprises / decisions made during execution:** - Browser support was read from the web-features and MDN browser-compat-data packages (2 downloads) rather than web searches: one deterministic source for every primitive. Two facts are newer than prior knowledge: scroll-driven animations became Baseline on 2026-10-27 (Firefox 159), and anchor positioning is in Chromium 157 and Safari 27 but not Firefox.
- Apple's HIG page is script-rendered; its 44×44 pt default (28×28 pt minimum) was read from the HIG's JSON data endpoint. Material's duration/easing values came from the @material/web 2.5.0 token source, since m3.material.io is script-rendered too.
- The README's 'An interface that works but looks dull?' paragraph also listed the gate ('44 px targets'); updated it in the same commit so it does not contradict the new gate.
- docs/SPEC.md (§ /esq:ui, 'Des points nommés…') names no count and was left to /esq:spec.

**Backlog candidates:** None.

**For Phase 3:** Last phase: the plan is complete. Next is /esq:review on this plan; the real proof of 'Done looks like' (a non-drab direction judged on the phone) is the next /esq:ui run, outside this unit.
