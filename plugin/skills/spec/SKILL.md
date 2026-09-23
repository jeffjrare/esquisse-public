---
description: Build or refresh the product spec from the codebase — a PO-level, feature-by-feature account of what the product does.
name: spec
argument-hint: "[target] [options]"
disable-model-invocation: true
model: opus
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
- **A documented `Règle métier` the code no longer honors** — do NOT absorb this as an update. A rule that changed is either a product decision nobody wrote down, or a regression nobody noticed, and **the two are indistinguishable from the code**. Absorbing it silently makes the spec agree with a bug and destroys the only record that the behavior ever differed. So: collect these, and put them to the user as a question before writing anything (see "Confirm before writing"). Intended → rewrite the rule and note it `<!-- modifié YYYY-MM-DD : <ancienne règle> → <nouvelle> -->`. Not intended → **leave the spec exactly as it was**, and report it as a regression to fix; the spec is right and the code is wrong.
- **Removed features** (in spec, no longer in codebase): same treatment — a feature that vanished is either a retirement or an accident. If confirmed retired, mark `**Statut:** Retiré — YYYY-MM-DD` rather than deleting, so the history survives.

Non-rule changes — wording, a clearer `Fonctionnement`, a feature that gained a step — just update, with `<!-- mis à jour YYYY-MM-DD : <what changed> -->` above the section. The interrogation is for rules and disappearances only; asking about every prose tweak would drown the questions that matter in noise.

## Confirm before writing

**Changed rules and vanished features come first, one question each.** Ask before showing the draft — the answers change what the draft says:

> "`<Feature>` — la spec dit *<règle documentée>*. Le code fait *<ce qu'il fait maintenant>*. Voulu ?"

Options: "Voulu — mets la spec à jour" · "Pas voulu — c'est une régression, laisse la spec et signale-le" · "Je ne sais pas — montre-moi où"

Batch at most 4 per `AskUserQuestion` call. Never resolve one by assuming the code is right: the spec is what someone decided the product should do, and the code is only what it currently does. If `AskUserQuestion` is unavailable, ask in plain text and wait.

**Then write the file — do not ask permission for the rest.** Once the changed rules are settled, everything else in the spec is derived from the codebase you just read, and it is committed to git. Showing a full draft and waiting for "looks good" is a session spent on a question whose answer you already have.

Write it, commit it, and report — the steps are below. A correction after the fact costs the user exactly what answering would have, minus the wait.

## Write and commit

1. Ensure `docs/` exists.
2. Write `docs/SPEC.md` with the confirmed content.
3. Set the marker on the second line to today's date and the commit preflight read: `<!-- last-spec: YYYY-MM-DD @ <full commit> -->`. Never skip it, and never shorten the commit — without the date, `/esq:arch` and `/esq:status` can't tell whether the spec has fallen behind the code; without the full commit, `esq projections` cannot prove the spec still describes `HEAD`, and `/esq:land` reports it as not fresh. Freshness survives exactly the bookkeeping a refresh or a landing makes — this file, `CLAUDE.md`, `docs/ARCHITECTURE.md`, Markdown under `docs/plans/`, `docs/BACKLOG.md` — so a same-day `/esq:arch` before or after this run leaves both fresh.
4. `git add docs/SPEC.md`
5. `git commit -m "spec: <first run | refresh YYYY-MM-DD> (<N> features)"`

<!-- conclusion:start -->
**Your conclusion is three zones, in this order, and nothing else.** The reader wants two facts — did it work, and does it need me — before any detail.

**1 · The headline.** One line, first, no preamble above it:

> `<glyph>  <command> — <your own counters> · <elapsed> · NEEDS YOU (<n>)`

`✔` nothing needs the user · `⚠` something does · `✖` you could not do your job. Drop `NEEDS YOU` when nothing does, and never soften the glyph: one open gate makes the whole run `⚠`.

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

**Headline:** `<glyph>  spec — <first run | refresh> · <N> features · <elapsed> · NEEDS YOU (<n>)` — `⚠` on any "pas voulu" answer, `✔` otherwise.

**Zone 2 is the "pas voulu" regressions, and nothing else** — numbered and action first: capture the regression, the rule it breaks, where, and one `do:` that runs as written (`/esq:backlog`, or `/esq:plan` when substantial). The spec was left untouched for each — a change nobody decided. Do not fix them here.

**Zone 3:** `added`, `updated` (with what changed), `retired` — an empty one disappears — then the commit line, its evidence column carrying the undo.

```
⚠  spec — refresh · 14 features · 4m02s · NEEDS YOU (1)

  1  Capturer la régression Panier — le code n'expire plus (spec : 30 min)   src/cart/ttl.ts
     do: /esq:backlog Cart TTL no longer enforced — spec says 30 min

  ✔ added      2    Factures · Remboursements
  ✔ updated    1    Panier (a gagné une étape)
  ✔ committed  spec: refresh 2026-08-18 (14 features)   a1b2c3d · undo: git revert a1b2c3d, or name a feature

→ Next: /esq:backlog Cart TTL no longer enforced — spec says 30 min
```

`→ Next` is the `/esq:backlog` capture when regressions exist; otherwise `/esq:spec` again — they control the cadence.

## Constraints

- Do NOT run this automatically — it is always user-triggered.
- Do NOT spawn subagents — the mining pass is one reader following entry points, and a fleet would each re-derive the same feature list. The announced bound says **no subagents**.
- Do NOT document architecture, stack choices, or internal module structure. That belongs in `CLAUDE.md`.
- Do NOT copy from DECISIONS.md verbatim — translate decisions into plain behavioral descriptions.
- Do NOT invent features that aren't in the codebase. If you're unsure whether something is live, say so.
- One file. Do not split into multiple spec files unless the user explicitly asks.
