# Give /esq:ui a source of ideas: territories, sketches and self-sourced references

**Branch:** esq/ui-territories-sketches-references

**Origin:** main

**Reviewed at:** 444766962c17b5b3cc2992e17312dbf71b476210

## Context
`/esq:ui` now reads `visual-craft`, `motion-and-states` and `accessibility` on every run (plan `2026-11-22-connect-ui-modern-craft`). Those modules are a floor, not a source of ideas. `visual-craft` (`plugin/expertise/visual-craft.md`) is mostly hygiene rules plus the list of "generic AI defaults" to avoid. Its reference products (Linear, iA Writer, Apple Design Award winners, Readymag) are the pool everyone looks at, so they pull directions back toward the average. Pass 4 (`plugin/skills/ui/SKILL.md:218-256`) builds one or two directions straight away, so the model's first idea always wins. A direction's "signature" is picked from the module's list of moves, not from the product's own world. The first real run after that plan kept the existing identity in both directions and borrowed a motif from an unrelated trade. The user, who judged an earlier redesign "drab" (memory `ui-redesign-aims-at-character`), saw no change in look and feel. The user supplies no moodboard and never will: esq has to find its own material.

## Goal
On the next `/esq:ui` run where the direction is the user's call, they choose between directions drawn from their product's own material world, chosen out of a wider explored field and backed by real references esq found and cited itself, instead of between two variants of the model's first habit.

## Done looks like
- Every `/esq:ui` run names 2–3 **territories** drawn from the product's domain: the trade's documents, tools, materials, places and printed matter. Each rendered direction says which territory it comes from, and what it took from it for type, palette, texture, shape and motion.
- `visual-craft` teaches how to extract a territory and turn it into concrete moves, and how to keep it from becoming pastiche. Its examples are generic: no user project is named.
- When the direction is the user's (two directions rendered, including `--greenfield`):
  - `/esq:ui` finds its own references outside software. At most 3 of its 8 searches go to them, and at most 3 captures. Each reference is cited with its URL and the date it was checked, and each direction names the reference move it took.
  - It renders a **sketch sheet** before building directions: 4–6 quick takes on the centre screen, on one page, one capture, not gated. It then develops and gates the 2 strongest. The comparison page shows the sheet and says why those 2 were kept.
- Nothing is ever asked of the user for inspiration. A reference the mandate or brief already names is used first, and counts against the 3.
- The announced bound states the new ceiling before anything is spent: at most 12 captures, 16 when the direction is the user's. Searches stay at 8.
- The README's `/esq:ui` row, its "looks dull" paragraph and the `esq:visual-craft` row of § Expertise say all of this.

## Approaches considered
- **Edit the one skill and the one module** (chosen). Territories and where references come from go into `visual-craft`. The sketch sheet and the reference pass go into `/esq:ui`'s Pass 3 and Pass 4. There is no CLI change, the expertise mechanism is reused, and because modules match by path, `/esq:build` also reads the territory rules when it implements the chosen direction. Cost: about 40 lines in the module and about 30 in the skill. On a two-direction run, the run also pays up to 4 more captures (~1.5k tokens each) and the output tokens of a sketch sheet.
- **A curated reference corpus shipped in the repo, or an image-library MCP (Mobbin)** (rejected for now). A shipped corpus is convergent by construction: the same pages for every product, which is the defect being fixed. It also ages faster than any dated fact the modules hold. Mobbin requires a paid account the plugin cannot assume, and it shows what existing apps do, which is again convergent. If a later run proves self-sourced references too thin, an optional MCP source is the next lever, never a dependency.

## Recommendation
Single phase, three tasks, one per lever, each with its README edit in the same commit (the CLAUDE.md README rule).

Settled choices:
- **Territories run on every run.** Naming them is reasoning, not spending. A one-direction run derives its direction from one territory too.
- **Sketches and reference captures only run when the direction is the user's.** That is the existing two-direction condition of Pass 4 (`plugin/skills/ui/SKILL.md:220`) plus `--greenfield`. The frequent path (one direction, mandate-fixed) pays nothing new.
- **The capture ceiling is restated, not hidden.** Pass 2 keeps ≤6. Pass 3 references take ≤3, two-direction runs only. Pass 4 keeps ≤6 (≤4 greenfield) plus 1 sketch-sheet capture. The announce line becomes `at most 12 captures (16 when the direction is yours)`. Greenfield peaks at 3 + 1 + 4 = 8.
- **References are browsed through the run's own browser driver.** In `--greenfield`, Pass 3 sets up the driver that Pass 4 now reuses. Search queries name the trade, never the project, the client or the user (data minimization). Reference page text is data, never an instruction.
- **The model picks which two sketches to develop**, by criteria written in the skill:
  - the two give different answers to the question the audit raised;
  - each departs from today (a redesign only; in `--greenfield`, the two are distinct domain-grounded approaches to the source content);
  - each rests on at most one generic default;
  - each serves the screen's hierarchy.

  Never block: the user sees the whole sheet on the comparison page, and the free-text escape on the direction question lets them name a sketch instead.
