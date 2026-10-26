# Fixes brief: Ship the second expertise batch: what the user sees and touches

Source: /esq:review on ship-expertise-batch-2, 2026-10-25
Reviewed at: f5da5fb

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- `esq:accessibility` states a false CSS fact as the reason to prefer `outline`: it says an outline "survives an ancestor's `overflow: hidden`, where a `box-shadow` ring is clipped". Both are ink overflow, and an ancestor with `overflow: hidden` clips both. A model applying the skill trusts the outline inside a card, table cell or scroll container with `overflow: hidden`, ships a focus indicator that is cut off (WCAG 2.4.7), and argues against the real fix when a reviewer raises it — `plugin/skills/accessibility/SKILL.md:23` — fix: replace "and survives an ancestor's `overflow: hidden`, where a `box-shadow` ring is clipped" with "and, unlike a `box-shadow` ring, stays visible in forced-colours (high-contrast) mode. An ancestor's `overflow: hidden` clips either one: inside such a container, draw it inward with a negative `outline-offset`" — verify: `! grep -n "survives an ancestor" plugin/skills/accessibility/SKILL.md && grep -n "outline-offset" plugin/skills/accessibility/SKILL.md && scripts/check-plugin.sh plugin`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
