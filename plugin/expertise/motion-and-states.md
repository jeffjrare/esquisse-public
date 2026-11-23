---
name: motion-and-states
description: Motion and component states of a web UI: duration and easing tokens, the native CSS primitives with their browser support, when a script library earns its place, the state matrix every control owes, and the mobile patterns (safe areas, dynamic viewport, virtual keyboard, coarse pointers, sheets, haptics). Use before animating anything, styling a button, nav, sheet, drawer or toast, or shipping a screen for phones.
---

# Motion and states: a control that answers

**As of:** 2026-11-22

**Paths:** `components/`, `*.css`, `animations/`, `motion/`, `*Button.*`, `*Sheet.*`, `*Drawer.*`, `*Nav*`, `*Toast*`

**Stack:** `motion`, `framer-motion`, `@capacitor/haptics`, `@formkit/auto-animate`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a browser-support fact, and keep going.** Support below is read from [web-features](https://web-platform-dx.github.io/web-features-explorer/) 3.47.0 and [MDN browser-compat-data](https://github.com/mdn/browser-compat-data) 8.1.10, checked 2026-11-22.

**A project skill on the same topic wins** where the two disagree. The look of each state (which accent, which surface) is `esq:visual-craft`'s; reduced motion, the focus indicator, contrast and target size are `esq:accessibility`'s and are cited from there, never restated. This module says what moves, how fast, and what every control must show.

Motion is feedback and orientation: it says what happened and where something went. A control with no visible answer to a press feels broken however it looks. Each rule names the move, why it pays, and how to see it.

## Duration and easing

- **Two duration bands, as tokens.** Small, local feedback (a press, a toggle, a hover) 100–200 ms; a surface entering or leaving (a sheet, a dialog, a page) 250–400 ms; nothing the user waits on beyond 500 ms. Material 3's tokens are a usable ladder: short 50–200, medium 250–400, long 450–600 ms ([@material/web](https://github.com/material-components/material-web) 2.5.0 tokens v0.192, checked 2026-11-22). *Check:* grep the stylesheet for literal `ms` values outside the token file.
- **Enter decelerates, exit accelerates, and exit is shorter.** Entering ends slowly so the eye lands (`cubic-bezier(0.05, 0.7, 0.1, 1)`, M3 emphasized-decelerate); leaving starts slowly and gets out of the way (`cubic-bezier(0.3, 0, 0.8, 0.15)`, emphasized-accelerate) in about two thirds of the enter time. One standard curve (`cubic-bezier(0.2, 0, 0, 1)`) serves the rest. *Why:* symmetric ease-in-out on everything is the default nobody chose.
- **Springs in CSS through `linear()`.** A spring or bounce sampled into `linear()` stops points runs without a library; `linear()` easing is Baseline widely available (newly since 2023-12-11). Generate the points with a tool, keep the overshoot small on UI chrome.
- **Animate `transform` and `opacity`; never `width`, `height`, `top` or `margin`.** *Why:* those trigger layout each frame and shift the content around them. *Check:* the performance panel shows no layout during the transition.

## Native primitives, before a library

| Primitive | Use it for | Support (2026-11-22) |
|---|---|---|
| `@starting-style` + `transition-behavior: allow-discrete` | enter/exit transitions on elements that appear (`display: none` ↔ shown, popovers, dialogs) | Baseline newly available since 2024-08-06 |
| Same-document view transitions (`document.startViewTransition`) | a state change inside one page: list to detail, filter, reorder | Baseline newly available since 2025-10-14 (Firefox 144) |
| Cross-document view transitions (`@view-transition { navigation: auto }`) | an MPA page change that morphs | Chromium 126, Safari 18.2; not Firefox: progressive enhancement |
| Scroll-driven animations (`animation-timeline: scroll()` / `view()`) | reading progress, reveal on scroll, a header that condenses | Baseline newly available since 2026-10-27 (Firefox 159): keep a static fallback for a while |
| Popover API (`popover`, `popovertarget`) | menus, toasts, tooltips without focus-trap code | Baseline newly available since 2025-01-27; `popover="hint"` not yet in Safari |
| Anchor positioning (`anchor-name`, `position-anchor`) | a popover pinned to its trigger | Chromium 157 and Safari 27, not Firefox: fall back to a positioning script |
| Container size queries | a component that adapts to its slot, not the viewport | Baseline widely available since 2025-08-14 |
| `:has()` | a parent styled by its state (a field group with an invalid input, a card with a checked box) | Baseline widely available since 2026-06-19 |

- **A script library earns its place** for gesture-driven motion (drag to dismiss a sheet, swipe between items), physics that must respond to velocity, shared-layout animation across a React tree (`motion`), or list reordering with zero code (`@formkit/auto-animate`). A hover, a fade, an enter/exit or a page morph is CSS now. *Check:* every import of a motion library maps to one of those four jobs.

## The component state matrix

Every interactive element shows each state it can be in, by a change in a painted property (colour, background, border, outline, shadow, opacity, transform, an SVG fill or stroke), never by a change in its box.

| State | Must change | Must not |
|---|---|---|
| rest | the baseline every other state is compared against | — |
| hover (only under `@media (hover: hover)`) | background or border one step; cursor | shift layout; be the only cue for anything |
| press (`:active`) | differ from hover too: a darker step or `scale(0.97)`, 100 ms | move neighbours |
| focus-visible | the global outline `esq:accessibility` owns | be replaced by hover's look |
| disabled | lower contrast and `cursor: not-allowed`; `aria-disabled` when it must stay focusable to explain why | disappear, or look identical to rest |
| selected / current | a persistent mark (filled icon, accent bar, `aria-current` or `aria-selected`) | rely on colour alone |
| loading | a spinner or progress inside the control, the label kept or announced, the width locked | change the control's width or let it be pressed twice |
| error | the field's border plus a message beside it (`esq:forms-and-failures` owns the message) | rely on red alone |

- **Exempt:** a link inline in running text needs only hover/focus underline; a purely decorative element is not interactive and owes nothing. Nothing else is exempt. *Check:* force `:hover`, `:active` and `:focus-visible` in devtools on each control and compare computed styles against rest; press must differ from hover.

## Mobile patterns

- **Safe areas:** `viewport-fit=cover` plus `env(safe-area-inset-*)` on fixed headers, tab bars and sheets (Baseline widely available); the Capacitor shells' edge-to-edge rules are `esq:capacitor-ios`'s and `esq:capacitor-android`'s.
- **Viewport height:** `100dvh` for a full-height layout that follows the collapsing URL bar, `100svh` for a hero that must never jump; `100vh` is the old bug. Baseline widely available since 2025-06-05.
- **The virtual keyboard:** `<meta name="viewport" content="…, interactive-widget=resizes-content">` makes the layout viewport shrink with the keyboard, so a bottom bar stays above it (Chrome Android 108, Firefox Android 133, Safari iOS 27.3 per MDN BCD). Elsewhere, listen to `visualViewport` `resize` (Baseline widely available) and pad by the difference. *Check:* focus the last field on a phone; the submit stays visible.
- **Coarse pointers:** gate hover effects in `@media (hover: hover) and (pointer: fine)`, enlarge hit areas under `(pointer: coarse)` (Baseline widely available). A hover-only reveal is invisible on touch.
- **The right keyboard:** `inputmode` (`numeric`, `decimal`, `email`, `tel`, `search`) and `enterkeyhint` (`next`, `send`, `search`, `done`) on every text field; both Baseline widely available.
- **Navigation within reach:** 3–5 primary destinations in a bottom bar on phones, the current one marked; secondary actions in a bottom sheet with a visible grab handle, dismissible by swipe, scrim tap and Back. Target sizes are `esq:accessibility`'s.
- **Haptics on the main action, once:** in a Capacitor app, `Haptics.impact({ style: ImpactStyle.Light })` from `@capacitor/haptics` on the primary confirm or a successful toggle, never on every tap or scroll. A web build has no haptics to rely on.
