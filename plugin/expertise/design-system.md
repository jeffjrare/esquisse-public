---
name: design-system
description: Design tokens and the theme. Use before writing any colour, background, border, badge or chip class, adding or renaming a token, changing radius, shadow or fonts, touching a Tailwind or shadcn setup, adding a dark theme or a theme switch, or judging a lint failure on colours.
---

# Design system: tokens, roles and the theme

**As of:** 2026-10-25

**Paths:** `components/ui/`, `styles/`, `tailwind.config.*`, `components.json`, `*tokens*`, `globals.css`

**Stack:** `tailwindcss`, `@radix-ui/*`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a library version, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree, and a project's own token file is the truth for its names. Contrast ratios and the focus indicator belong to `esq:accessibility`: this skill says where colours come from, that one says which pairs must hold.

A design system is the product's look made repeatable. Its rules exist so that a screen built next month looks like the one built today, and so that a theme change repaints everything without anyone revisiting a component.

**One rule here is documented, not tested in a shipped project:** the cross-origin theme cookie (below) was proven between two subdomains of one apex; it has not been tested across unrelated domains, where it cannot work at all. Treat any other setup as unverified.

## Colour comes from tokens

- **Every colour class is a semantic token, never a fixed shade, a hex value or `white`/`black`.** *Why:* a fixed shade (`text-gray-900`, `bg-blue-100`) cannot follow a dark theme, and it sits in no pair a contrast check knows, so it passes by luck. A token (`text-ink`, `bg-surface`) is defined once per theme. *Check:* a lint rule or script that fails on shaded utility families, hex literals and `white`/`black` in component code. If the project has none, grep for them before calling a UI change done.
- **Each colour family carries the same roles, and each role has one job.** A workable set is four: the **solid** (a filled ground), **soft** (a container's pale tint), **line** (a border, never a ground) and **ink** (the text that sits on the solid). *Why:* when roles are named, a component picks a role, not a colour, and the theme stays consistent. *Trap:* a soft chip nested on a soft ground of the same family resolves both to the same value and disappears. On a tinted ground, a chip takes the family's solid and its ink. *Check:* look at every chip or badge placed inside a tinted container, in both themes.
- **Text never sits on a `line` value.** *Why:* nothing measures contrast against a border colour, so text on it passes by luck.
- **Charts are the usual exception, and they are the only one.** A data series must keep its identity across a theme change, so its palette may be fixed values, in one module, by a named exemption. Read series colours from that module, never inline at a call site.
- **An exemption is a named entry, with its reason, inside the checker.** *Why:* a colour that legitimately cannot follow the theme (a dialog scrim, a caption over a photograph, a colour stored as user data) must be recorded where the next person looks. A local disable comment removes the reason from that place. One entry buys one case, never a blanket pass.

## The stacks that hide a trap

- **With shadcn/ui, `accent` is a hover surface, not the brand colour.** *Why:* shadcn's `--accent` is the pale background of a hovered menu item or ghost button, paired with `--accent-foreground` ([theming](https://ui.shadcn.com/docs/theming), checked 2026-10-25). `text-accent` therefore paints pale text, near-invisible on a pale ground. Use the primary token for brand ink, and keep `bg-accent`/`text-accent-foreground` for the hover role they exist for. If the project re-points `--accent` at a tint, the trap is the same. *Check:* grep for bare `text-accent`.
- **Tailwind 4 has no JS config by default: the tokens live in CSS, under `@theme`.** *Why:* v4 defines the tokens that generate utilities in the stylesheet ([theme variables](https://tailwindcss.com/docs/theme), checked 2026-10-25); a JS config is no longer picked up automatically and is read only when a stylesheet loads it with `@config` ([upgrade guide](https://tailwindcss.com/docs/upgrade-guide)). Looking for the palette in a JS file finds nothing or a stale leftover. When a theme variable points at another variable that switches by theme (`--color-surface: var(--surface)`, with `--surface` redefined under `.dark`), declare it under `@theme inline`: the utility then writes the referenced variable itself, resolved on the element; without `inline` it can resolve where the theme variable was defined and ignore the switch. A class whose token has no entry generates nothing, silently: the element renders uncoloured. *Check:* after adding a token, see the utility in the built CSS.
- **With shadcn/ui, a native `<input>`, `<select>` or `<textarea>` outside the primitives directory is a second, unstyled component.** Route form controls through the primitives. File inputs are the usual exception (a hidden input behind a button).

## Shape and type

- **Use the project's radius and shadow scales, not the framework's stock ones.** One radius variable with a few derived steps, and a few elevations (a card, a raised menu, a modal), make a card and a modal read as one product. *Why:* stock scales offer eight radii and eight shadows, and each author picks a different one. In a dark theme, shadows tuned against white are invisible: deepen them there.
- **Fonts are self-hosted when the Content-Security-Policy restricts `font-src`.** *Why:* `font-src 'self'` blocks a font CDN in the browser, and the page silently falls back. A third-party font host is also a third party receiving visitors' IP addresses, which privacy law may require you to declare. *Check:* load the built page with the CSP headers on, and see no blocked font request in the console.

## The theme

- **The theme is known before first paint.** *Why:* a theme stored on the account is known only after the profile request answers, so the page either flashes the wrong theme or waits to paint. *Fix:* a small inline script in the document `<head>`, before the bundle, reads the choice from the device and sets the class on `<html>`; system preference (`prefers-color-scheme`) fills in when there is none. When two origins on the same apex (a site and an app on a subdomain) must share the choice, `localStorage` cannot carry it across; a cookie scoped to the parent domain can. Its name and values are then a contract between every file that reads or writes it. *Check:* hard-reload in dark mode with a throttled network and watch for a light flash.
- **Twin token files move together.** *Why:* when two packages cannot import from each other (a static marketing site beside an app), each keeps a copy of the palette, and a token changed in one drifts silently from the other. Name the twin at the top of each file, change both in one commit, and run each package's contrast check. *Check:* diff the two palette blocks.
- **Every component is checked in both themes.** A token-only component gets the dark theme free; one fixed value breaks it.
