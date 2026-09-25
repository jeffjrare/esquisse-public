<!-- loaded-at: load `${CLAUDE_SKILL_DIR}/references/corrective-input.md` -->

# Corrective planning input

<!-- shared:corrective-bound:start -->
**Two corrective plan generations.** Run `esq brief depth <brief-path>` before offering another plan; route off `verdict`, never count suffixes. `open` changes nothing. At `exhausted`, create no third-generation plan and offer no generic abandon/re-plan escape:

- Subject to unresolved 🔴 precedence, remaining 🟢 items → `/esq:fix <brief-path>`, then `/esq:review <resolved-plan>`. A bounded safe correction, including a prospective plan/document correction, consumes no new plan generation and needs no extra budget decision. Fix revalidates safety; neither an empty brief nor a recorded backlog row promises landing.
- Remaining 🟡/🔴 items → state the concrete unresolved outcome and the authority it needs. A failed check or missing proof is a diagnosis to investigate, not permission to weaken acceptance. Where accepting named debt is a real user tradeoff, offer `/esq:fix <brief-path> --accept <B-IDs>` only for existing rows matched to those findings, explaining what will stay unfixed. That choice records `Dropped`, never `Done`; it is not authorized by depth alone. Otherwise ask the actual scope/constraint decision, without promising an executable third plan.
- Never abandon a completed plan. `esq plan abandon` applies only to an explicitly selected unfinished plan when the user has decided not to build it; it does not dispose of findings or backlog promises.

Preserve every unresolved finding in the brief. A remaining item still blocks landing until its correction or explicitly authorized disposition is recorded; a clean review and the normal landing gates remain owed.
<!-- shared:corrective-bound:end -->

For `/esq:plan` answer here, before investigation. At `exhausted`, write no plan, create no branch and flip no backlog row; hand back the applicable correction/disposition route above. Resolve a plan target through `esq brief plan <brief-path>` when needed; never guess it.

