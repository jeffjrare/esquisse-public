<!-- loaded-at: load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` before you write the phases -->
<!-- loaded-at: `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md`, which you MUST load before writing any phase that renders UI or declares a `(manual)` step -->
<!-- loaded-at: **A UI phase's states are tasks, not polish** — load `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` -->
<!-- loaded-at: The shape a `(manual)` step must take is in `${CLAUDE_SKILL_DIR}/references/screens-and-manual-steps.md` -->
## Screens, and the `(manual)` steps that prove them

Loaded when a phase of this plan renders UI or declares a `(manual)` step — and loaded at
that moment even if the plan started out backend-only and investigation widened it. A plan
whose every phase is backend and whose every step is `(auto)` never reads this file.

**The UI and the UX are part of the feature, not a layer on top of it.** A feature with a confusing flow or a blank error screen is an *unfinished feature*, not a finished one awaiting polish, and it gets the same effort as the logic behind it. See **Design discipline** below.

- **A UI phase's states are tasks, not polish** — see **Design discipline**.

## Design discipline

UI work is feature work — the same budget line as the logic behind it, never a polish line item that a later phase absorbs. The right-sizing audit trims generality; it never trims design. A feature nobody can figure out did not ship, and the implementer's default — a bare form, a spinner, an alert box — is what you get for every decision the plan leaves unmade.

So every phase that renders UI must answer the relevant points in its goal or tasks. Read the codebase first, then decide ordinary design details within the accepted outcome and constraints:

- **The system this screen belongs to.** Name the existing tokens, components, spacing scale, and typography it reuses — by their real names, from this codebase. A new one-off color, radius, shadow, or breakpoint needs a line saying why the existing one didn't fit. Consistency is most of what "designed" means: a screen that doesn't match the one beside it reads as broken, not as fresh.
- **Every state the screen can be in.** Empty (first-run and after-filtering are different screens), loading, error, partial, and the success moment — with what the user does *next* from each. "Loading" is a state that gets designed, not a hole where a spinner goes. The empty state is usually the most-seen screen in a new feature and the one most often left blank.
- **The feedback for every action.** For anything asynchronous or destructive: what the user sees immediately, how they know it worked, how they recover or undo it where applicable. For an action on a filtered, selected or paginated set, make its scope visible before it starts, keep that scope stable during the request, and preserve the user's work on failure. Choose the data boundary and retry behavior to support that interaction; a success message must not promise more than the response proves.
- **Reachable by everyone.** Keyboard path and visible focus, labels on controls, contrast that survives a bright room, touch targets a thumb can hit, and text that reflows. These are tasks in the phase that ships the screen — the separate accessibility pass later is the one that never happens.
- **What "good" looks like here**, in one line a `(manual)` step can be written against. "The list feels responsive" isn't checkable. "Results narrow within a frame of the keystroke, with no layout shift as rows drop out" is.

An unspecified label, layout, pending state or retry is design work to finish here, not an automatic return to `/esq:grill`. Propose the coherent flow, reuse existing components and carry the decisions into the tasks and observation steps. Only an unresolved choice that the entrypoint's **Resolve blocking decisions** rule assigns to the user earns a question; name the missing authority and its consequence. Missing code or an observation resource is investigated or planned, never passed off as a product preference.

### The shape a `(manual)` step takes

- **A `(manual)` step MUST name its starting state.** Auth status (logged out / logged in as which role), incognito or not, required fixtures or seed data, the exact entry point. A manual step without starting state is not executable by the next session or a tester. Bad: "check the checkout works." Good: "[logged out, incognito, fresh email] from `/signup`, …".
- **Write each `(manual)` step as one action-first line, its starting state bracketed at the front.** `[logged out, incognito] Open /signup, complete checkout, observe the dashboard badge` — never a paragraph. `/esq:build` relays that line verbatim into zone 2 when a phase pauses, so the shape the plan writes is the shape the user reads.
- **Establish the observation path before the step is declared — four links, each naming the resource that supplies it:** access (the concrete route, and the command or driver that reaches it), the starting state and what creates it, the user action on a control named by its visible label or role, and the observation as a result readable as text or state. Each link names an existing project resource, or one a task of this same plan creates — which need not exist before the build — or the link is written `uncovered: <what is missing>`. Writing the step so a browser-driving tool *could* execute it is not the same thing and never was: `/esq:build` probes for a driver (`/run`, Playwright, chrome-devtools) and uses one when it exists, and a step whose starting state nothing in the project can create still leaves the worker improvising the entire environment. Bad: "check the picker feels right." Good: "at `/`, the chip row shows 6 chips and the last is reachable by horizontal scroll."
- **Naming a tool supplies a link only where it covers this scenario.** A project `run`/`verify` skill, a `/run` recipe, a browser driver or a script that renders the artifact each supply the links they actually cover and no others: a skill that launches the app but cannot create the record the step observes leaves the state link uncovered, and a script that writes the output but reads nothing back off it leaves the observation link uncovered. Presence of a tool is not coverage of a link.
- **An uncovered link is closed by the smallest reusable complement, planned in the phase that needs it or before it** — a seed command, a fixture, a route a driver can reach, a reader for the result. **When every link is covered, add nothing — that is the ordinary case.** Never plan a complement for a scenario no phase of this plan observes: what this rule buys is the path this plan's own `(manual)` steps walk, and not one link more.
- **Establishing the path is never a PASS.** The path is how the observation will be obtained, never the observation itself — the worker's session may not hold the instrument this planning session probed with, and a complement that exists proves nothing about the result. The step is still observed at build time, by the worker or by the user.
- **Consolidate manual steps per screen.** Every separate step re-pays the cost of launching the app and reaching a starting state. Four steps that all begin `[same screen]` are one step with four observations — write them that way.
