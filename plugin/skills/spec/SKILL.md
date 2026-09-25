---
description: Build or refresh the product spec from the codebase — a PO-level, feature-by-feature account of what the product does.
name: spec
argument-hint: "[target] [options]"
disable-model-invocation: true
model: opus
allowed-tools: Bash(esq *)
effort: medium
---
Invocation input (may be empty): `$ARGUMENTS`. When present, `$0` is the first positional argument and `$1` the second.

You are producing or refreshing a product specification document. The audience is a product owner — someone who needs to understand what the product does, who uses it, and what the rules are. No architecture, no stack, no implementation details.

## Announce, before anything

<!-- announce-open:start -->
**Announce in one line, then keep working in the same response.** Print the line below before any tool call, with nothing of your own above it — and never end your response on it: the run's first tool call follows in that same response. A bound named after the spending is a bill.

> `/esq:spec — refreshing docs/SPEC.md. Bound: no subagents, at most 4 questions per round, one file written.`

If a pass would exceed it, stop at the bound and say what you did not cover. The resolved target lands in the second line, at the end of preflight.
<!-- announce-open:end -->

The mining pass is where this command goes quiet for minutes. Naming what it will read is what tells the user it is working rather than stuck.

## Preflight

1. Read `CLAUDE.md` at the project root if present — gives you the product name and high-level context.
2. Check whether `docs/SPEC.md` exists.
   - If it does: this is a **refresh**. Read it in full. Note the existing features list and the `<!-- last-spec: YYYY-MM-DD @ <commit> -->` marker — its date scopes which plans are new since the last pass (and it's what `/esq:arch` and `/esq:status` read to report spec staleness); a marker written before the commit existed carries the date alone, and reads the same way here.
   - If it doesn't: this is a **first run**.
3. Read `docs/DECISIONS.md` if it exists — scan entries with `**Scope:** prod` or `**Scope:** func`. These are business rules and product choices that belong in the spec.
4. Note today's date in YYYY-MM-DD format, and **the commit you are mining**: `git rev-parse HEAD`, once, here, chained into a call you already make. That full commit is what the marker records — the existing tree this spec describes, never the refresh commit this run will make, which does not exist yet and is never amended in.
5. Fetch `AskUserQuestion`: call `ToolSearch "select:AskUserQuestion"`. Needed for the changed-rule interrogation on a refresh. Continue without it — ask in plain text instead.
6. **Announce the resolved target** — the second line, once preflight has settled what the first one could not name:
   <!-- announce:start -->
   > `<First run | Refresh since YYYY-MM-DD> — <N> features already documented.`
   <!-- announce:end -->

   This is the free moment to be redirected — the target is on screen before anything has been spent on it.

## Mine the codebase

Read the codebase to identify user-facing features. Focus on observable behavior, not implementation:

- **Entry points:** routes, pages, navigation items, CLI commands, API endpoints — each one is a potential feature or sub-feature.
- **Domain entities:** models, schemas, types — what are the core objects the product manages?
- **Completed plan phases:** scan `docs/plans/` for plan files whose `## Execution log` contains `completed` entries. The phase names and goals describe what was shipped.
- **Business rules:** look for validation logic, permission checks, state machines, conditional flows — these become "Règles métier" in the spec.

Investigate proportionally. You're not reading the full codebase — you're reading what reveals product behavior. Routes and their handlers, model validations, page-level components. Stop when you have a clear picture of each distinct feature.

Group findings into features. A feature is something a user does or gets value from — not a module, not a component.

## Draft the spec

### Structure

```markdown
# Spec — <Product Name>
<!-- last-spec: YYYY-MM-DD @ <full commit from preflight> -->

> Ce document décrit ce que le produit fait, du point de vue d'un product owner. Il est généré et mis à jour par `/esq:spec`.
> Dernière mise à jour : YYYY-MM-DD

## Vue d'ensemble
2-3 sentences: what is this product, who is it for, what core problem does it solve.

## Fonctionnalités

### <Feature Name>
**Résumé:** One sentence — what this feature does.
**Utilisateurs:** Who uses it (role or persona).
**Fonctionnement:** 2–4 sentences describing the behavior from the user's perspective. No code. No component names. Observable behavior only.
**Règles métier:**
- Key constraint or business rule
- Edge case or limit the user would care about
- (Only include rules that matter to a PO — skip purely technical invariants)
**Décisions liées:** `D-<slug>` (or a legacy `D-NNN`) if a DECISIONS.md entry directly explains why this feature works this way. Omit if none.

[repeat for each feature]
```

### Writing rules

- Write in the product's working language (French if the project is in French, English otherwise).
- One feature per section. Sub-features can be nested under a parent if they're not independently meaningful.
- "Fonctionnement" must be readable by someone who has never seen the code. If you catch yourself naming a component or a table, rewrite it.
- "Règles métier" should be things that would surprise or constrain a new team member — not obvious behavior.
- Keep it tight. A feature that takes three sentences to describe is better than one that takes ten.
- If a feature's behavior genuinely can't be determined from the codebase (dead code, incomplete, hidden behind a flag), note it as `**Statut:** Incomplet — comportement non confirmé` instead of guessing.

## Refresh mode (existing SPEC.md)

Compare the mined feature list against the existing spec. Four cases, and the third is the one that matters:

- **New features** (in codebase, not in spec): add them.
- **Unchanged features**: leave them as-is. Don't rewrite what's already accurate.
- **A documented `Règle métier` the code no longer honors** — do NOT absorb this as an update. Code alone cannot distinguish an intended change from a regression. Collect the disagreement and resolve its authority through "Confirm before writing" before changing that rule. Intended → rewrite the rule and note it `<!-- modifié YYYY-MM-DD : <ancienne règle> → <nouvelle> -->`. Not intended → **leave that rule exactly as it was**, and report the regression; do not undo unrelated settled work.
- **Removed features** (in spec, no longer in codebase): same treatment — a feature that vanished is either a retirement or an accident. If confirmed retired, mark `**Statut:** Retiré — YYYY-MM-DD` rather than deleting, so the history survives.

Non-rule changes — wording, a clearer `Fonctionnement`, a feature that gained a step — just update, with `<!-- mis à jour YYYY-MM-DD : <what changed> -->` above the section. The interrogation is for rules and disappearances only; asking about every prose tweak would drown the questions that matter in noise.

## Confirm before writing

**Changed rules and vanished features come first.** Reuse answers and applicable authority already in the mandate or cited decisions; a decision's Active label or the code alone is not authorization. Cite what settles this specific change. Only a missing product choice earns a question, before changing the affected text:

> "`<Feature>` — la spec dit *<règle documentée>*. Le code fait *<ce qu'il fait maintenant>*. Voulu ?"

Options: "Voulu — mets la spec à jour" · "Pas voulu — c'est une régression, laisse la spec et signale-le" · "Je ne sais pas — montre-moi où"

Batch at most 4 per `AskUserQuestion` call. Neither the spec nor the code settles current intent by itself. If `AskUserQuestion` is unavailable, ask in plain text and wait for that choice; continue independent settled work.

**After "Je ne sais pas — montre-moi où":**

- Show the documented rule and the observed behavior with precise file/section or line links, the relevant input/output when available, and their concrete consequence for the user. Distinguish an executed observation from a source reading; name what neither establishes. Reuse the evidence already collected; investigate only the missing fact within the announced bound.
- Evidence is not consent. If existing authority settles intent, cite it and proceed without asking again. Otherwise ask only the remaining choice, in user terms: adopt the observed rule or retain the documented rule and report the regression. Offer deferral when the user still cannot decide; do not repeat "Voulu ?" or the same evidence loop.
- Still unknown, deferred, or unanswered → keep the disputed text unchanged, label the item **unresolved**, and name the missing intent or evidence and the exact choice needed to resume. Never infer retirement, approval or a regression from uncertainty. Preserve settled answers and edits; on resume, revisit only this item and facts changed since the cited evidence.

**Write settled, independent changes — do not ask permission for the rest.** An unresolved item holds only edits that depend on it. Keep its rule and the existing freshness marker unchanged; report a partial refresh and what remains unexamined. With no settled edits, make no write or empty commit. A full refresh marker is earned only after all disagreements are settled and the announced scope covers the document.

Write it, commit it, and report — the steps are below. A correction after the fact costs the user exactly what answering would have, minus the wait.

## Write and commit

1. Ensure `docs/` exists.
2. Write `docs/SPEC.md` with the confirmed content.
3. For a complete refresh only, set the marker on the second line to today's date and the commit preflight read: `<!-- last-spec: YYYY-MM-DD @ <full commit> -->`. Never shorten the commit. A partial refresh preserves the existing marker and document-wide update date (or leaves them absent on a first run); date its settled section edits only. Without a complete marker, `esq projections` cannot certify freshness. Freshness survives exactly the bookkeeping a refresh or a landing makes — this file, `CLAUDE.md`, `docs/ARCHITECTURE.md`, Markdown under `docs/plans/`, `docs/BACKLOG.md` — so a same-day `/esq:arch` before or after this run leaves both fresh.
4. `git add docs/SPEC.md`
5. `git commit -m "spec: <first run | refresh YYYY-MM-DD | partial refresh YYYY-MM-DD> (<N> features)"`

<!-- conclusion:start -->
**Your conclusion is three zones, in this order, and nothing else.** The reader wants two facts — did it work, and does it need me — before any detail.

**1 · The headline.** One line, first, no preamble above it:

> `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`

`✔` refresh complete, nothing needs the user · `⚠` partial or unresolved · `✖` you could not do your job. Drop `NEEDS YOU` when nothing does, and never soften the glyph: one open gate makes the whole run `⚠`.

**2 · What needs you.** Only what the user still has to settle — never a notice, and never work this command could do itself. One short ask per numbered line, action first, an executable one carrying its exact command in backticks. A genuine product choice takes the 🔴 option-set shape; a manual verification is copied verbatim with its starting state bracketed at the front. Absent whenever the headline is `✔`.

**3 · What happened.** One line per fact, never a sentence: glyph, label, value, evidence in its own column.

> ```
> ✔ fixed       6 items            a1b2c3d..e4f5a6b
> ○ still open  1 🟡               docs/plans/webhooks-fixes.brief.md
> ○ not run     spec · CLAUDE.md refresh
> ```

`✔` happened · `○` did not, by design · `✖` failed. **A fact with nothing to report collapses or disappears** — never a line reading `None.`, and several unremarkable no-ops become one `○ clean  <what you checked>`. But a no-op the reader would assume happened keeps its line — `○ not run  <what, and why>` — because silence there claims everything ran.

Then `→ Next`, last and alone: the first executable ask's exact command, or `pick an option in <n>, then <the command that resumes>`, or the one command that runs next.

**Nothing outside the three zones.** No preamble, no closing observations, no invented heading.
<!-- conclusion:end -->

## Conclude

**Headline:** `<glyph>  spec — <first run | refresh | partial refresh> · <N> features · <elapsed> · NEEDS YOU (<n>)` — `⚠` on any regression or unresolved item; never announce a complete success while one remains. An evidence gap is reported as a diagnosis, not counted as a user choice.

**Zone 2:** the remaining product choices and confirmed regressions. For an unresolved choice, name the rule, link the evidence and ask only what remains undecided, including deferral; no executable `do:` may pretend it is settled. For a confirmed regression, capture the rule it breaks, where, and one `do:` that runs as written (`/esq:backlog`, or `/esq:plan` when substantial). Do not fix regressions here.

**Zone 3:** `added`, `updated` (with what changed), `retired` — an empty one disappears — then the commit line, its evidence column carrying the undo. A partial run also names unresolved evidence gaps, retained rules/marker and uncovered scope; never label them verified or retired.

```
⚠  spec — refresh · 14 features · 4m02s · NEEDS YOU (1)

  1  Capturer la régression Panier — le code n'expire plus (spec : 30 min)   src/cart/ttl.ts
     do: /esq:backlog Cart TTL no longer enforced — spec says 30 min

  ✔ added      2    Factures · Remboursements
  ✔ updated    1    Panier (a gagné une étape)
  ✔ committed  spec: refresh 2026-08-18 (14 features)   a1b2c3d · undo: git revert a1b2c3d, or name a feature

→ Next: /esq:backlog Cart TTL no longer enforced — spec says 30 min
```

`→ Next` resumes the first unresolved choice with its retained evidence, or names the missing evidence to obtain; otherwise it is the `/esq:backlog` capture when regressions exist, or `/esq:spec` again. A deferred item waits for new intent/evidence, not a fresh round of the same questions.

## Constraints

- Do NOT run this automatically — it is always user-triggered.
- Do NOT spawn subagents — the mining pass is one reader following entry points, and a fleet would each re-derive the same feature list. The announced bound says **no subagents**.
- Do NOT document architecture, stack choices, or internal module structure. That belongs in `CLAUDE.md`.
- Do NOT copy from DECISIONS.md verbatim — translate decisions into plain behavioral descriptions.
- Do NOT invent features that aren't in the codebase. If you're unsure whether something is live, say so.
- One file. Do not split into multiple spec files unless the user explicitly asks.
