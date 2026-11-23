# Fixes brief: Connect /esq:ui to modern UI craft

Source: /esq:review on connect-ui-modern-craft, 2026-11-22
Reviewed at: bcd2f72

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- Gate item 7(a) demands a hover change on every interactive element, but `esq:motion-and-states` requires hover styles only under `@media (hover: hover)`. When `/esq:ui` renders a phone-width direction in a driver session that emulates a touch device (Playwright `isMobile`/`hasTouch`, an MCP mobile preset), `(hover: hover)` is false, a forced `:hover` changes nothing, and a direction that follows the module fails the gate; the "fix and re-check" loop then pushes the model to drop the media gate, shipping sticky hover on phones, the defect the module names. — `plugin/skills/ui/SKILL.md:248` — fix: in item 7(a), add after "Press must also differ from hover.": "Hover is read with a fine pointer: when the session reports `(hover: none)`, a hover rule gated by `@media (hover: hover)` passes, and hover is not required of it." — verify: `grep -n 'hover: none' plugin/skills/ui/SKILL.md && bash scripts/check-plugin.sh`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