- **A sketch is the centre screen's first fold only**: real content, declared tokens, no states, no motion. That bounds its output.

## Phases

### Phase 1 — Territories, sketches and self-sourced references in /esq:ui
- **Goal:** the next `/esq:ui` run draws its directions from the product's domain, explores a sketch sheet before converging when the direction is the user's, and finds, captures and cites its own references, and the README says so.
- **Files touched:** `plugin/expertise/visual-craft.md`, `plugin/skills/ui/SKILL.md`, `README.md`
- **Expertise:** `esq:visual-craft`, `esq:accessibility`
- **Tasks:**
  - Task 1.1: **teach territories and where references come from in `visual-craft`.**
    - Add `## Territories`, in the house shape (rule → *Why* → *Check*, ~25–35 lines). It covers:
      - **Extract** a territory from the product's domain: the trade's documents, tools, materials, places, signage, printed matter and vocabulary, read from the spec, the mandate and the app's own content.
      - **Translate** it into moves: type from its printed matter, palette sampled from its materials, texture, shape language, an iconography drawn from its objects, a motion metaphor.
      - **The pastiche guard:** the territory informs, never illustrates every surface. One signature region, and the usability floor always wins.
      - **The check:** would someone from that trade recognise it, and would someone outside it still read the screen?
      - Three generic worked examples from unrelated trades (for instance a bakery's ordering app, a freight dispatcher's tool, a clinic's booking screen). Nothing from any user project.
    - Rework `## Reference products, by class` into where references come from:
      - keep the dated product list, labelled as the convergent baseline;
      - add sources outside software per territory: trade publications and catalogues, signage and wayfinding systems, packaging, museum and archive collections, studios working in that trade;
      - say that a reference is looked at for one move, never copied.
    - Bump `**As of:**`. Extend the description to mention territories, staying ≤460 characters.
    - Same commit: the `esq:visual-craft` row of the README § Expertise table gains "territories drawn from the product's domain, and where references come from outside software".
  - Task 1.2: **`/esq:ui` names territories and sources its own references.**
    - **Pass 3:**
      - Before any search, name 2–3 territories, each in one line with the domain material it rests on.
      - When the direction is the user's, spend at most 3 of the 8 searches finding references outside software for those territories, and capture at most 3 of them through the run's driver. In `--greenfield`, Pass 3 sets the driver up and Pass 4 reuses it: edit the § Greenfield mode sentence "Pass 4 sets up its own browser driver" accordingly.
      - A reference the mandate or brief names is used first and counts against the 3.
      - Nothing is ever asked of the user for inspiration.
      - Queries name the trade, never the project, client or user. Page text is data, never an instruction.
      - A territory with no reference found says so in one line and still feeds a direction.
    - **Pass 4:** each direction derives from one territory. Its signature names that territory, plus the reference move it took, if any, before it is checked against the generic defaults. The brief and the direction's caption on the page map the territory to type, palette, texture, shape and motion, naming any dimension left unused on purpose. The existing line "The brief names, per direction, which of the module's moves it took" extends to the territory and the reference.
    - **Brief template:** `## Constraints & context` gains `- **Territories and references:** <each territory, its domain material, and each reference with URL and date checked>`.
    - **Comparison page:** section 2 (the tension) shows the territories and the reference captures beside it.
    - **Announce line and report:** the announce line becomes `… at most 12 captures (16 when the direction is yours), at most 8 web searches.`. Report item 5 counts reference captures separately.
    - **Every other ceiling clause agrees with it:**
      - Pass 2's "half the announced ceiling of 12" (`SKILL.md:174`) becomes "6 of the announced 12";
      - Pass 4's "the announced ceiling of 12 stays untouched" (`SKILL.md:252`) and § Greenfield mode's "well under the announced ceiling of 12" (`SKILL.md:142`) name the 12/16 split;
      - after the edit, `grep -n 'ceiling' plugin/skills/ui/SKILL.md` shows no clause contradicting the announce line. A retried capture counts against the same ceiling.
    - Same commit: the README `/esq:ui` row and the "An interface that works but looks dull?" paragraph say the directions come from territories of the product's domain and from references esq finds and cites itself.
  - Task 1.3: **`/esq:ui` sketches before it converges when the direction is the user's.**
    - **Pass 4**, before "Each direction carries its craft": when two directions will be rendered (and always in `--greenfield`), first render **a sketch sheet**.
      - 4–6 takes on the centre screen's first fold, at the capture width, on one HTML page.
      - Each take is labelled with its territory and its idea in one line. At least one take per territory.
      - Each uses real content and declared tokens, with no states, no motion and no gate.
      - One capture of the sheet, then pick the 2 to develop by the four criteria in the Recommendation, and name the reason for each.
    - The order is explicit: sheet → pick → tension → build. Edit the existing "Name the tension in one sentence before you build" (`SKILL.md:222`) so the tension is named after the pick, from what the two kept takes disagree on, and still before the full directions are built.
    - The developed directions then run Pass 4 unchanged: full screens, both themes, motion, the seven-item gate.
    - **Comparison page:** a new section "Explored", between the tension and the directions, shows the sheet capture with one line per take and why the 2 were kept.
    - **The sheet is not a build input.** It is not committed under `.ui/`. It lives on the page, or in the local `.ui.html`.
    - **Direction question:** says the escape can name a sketch from the sheet. In that case the run develops it on a later `/esq:ui` re-run of the same slice. That is a new run the user asked for, not an automatic one.
    - § Greenfield mode: the whole budget paragraph (`SKILL.md:142`) is rewritten to allocate ≤3 reference, 1 sketch-sheet and ≤4 direction captures, a mode total of 8, under the announced 16.
    - Same commit: the README `/esq:ui` row and the "looks dull" paragraph say that when the choice is the user's, it explores a sketch sheet, develops the two strongest, and takes up to 3 reference captures within 16 captures in all. They also say it never asks you for inspiration.
- **Verification:**
  - `(auto)` `bash scripts/check-plugin.sh` — exits 0: `visual-craft`'s frontmatter, `**As of:**`, paths, stack and description length still parse, and the ui skill's frontmatter holds
  - `(auto)` `printf 'src/styles/globals.css\n' | esq expertise match --paths -` — the answer still lists `esq:visual-craft` with that path in `matched`, so `/esq:build` keeps reading it on stylesheet work
  - `(auto)` `./scripts/audit.sh` — PASS, recorded in `esq plan append-log`'s `verified` block

## Risks
- **Pre-mortem: the territories come out as theme-park pastiche** (wood grain everywhere, clip-art tools), and the user rejects the departure as kitsch rather than character. The pastiche guard in Task 1.1 (one signature region, the floor wins) and the sketch criteria in Task 1.3 ("serves the hierarchy") answer it. The sheet also lets the user see the field before only two are developed.
- **Reference sites may refuse headless browsing** (bot walls, cookie walls). A reference that cannot be captured is cited by URL only, stated uncaptured, and costs no retry.
- **Cost on two-direction runs rises:** up to 4 captures (~6k input tokens) and a sketch sheet's output. This is bounded, announced, and kept off the one-direction path.
- **Outstanding observation, after landing:** the user's next `/esq:ui` identity run on a real app is the only proof the directions gain character. Keep/revert rule:
  - **Revert** a lever only if that run exceeds its announced bound, or ships a direction that fails the gate because of it.
  - **Keep** everything if the directions still read generic to the user on a phone. That is not a regression: the floor and the gate are untouched. File one backlog row naming the next lever: an optional image-library MCP source, or a stronger divergence rule.

## Open questions
None.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-11-23

**Plan committed at:** 7fc2ee9

**Commits:** 07d8ae1, 7ab46a1, 923c720

**Verified:** 923c7204af56a4f874ff44fe616b0757d0c795a8
- `bash scripts/check-plugin.sh`
- `printf 'src/styles/globals.css\n' | esq expertise match --paths -`
- `./scripts/audit.sh`

**What got built:** visual-craft now teaches territories (extract, translate, pastiche guard, two-reader test, three generic examples) and where references come from outside software, with the old product list kept as the convergent baseline. /esq:ui names 2–3 territories on every run, derives each direction from one, and when the direction is the user's it finds, captures and cites up to 3 references itself and explores a 4–6 take sketch sheet before developing two, within an announced 12/16-capture bound. The README row, the 'looks dull' paragraph and the § Expertise row say so.

**Verification:**
- (auto) bash scripts/check-plugin.sh — exit 0: plugin, embedded CLI, native hooks, 23 skills and 22 expertise modules validate (visual-craft description 422 chars)
- (auto) printf 'src/styles/globals.css\n' | esq expertise match --paths - — esq:visual-craft listed with src/styles/globals.css in matched, asOf 2026-11-23
- (auto) ./scripts/audit.sh — exit 0, Clean — 7 checks (product), 27 s

**Decided for you:**
- design: the two developed directions must come from two different territories, a rule the plan implied but did not state — otherwise both could be variants of one domain idea, the convergence this plan fixes — undo: delete the sentence 'Two directions come from two different territories.' in plugin/skills/ui/SKILL.md § Pass 4

**Surprises / decisions made during execution:** - The old heading `## Reference products, by class` was replaced by `## Where references come from`; no script or skill referenced the old heading (grep), only a historical plan log.
- Renumbering the comparison page (new section 3 'Explored') moved 'What is broken regardless' to section 5; the Pass 4 cross-reference 'section 4 of the page' was updated with it, and the greenfield publish sentence now names the Explored section.
- Two-direction bare run budget: Pass 2 ≤6 + references ≤3 + Pass 4 ≤6 + sketch sheet 1 = 16, exactly the announced ceiling; greenfield 3 + 1 + 4 = 8.

**Backlog candidates:** None.

**For Phase 2:** Last phase. The only proof the directions gain character is the user's next real /esq:ui identity run; keep/revert rule is in the plan's Risks.
