# Ship the second expertise batch: what the user sees and touches

**Epic:** esq-decides-implementation-detail

**Branch:** esq/ship-expertise-batch-2

**Origin:** main

## Context
The first batch (`ship-mobile-expertise-skills`) shipped three `user-invocable: false` expertise skills, the guards that accept them (`check-plugin.sh`, `check-structure.sh`) and the loader (`esq expertise match`, called by `/esq:plan`, `/esq:build` and `/esq:review`). B-194 is the next batch, the screens a person uses: forms and their failure states, the design system, accessibility, French/English parity for Québec, and dates and time zones. Today that knowledge lives only in project skills: assets-prospection's `design-system`, `form-patterns` and `component-library` (the bodies of the last two point to `.specs/coding/design-system.md`), and events-tracker's `i18n` and the time-zone rules in its `backend-api`. Any other project starts from zero. The mechanism is already in place, so this unit only writes content: no CLI, guard or skill-prose change.

## Goal
In any project where esq is installed, Claude has generic, dated expertise on forms and failure states, design tokens, accessibility, FR/EN localisation for Québec, and dates and time zones. Inside esq flows it loads that expertise whenever a phase or a change touches a matching file.

## Done looks like
- A plan whose phase touches a form component, a `components/ui/` primitive, a locale file or a date helper names the matching `esq:` skill in that phase's `**Expertise:**`. `/esq:build` loads it before writing code, and `/esq:review` reviews against it, with no change to those commands.
- A phase that touches only `App.tsx` or a server entry point loads none of the five. Paths mark the domain; they are not a glob over the whole language.
- Each skill states each failure mechanism, why it bites and how to check for it. A remedy that depends on a stack choice (Tailwind, shadcn, i18next, Prisma) says which one.
- None of the five skills mentions assets-prospection, GoProsperia, events-tracker or Tamialog, or any of their decision slugs, backlog IDs, domains or file paths.
- Each skill opens with `**As of:**`, and every legal or standards fact (Charter s. 52.1, the WCAG version, Temporal browser support) carries its primary source and the date it was checked.
- "Every request ends in something visible" has one writer, `esq:forms-and-failures`. `esq:store-review` keeps only the reviewer's consequence and a pointer.

