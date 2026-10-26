---
name: accessibility
description: Accessibility of a web UI against WCAG 2.2 AA. Use before building or changing a UI primitive, a dialog, menu or popover, a focus style, a colour token pair, an icon-only button, a form field's label or error, a toast or async status message, an animation, or the document's language.
user-invocable: false
---

# Accessibility: WCAG 2.2 AA in practice

**As of:** 2026-10-25

**Paths:** `components/ui/`, `*Dialog.*`, `*Modal.*`, `*Menu.*`, `index.html`, `layouts/`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a criterion number, and keep going.** The standard is [WCAG 2.2](https://www.w3.org/TR/WCAG22/), a W3C Recommendation, latest version dated 2024-12-12 (checked 2026-10-25); a WCAG 3 draft does not replace it. Patterns follow the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) (APG). Criterion numbers below are WCAG 2.2's.

**A project skill on the same topic wins** where the two disagree. Which tokens exist belongs to `esq:design-system`; when a failed submit moves focus, to `esq:forms-and-failures`. This skill owns which colour pairs must hold and how focus is drawn.

Accessibility is the product working for someone on a keyboard, a screen reader, a phone in the sun or a zoomed screen. Most failures are invisible to the author using a mouse, so each rule below says how to see it.

**One rule here is documented, not tested in a shipped project:** the live region for async results (below) follows the APG and WCAG 4.1.3; no shipped project here has verified it with a screen reader yet. Test it with one (VoiceOver, NVDA or TalkBack) before relying on it.

## Focus

- **One focus indicator, declared once, globally, as an `outline` on `:focus-visible`. Never a per-component ring, never `outline: none` without a replacement.** *Why:* WCAG 2.4.7 (AA) requires a visible indicator. Per-component rings drift into several widths, and the ones that also remove the browser outline leave controls with two indicators or none. An `outline` follows `border-radius`, is drawn outside the box so it never shifts layout, and survives an ancestor's `overflow: hidden`, where a `box-shadow` ring is clipped. For a strong target, follow 2.4.13 (AAA): at least as thick as a 2 CSS px perimeter, 3:1 between focused and unfocused states. A selection glow is not a focus indicator; give it a different look. *Check:* tab through every changed screen with the mouse unplugged; every stop is visible, and grep finds no new per-component focus ring.
- **A focused element is never hidden by a sticky header, footer or banner.** *Why:* 2.4.11 Focus Not Obscured (Minimum, AA, new in 2.2): a component that receives focus must not be entirely hidden by author content. Tabbing down a long page under a sticky header scrolls the focused field just under it. *Fix:* `scroll-padding-top` (and `-bottom`) on the scroll container, equal to the sticky bar's height. *Check:* tab down a long form under the sticky bar.
- **A modal dialog moves focus in, keeps it in, closes on Escape, and gives it back.** Per the [APG dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (checked 2026-10-25): on open, focus goes inside (usually the first focusable element; for a destructive confirmation, the least destructive button); Tab and Shift+Tab cycle within it; Escape closes; on close, focus returns to the element that opened it. *Why:* otherwise a keyboard user tabs into the page behind the overlay, and on close lands at the top of the document. The native `<dialog>` element opened with `showModal()` makes the rest of the page inert and handles Escape; a component library's dialog primitive (Radix, Headless UI, React Aria) handles all four. *Check:* open, tab past the last control, press Escape, see focus back on the trigger.

## Colour and size

- **Text contrast is at least 4.5:1 (3:1 for large text), and a control's boundary, icon or state at least 3:1 against what touches it, in every theme.** *Why:* 1.4.3 and 1.4.11 (AA). A colour picked by eye in one theme fails in the other. *Fix:* check contrast as **token pairs** (each ink on each ground it is used on), in both themes, by a script over the token file that fails the build below the floor, rather than component by component. Placeholder text and disabled-looking but enabled controls count. *Check:* the script's pair list covers every new pairing this change introduced.
- **Pointer targets are at least 24×24 CSS px, or spaced so a 24 px circle on each does not overlap another.** *Why:* 2.5.8 Target Size (Minimum, AA, new in 2.2). Exceptions: inline links in a sentence, a control whose size the browser sets, an equivalent larger control elsewhere on the page, and a size that is essential or legally required. Icon-only buttons in toolbars and table rows are the usual failure. Platform guides ask for more on touch (44 pt on iOS, 48 dp on Android). *Check:* measure icon buttons and close crosses in devtools.

## Names, errors and announcements

- **Native elements before ARIA.** A `<button>` for an action, an `<a href>` for navigation, `<label for>` for a field, `<fieldset>`/`<legend>` for a group. *Why:* the native element brings focus, keyboard activation, role and name for free; a `div` with `role="button"` must re-implement each, and usually misses Space or Enter. The APG's first rule is to avoid ARIA a native element covers. *Check:* every clickable element is reachable with Tab and activates with Enter (and Space for a button).
- **Every control has an accessible name; an icon-only button has a text one** (`aria-label` or visually hidden text), translated like visible copy.
- **A field's error is tied to the field and stated in text.** *Why:* 3.3.1 Error Identification (A) requires the error to be identified and described in text; red alone fails 1.4.1. Link the message with `aria-describedby` pointing at its id, set `aria-invalid="true"` on the field, and keep hint text in the same `aria-describedby` list. *Check:* with a screen reader, focusing the field reads its label, then the error.
- **An async result the user did not move focus to is announced through a live region.** *Why:* 4.1.3 Status Messages (AA): "Saved", "3 results", "Upload failed" must reach a screen reader without moving focus. Use `role="status"` (polite) for results and `role="alert"` for errors, on a container **present in the page before** the text is inserted; a region created together with its message is often not announced. Toast libraries usually do this; check that yours does.

## Motion and language

- **Motion respects `prefers-reduced-motion`.** *Why:* parallax, large slides and zooms trigger vestibular symptoms; 2.3.3 (AAA) asks that motion from interaction can be turned off, and the OS setting is how users ask. Wrap non-essential animation in `@media (prefers-reduced-motion: no-preference)`, or reduce it under `reduce`. Anything that moves for more than 5 seconds on its own needs a pause (2.2.2, A). *Check:* turn on reduced motion in the OS and walk the changed screens.
- **The document declares its language, and a passage in another language declares its own.** *Why:* 3.1.1 (A) and 3.1.2 (AA): a screen reader picks its voice and pronunciation from `lang`; French read with an English voice is unintelligible. Set `<html lang>` from the active locale at runtime (not a hard-coded value in `index.html` when the app switches language), and put `lang` on a mixed-language passage (a language switcher's "Français" label, a quoted title). *Check:* inspect `<html lang>` after switching language.
