<!-- loaded-at: **This phase renders user-facing UI** → `${CLAUDE_SKILL_DIR}/references/ui.md` -->
## Building UI

Applies to any task that renders something a person looks at. The plan named the design; your job is not to re-decide it, and not to under-build it into a bare form with a spinner.

**Build from the direction's source, never from the comparison page.** When the task or the brief's `**Direction source:**` names a `docs/plans/…ui/<a|b>.html`, read the section of the screen you are building (`grep -n '<section id='` gives its range, then read only that range), and translate its layout, hierarchy, copy, states and motion into the codebase's own tokens and components. The `.ui.html` page or published URL is for choosing a direction; its embedded captures make it too big to read, so don't open it. When a design referent can't be read (missing, unreachable, or too big even one section at a time), build from the plan's written spec and record it in the log's Surprises as `design referent unread: <path> — <why>`, so review knows the screen was never checked against its mockup.

**Reuse before you invent.** Before writing a component, find what this codebase already has — the design tokens or theme file, the component library, the closest existing screen. Match its spacing scale, its type scale, its color roles, its interaction patterns. A hardcoded hex, px, or radius where a token exists is a defect, not a shortcut; it's how a design system dies one component at a time. If nothing fits and you must introduce a value, say so in the execution log's Surprises.

**Ship every state the plan named** — empty, loading, error, success — in the same commit as the happy path. They are not follow-up work. A screen that renders `null` while loading and throws on error is not the task done.

**Nothing silent.** Every async or destructive action gets immediate feedback and a way back: disabled-with-reason rather than dead, an error the user can act on rather than a console log, a confirmation or an undo before anything is destroyed.

**Keyboard, focus, labels, contrast.** Reachable and operable without a mouse, focus visible where it lands, every control labeled, contrast that holds up. Part of this task, not a later pass.

**Then look at it.** If a driver exists — the same probe the `(manual)` verification steps require, run once and reused — open the screen you just built and *look* — at each state, not just the happy one. Code that compiles and tests that pass say nothing about whether the thing is usable. If what you see is worse than what the plan described, that's a finding for the log, not something to quietly accept.