## Approaches considered
1. **Five content-only skills on the shipped mechanism (chosen).** One `plugin/skills/<name>/SKILL.md` each, in the shape of the first batch: frontmatter, `**As of:**`, `**Paths:**`, the 180-day staleness line, the "project skill wins" line, then rules each with its *why* and how to check it. *Benefit:* zero code, and the existing guards and loader cover them with no change. *Cost:* about 100 tokens of description per skill in every session (about 500 here, about 800 for the plugin's eight expertise skills). *Limit:* path matching cannot see intent. A phase that adds a date field to a form matches on the form, not the date, so the plan names `esq:dates-and-timezones` by judgment.
2. **One `ui-frontend` skill holding all five domains.** *Benefit:* one description instead of five. *Loses:* the whole body (about 40 KB, around 10K tokens) loads into any phase that touches one locale file. The loader's value is loading only what the files touch. B-195 already owns the question of moving the catalog into per-domain plugins to cut the standing cost.

## Recommendation
Approach 1.
- **Owning component** (ARCHITECTURE § `plugin/skills/<name>/SKILL.md`): skills own the guidance. The CLI and the guards stay untouched (`plugin/lib/cli.mjs:4617` onward: matching is pure string, segment-wise and case-sensitive, and `*` stays within one segment).
- **Paths are domain markers, never a language glob.** `*.tsx` or `*.ts` would load three skills (about 7K tokens) into every frontend phase. `*date*` or `*date.*` would match `update.ts`. Use directories and names that carry the domain, relying on case: `*Date*`, `*Form.*`, `locales/`, `components/ui/`, plus a directory marker wherever helpers live in a folder (`dates/`). Starting points that build refines:
  - design-system: `components/ui/`, `styles/`, `tailwind.config.*`, `components.json`, `*tokens*`, `globals.css`
  - forms-and-failures: `forms/`, `*Form.*`, `*-form.*`, `schemas/`, `*Dialog.*`, `api-client.*`, `http.*`
  - accessibility: `components/ui/`, `*Dialog.*`, `*Modal.*`, `*Menu.*`, `index.html`, `layouts/`
  - i18n-fr-en: `locales/`, `i18n/`, `i18n.*`, `messages/`, `*.po`, `fr.json`, `en.json`
  - dates-and-timezones: `*Date*`, `date.*`, `dates.*`, `dates/`, `*Time*`, `*time-zone*`, `*timezone*`, `timezones/`, `tz.*`
- **One writer per fact between the skills:**
  - Contrast pairs and the focus indicator belong to `accessibility`. `design-system` points to it from its token rules.
  - The request-ends-visible rule belongs to `forms-and-failures`. `store-review` keeps only its consequence, Play's "Broken Functionality" label, plus a pointer.
  - Locale-aware date and number formatting (`fr-CA`, money) belongs to `i18n-fr-en`. Instants, zones, local days and DST belong to `dates-and-timezones`.
- **Harvest sources:**
  - assets-prospection: `.claude/skills/{design-system,form-patterns,component-library}` and `.specs/coding/design-system.md` (tokens and the four roles, one global focus outline, sorting options by translated label, the dirty-state save header, empty and loading states, no theme flash before first paint).
  - events-tracker: `.claude/skills/i18n` (keys never literals, both locales in the same commit, the background caller's language, units and currency) and `backend-api`'s time-zone rules (a zone is a required parameter, validation that accepts `America/Montreal`, a local day computed in the owner's zone).
  - Only the generic mechanism is kept: no project token names, file paths or decision slugs.
- **Primary sources, checked by build before it sets `**As of:**`** (at most 3 searches per fact that changes a rule):
  - accessibility: WCAG 2.2 (W3C Recommendation) and the WAI-ARIA Authoring Practices.
  - i18n-fr-en: the Charter of the French Language (CQLR c. C-11), s. 52.1 and the Bill 96 amendments in force, and OQLF typography (non-breaking space before `:`, `;`, `!`, `?` and `%`, the `12 345,67 $` format, « guillemets »).
  - dates-and-timezones: MDN/TC39 for `Intl.DateTimeFormat` and `Temporal` support, and the IANA tz database.
- Each skill's body names a fact that is documented but not tested in a shipped project, as `capacitor-ios` did.

## Phases

### Phase 1 — Forms, design system and accessibility expertise
- **Goal:** in any esq project, Claude can consult `esq:forms-and-failures`, `esq:design-system` and `esq:accessibility`, and an esq phase that touches a form or a UI primitive loads them.
- **Files touched:**
  - `plugin/skills/forms-and-failures/SKILL.md`
  - `plugin/skills/design-system/SKILL.md`
  - `plugin/skills/accessibility/SKILL.md`
  - `plugin/skills/store-review/SKILL.md`
  - `README.md`
- **Expertise:** none. This phase writes it.
- **Tasks:**
  - Task 1.1: add `forms-and-failures`. It covers:
    - every request ends in something visible (a rejected `fetch` resolved to a network-error state in the shared client, proved against an unreachable API on a built app);
    - loading, error, empty and offline states;
    - a double submit;
    - the user's input kept after a failure, never cleared;
    - an unsaved-changes indicator and a save disabled while clean;
    - client and server validation, with the server's field errors mapped back to their fields;
    - focus moved to the first error;
    - options sorted by translated label with `localeCompare`, except for ordered sets;
    - create and edit built from the same parts.

    In the same commit, cut `store-review`'s generic rule (line 21) down to the reviewer's consequence and a pointer to `esq:forms-and-failures`. Its description trigger stays. Add the README `## Expertise` row.
  - Task 1.2: add `design-system`. It covers:
    - semantic tokens over a fixed shade, hex or `white`/`black`;
    - family roles (solid, soft, line, ink) and the soft-on-soft chip that disappears;
    - shadcn's `accent` alias trap, stated conditionally on shadcn;
    - Tailwind 4 with no JS config (`@theme`);
    - exemptions recorded with their reason in the checker;
    - a theme chosen before first paint (an inline script plus a cookie when two origins share it);
    - twin token files kept in step;
    - stock radius and shadow scales avoided;
    - self-hosted fonts under a strict CSP.

    Add the README row.
  - Task 1.3: add `accessibility`, from WCAG 2.2 and the APG. It covers:
    - one global focus outline, never per-component rings, and never `outline: none`;
    - focus not obscured by sticky headers (2.4.11);
    - 4.5:1 and 3:1 contrast checked as token pairs in both themes;
    - 24×24 px targets (2.5.8);
    - labels and errors tied with `aria-describedby`, and a live region for async results;
    - dialogs that trap and restore focus;
    - native elements before ARIA;
    - `prefers-reduced-motion`;
    - `lang` on the document and on mixed-language passages.

    Add the README row. Then read the three skills against their sources side by side, and record the result in the execution log. The reading covers:
    - project names, token names, paths, domains and decision slugs;
    - every rule carrying its mechanism, its *why* and how to check it, with any stack-specific remedy stated as conditional;
    - every standards fact carrying its primary source and the date it was checked;
    - `store-review` keeping only the consequence and the pointer.
- **Verification:**
  - `(auto)` `scripts/check-plugin.sh plugin` — prints "validate" with the expertise count including the three new skills, and exits 0.
  - `(auto)` `scripts/check-structure.sh` — prints "structure clean": each new skill appears under the README's `## Expertise`.
  - `(auto)` `grep -rniE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' plugin/skills/forms-and-failures plugin/skills/design-system plugin/skills/accessibility` — no match (exit 1): no project identifier was carried over. The Task 1.3 reading backs this narrow check.
  - `(auto)` `grep -h '^description:' plugin/skills/forms-and-failures/SKILL.md plugin/skills/design-system/SKILL.md plugin/skills/accessibility/SKILL.md | awk 'length($0) > 460 { bad = 1 } END { exit bad }'` — exits 0: each description stays near 100 tokens.
  - `(auto)` `plugin/bin/esq expertise match frontend/src/components/ui/button.tsx frontend/src/pages/ContactForm.tsx frontend/src/App.tsx backend/src/index.ts` — `skills` holds `esq:design-system` and `esq:accessibility` matched on `button.tsx`, and `esq:forms-and-failures` matched on `ContactForm.tsx`. No skill lists `App.tsx` or `index.ts`, and `unread` is empty.

### Phase 2 — FR/EN localisation and dates and time zones expertise
- **Goal:** in any esq project, Claude can consult `esq:i18n-fr-en` and `esq:dates-and-timezones`, and an esq phase that touches a locale file or a date helper loads them.
- **Files touched:**
  - `plugin/skills/i18n-fr-en/SKILL.md`
  - `plugin/skills/dates-and-timezones/SKILL.md`
  - `README.md`
- **Expertise:** none. This phase writes it.
- **Tasks:**
  - Task 2.1: add `i18n-fr-en`. It covers:
    - user-facing strings as keys, never literals;
    - both locales in the same commit, with a parity check;
    - the language a background job or email uses, read from the user and not from a default;
    - Québec French over France French (courriel, magasiner, clavarder), with OQLF typography;
    - `fr-CA` number, money and date formats through `Intl`, never by string concatenation;
    - plurals through ICU or the library's own rules;
    - validation messages and accessible names translated too, not only visible copy;
    - room for French text running about 20–30 % longer;
    - proper nouns kept as they are;
    - Charter s. 52.1 and the Bill 96 obligations as they apply to software and to a product's interface, with the primary citation and the date checked. Legal reading stays the project's: the skill states the rule and its source, never advice.

    Add the README row.
  - Task 2.2: add `dates-and-timezones`. It covers:
    - store instants in UTC (`timestamptz`), and store a local date as a date, not a midnight instant;
    - the zone as an explicit, required parameter, with the owner's zone (a user or an organisation) as the authority;
    - validating a zone with `Intl.DateTimeFormat` so that links like `America/Montreal` are accepted;
    - DST gaps and overlaps when adding days rather than hours, with Montréal's spring gap and autumn overlap as the worked case;
    - a server's or CI's zone that differs from production;
    - `new Date('YYYY-MM-DD')` parsing as UTC;
    - Temporal's current support, with a fallback library;
    - tests that pin the clock and the zone.

    Add the README row. Then run the same side-by-side reading as Task 1.3 on both skills (identifiers, then mechanism, *why*, check and conditional remedies, then sources with their dates), and record it in the execution log.
- **Verification:**
  - `(auto)` `grep -rniE 'tamialog|events-tracker|goprosperia|prospection|synergie|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' plugin/skills/i18n-fr-en plugin/skills/dates-and-timezones` — no match (exit 1).
  - `(auto)` `grep -h '^description:' plugin/skills/i18n-fr-en/SKILL.md plugin/skills/dates-and-timezones/SKILL.md | awk 'length($0) > 460 { bad = 1 } END { exit bad }'` — exits 0.
  - `(auto)` `plugin/bin/esq expertise match frontend/src/locales/fr.json frontend/src/lib/formatDate.ts frontend/src/lib/dates/parse.ts backend/src/services/update.ts backend/src/services/updateUser.ts frontend/src/App.tsx` — `skills` holds `esq:i18n-fr-en` matched on `fr.json`, and `esq:dates-and-timezones` matched on `formatDate.ts` and `dates/parse.ts`. No skill lists `update.ts`, `updateUser.ts` or `App.tsx`, and `unread` is empty.
  - `(auto)` `./scripts/audit.sh` — PASS: plugin validation and structure (all eight expertise skills listed under `## Expertise`), the product suites and conformance included.

## Rollout
- `(user)` Publish the release with `./scripts/update.sh`, then confirm that a session's skill list shows the five new `esq:` skills.

## Risks
- **Pre-mortem: paths that are too narrow, so the skill never loads where it matters.** A project names its forms `ContactEditor.tsx` and keeps strings in `src/strings/`. Path matching then misses, and only a description trigger or the plan's judgment loads the skill. Each description names concrete actions ("writing a form", "adding a user-facing string", "storing or displaying a date"), not only files, and the Phase 1/2 match steps prove the intended markers. Coverage beyond those markers stays unproved until projects use the skills. When a plan finds a miss, it widens `**Paths:**` in a follow-up.
- **Paths that are too broad cost tokens on every frontend phase.** The `App.tsx`/`index.ts`/`update.ts`/`updateUser.ts` negatives in the match steps hold the line.
- **A project's convention becomes a universal rule.** assets-prospection's sticky save header, alphabetical sorting and token names are one product's choices. Write the mechanism (why a soft chip on a soft ground disappears), and make each stack-specific remedy conditional on its stack.
- **Legal text read as legal advice.** `i18n-fr-en` cites s. 52.1 with its source and date, and says that applying it to a given product is the project's call.
- **Overlap with project skills.** assets-prospection's and events-tracker's own skills keep winning where they disagree ("project skill wins"). Trimming them down to their project-specific parts is those repos' work, outside this unit.
- **Stale counts.** `CLAUDE.md` and ARCHITECTURE still say "twenty-three skills". Nothing checks those counts, and `/esq:arch` refreshes them after landing.

## Open questions

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->
