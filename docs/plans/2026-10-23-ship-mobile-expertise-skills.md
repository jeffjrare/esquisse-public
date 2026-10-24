# Ship mobile expertise skills with esq, and load them where the work touches mobile

**Epic:** esq-decides-implementation-detail

**Branch:** esq/ship-mobile-expertise-skills

**Origin:** main

## Context
B-169's last part, specialist guidance, was parked until "a run builds badly on something no project skill covers". That has now happened: events-tracker's Capacitor Android shell was built with no skill to guide it. Its `shell/` history shows the cost in repair commits: plugins whose native half was never registered in the synced Gradle files (`54b7ef5a`, `b78e6c66`), a WebView cookie store lost on pause (`17137b9b`), backup excludes missing a required attribute (`61758ac8`), a keystore fallback misread (`cbc44235`), and a first Play rejection for a silent button. What was learned lives in two project skills (`store-review`, and the Android section of `landing-and-deploy`), so assets-prospection and the coming iOS work can't use it. On 2026-10-23 the user widened the scope: esq ships a library of generic expertise as **real plugin skills**, not guides served by the CLI. This plan delivers the first batch (mobile) and the trigger that makes esq load it. Two later batches are out of scope: UI/design system, then data, security and testing.

## Goal
In any project where esq is installed, Claude has generic Capacitor Android, Capacitor iOS and store-review expertise. `/esq:plan`, `/esq:build` and `/esq:review` load the matching skill whenever a unit touches a mobile file, so the next Android or iOS shell avoids the mistakes events-tracker paid for.

## Done looks like
- In a project with esq installed and no mobile skill of its own, asking Claude to add an iOS target to a Capacitor app makes it consult `esq:capacitor-ios` without being told to.
- A plan whose phase touches `shell/android/…` or `ios/…` names the expertise in that phase. `/esq:build` loads it before writing code, and `/esq:review` reviews against it.
- Every expertise skill says how old its facts are. A run told the facts are more than 180 days old says so in one line and keeps going.
- None of the three skills mentions events-tracker or Tamialog, or any of their accounts, IDs or backlog numbers. The project-specific parts stay in that project.
- A domain the plan touches that no expertise skill covers gets one line in the plan, never a stop.

## Approaches considered
1. **Expertise skills that declare their own paths, matched by the CLI (chosen).** Each skill sits in `plugin/skills/<name>/` with `user-invocable: false`, so the model can invoke it but it never appears as a slash command. Its body opens with a parsed `**As of:**` date and a `**Paths:**` line. `esq expertise match` matches a phase's paths against those lines. *Benefit:* the description triggers it in any session, esq flows load it deterministically, and adding a skill means adding one file. *Cost:* about 100 tokens of description per skill in every session (about 300 here). *Limit:* path matching can't see intent such as "submit to the store", so the plan may also name a skill by judgment.
2. **One plugin-owned registry mapping domain markers to skill IDs** (Codex's structural alternative). *Loses:* a second file must be kept in step with every skill, and the registry and the skill can drift. The per-skill `**Paths:**` line keeps one writer per fact. Its other strength, an explicit declaration for intent and for platforms with no files yet, is kept: the phase's `**Expertise:**` item, and matching against paths that don't exist yet.

Rejected once: guides served by the CLI behind a single skill. The user chose real skills on 2026-10-23, because those also work outside esq flows.

## Recommendation
Approach 1.
- **Owning components** (ARCHITECTURE § `plugin/skills` and § `plugin/bin/esq` + `plugin/lib/`): the skills own the judgment and the guidance. The CLI owns only the deterministic match and the age (rule 3 of `CLAUDE.md`).
- **Boundary:** the CLI never returns or summarizes a skill's body. Its answer is skill IDs, dates and the paths that matched.
- **Guards:**
  - `check-plugin.sh` gains a second skill kind. A `user-invocable: false` skill must carry a parsed `**As of:** YYYY-MM-DD` and a non-empty `**Paths:**` line. It is exempt from `model`, `effort`, `$ARGUMENTS`, `$0` and the invocation flags, because it is knowledge, not a command.
  - It must never carry `disable-model-invocation`: with both flags set, nobody can invoke the skill.
  - `check-structure.sh` requires each expertise skill in a README `## Expertise` section instead of `## Commands`.
  - Both guards check that a parsed format or a reference is intact. Neither polices prose.
- **Who wins:** each skill says that a project skill on the same topic wins where they disagree.
- **The three skills:**
  - `capacitor-android` carries the rules events-tracker's Android history earned.
  - `capacitor-ios` covers toolchain, signing, the lifecycle and session survival, push (APNs vs FCM), privacy manifests, `ITSAppUsesNonExemptEncryption`, and CI on a hosted macOS runner when there is no Mac. It is written from primary sources, and its body says those facts are documented, not yet tested on a device.
  - `store-review` covers what Play and App Store reviewers check, harvested from events-tracker's `store-review` with every Tamialog identifier stripped.
- Sources:
  - Claude Code skills frontmatter, `user-invocable: false` (model-invocable background knowledge; its description stays in context): https://code.claude.com/docs/en/skills, checked 2026-10-23.
  - The Play and App Store facts are the dated official pages events-tracker's `store-review` cites. Build re-checks each before it sets `**As of:**`.

## Phases

### Phase 1 — Three mobile expertise skills, available in every project
- **Goal:** Claude in any esq-installed project can consult generic Capacitor Android, Capacitor iOS and store-review expertise, and the audit accepts this new kind of skill.
- **Files touched:**
  - `plugin/skills/capacitor-android/SKILL.md`
  - `plugin/skills/capacitor-ios/SKILL.md`
  - `plugin/skills/store-review/SKILL.md`
  - `scripts/check-plugin.sh`
  - `scripts/check-structure.sh`
  - `README.md`
- **Expertise:** none. This phase writes it.
- **Tasks:**
  - Task 1.1: check-plugin: accept expertise skills (`user-invocable: false`), require their `**As of:**` and `**Paths:**` lines, and refuse `disable-model-invocation` on them. check-structure: require each one in the README's `## Expertise` section rather than `## Commands`. Add that section with its intro: what an expertise skill is, that it is invoked automatically, that a project skill wins, and how old facts are flagged.
  - Task 1.2: add `capacitor-android`, harvested from events-tracker's `landing-and-deploy` § The Android shell and the `shell/` repair commits, generic wording only. It must cover:
    - building with the target API origin set, since Vite inlines it;
    - a `versionCode` that only ever grows;
    - the API level pinned where Gradle reads it;
    - committing the files `cap sync` writes, together with the plugin that caused them;
    - no `server.url` in a release;
    - the WebView origin and its cookies: never relax the origin, flush the cookie store on pause;
    - `assetlinks.json` listing distribution keys only;
    - signing from the environment, never the tree;
    - backup and data-extraction rules;
    - safe-area insets;
    - the `.kotlin/` build leftovers.

    Each rule gets its *why*. Every expertise skill's body also says: "if today is more than 180 days past `**As of:**`, say so in one line before relying on a deadline, and keep going". This covers loads the CLI never dated (a free session, a declared-only skill). `**Paths:**` covers `android/`, `AndroidManifest.xml`, `*.gradle`, `*.gradle.kts`, `capacitor.config.*` and `assetlinks.json`.
  - Task 1.3: add `capacitor-ios` from the iOS section of events-tracker's `store-review` and from current Apple and Capacitor docs (at most 3 searches per fact that changes a rule). `**Paths:**` covers `ios/`, `*.xcodeproj/`, `*.xcworkspace/`, `Info.plist`, `*.xcprivacy`, `Podfile` and `capacitor.config.*`.
  - Task 1.4: add `store-review`: the reviewer's walk on both stores, then Play, then the App Store, without Tamialog accounts, backlog IDs or product decisions. Every deadline carries its source and `**As of:**`. Then read each of the three skills against its source, side by side, for accounts, identifiers, URLs of the project's own domains, project references and product decisions (such as the pricing plan's slug). Record the result in the execution log. `**Paths:**` covers `play-listing/`, `fastlane/`, `*.xcprivacy`, `AndroidManifest.xml` and `Info.plist`.
- **Verification:**
  - `(auto)` `scripts/check-plugin.sh plugin` — prints "validate" for every skill, the three expertise skills included, and exits 0 (`claude plugin validate --strict` accepts `user-invocable: false`).
  - `(auto)` `scripts/check-structure.sh` — prints "structure clean", which means each expertise skill is listed under `## Expertise`.
  - `(auto)` `grep -rniE 'tamialog|events-tracker|googleverif|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' plugin/skills/capacitor-android plugin/skills/capacitor-ios plugin/skills/store-review` — no match (exit 1): no project name, account, backlog ID or decision slug was carried over. This narrow check is backed by the sanitization reading in Task 1.4.
  - `(auto)` `grep -h '^description:' plugin/skills/capacitor-android/SKILL.md plugin/skills/capacitor-ios/SKILL.md plugin/skills/store-review/SKILL.md | awk 'length($0) > 460 { bad = 1 } END { exit bad }'` — exits 0: each description stays near 100 tokens, which bounds the standing context cost at about 300 tokens.

### Phase 2 — esq loads the expertise a phase touches
- **Goal:** `/esq:plan` names the expertise each phase needs, `/esq:build` loads it before coding, and `/esq:review` reviews against it, from a deterministic match the CLI answers in the calls they already make.
- **Files touched:**
  - `plugin/lib/cli.mjs`
  - `tests/cli/expertise.test.mjs`
  - `plugin/skills/plan/SKILL.md`
  - `plugin/skills/build/SKILL.md`
  - `plugin/skills/review/SKILL.md`
  - `README.md`
  - `docs/CONFORMANCE.md`
- **Tasks:**
  - Task 2.1: cli: `esq expertise match <path…>|--paths -`.
    - It reads every `plugin/skills/*/SKILL.md` that carries `user-invocable: false`, resolved beside the CLI the way `DEFAULT_STANDARDS` is.
    - It answers `{ skills: [{ id: "esq:<name>", asOf, ageDays, stale, matched: [paths] }] }`, with `stale` meaning `ageDays > 180`.
    - Matching is pure string, segment-wise and unanchored, so a path that doesn't exist yet still matches. A span ending in `/` matches that directory segment anywhere. `*` matches within one segment. A path with a `node_modules` segment never matches.
    - It never throws on a malformed skill: that skill is reported under `unread`.
    - `esq next-phase --preflight` carries the same `expertise` answer for the selected phase's `**Files touched:**`, beside `lessons`. It matches both `paths` and `unread` from `touchedPaths`: `pathAlternatives` rejects a bare top-level directory such as `ios/`, which then lands in `unread`, and matching it there needs no change to `markdown.mjs`.
    - Add the usage line. Tests cover:
      - Android only (`shell/android/app/build.gradle`);
      - iOS only, on a path that doesn't exist yet (`shell/ios/App/App/Info.plist`);
      - mixed Android and iOS;
      - an unrelated path (`frontend/src/App.tsx`), which matches nothing;
      - `node_modules/@capacitor/android/…`, which matches nothing;
      - a stale `**As of:**`;
      - a skill with no `**Paths:**`, which lands in `unread` without failing the call;
      - a preflight answer whose `expertise` matches its phase, including a phase whose `**Files touched:**` names only `ios/` and has no `**Expertise:**` item.
  - Task 2.2: plan, build and review load the expertise.
    - **Plan:** chain `esq expertise match --paths -` into the investigation wave beside `esq lessons match`. Read a matched skill before writing that phase's tasks. Write an optional `- **Expertise:** \`esq:<name>\`` item per phase: the matches, plus any skill judged necessary that paths can't express, such as `esq:store-review` for a phase that submits a build. A domain the unit touches that no expertise or project skill covers gets one line in `## Risks`. It is also filed once in the tail commit with `esq backlog add --type improvement --summary "Expertise candidate: <domain> — <what the unit needed>" --source "plan: <slug>"`, unless an Open row already names that domain (the step-9 backlog match): the catalog then grows from what projects actually meet. Amended 2026-10-23 at the user's request.
    - **Build** step 5/6: load, in the working-set turn, the union of the preflight's `expertise` and the phase's `**Expertise:**` item through the `Skill` tool. A `stale` skill gets one line after the announce. Neither ever stops the run.
    - **Review:** chain the same match over the review scope's files. Load the union of those matches and the `**Expertise:**` items of the phases in scope, so a declared `esq:store-review` that matches no changed path is still applied, before judging. A stale skill gets the same one line.
    - **README:** update the `/esq:plan`, `/esq:build` and `/esq:review` rows and the `## Expertise` intro so they state that the skills load automatically.
    - **CONFORMANCE:** add a row for the expertise skill's `**As of:**` and `**Paths:**` lines, which `esq expertise match` parses.
- **Verification:**
  - `(auto)` `plugin/bin/esq expertise match shell/android/app/build.gradle shell/ios/App/App/Info.plist frontend/src/App.tsx` — `skills` holds `esq:capacitor-android` (matched on the gradle path) and `esq:capacitor-ios` (matched on the plist), and no skill lists `frontend/src/App.tsx`.
  - `(auto)` `./scripts/audit.sh` — PASS: the expertise suite, every product suite, structure, package and conformance included.

## Rollout
- `(user)` Publish the release with `./scripts/update.sh`, then confirm, in an events-tracker session, that the skills list shows `esq:capacitor-android`, `esq:capacitor-ios` and `esq:store-review`.
- `(user)` In a project with no mobile skill of its own (assets-prospection), ask Claude to add an iOS target to a Capacitor app without naming any skill, and confirm it invokes `esq:capacitor-ios`. This is the only observation of the free-session trigger.

## Risks
- **Pre-mortem: the skill exists but Claude never opens it in a free session.** A description that is too vague, or crowded out by a project skill on the same topic, never triggers. Task 1.2–1.4 descriptions name the concrete triggers: files, actions such as "add an iOS target" or "submit a build", and store forms. Phase 2 removes that dependence inside esq flows. A free-session trigger stays **unproved** until the second Rollout observation. No paid trial is bought here.
- **A project workaround becomes a universal rule.** Harvest the failure mechanism and how to verify it. Write each remedy that depends on an architecture choice (cookie session vs bearer token, a single origin) as conditional on it.
- **iOS is documented, not experienced.** The skill says so in its body. Device-tested lessons from events-tracker's iOS work (`ios-leaves-the-browser`) should flow back here later.
- **Store and platform facts expire.** `**As of:**` plus the 180-day flag make age visible. The flag never blocks, so a stale skill is still loaded. Re-checking the facts stays the skill's instruction at submission time.
- **The duplicate in events-tracker.** Its project `store-review` keeps winning where the two disagree. Trimming it down to its project-specific parts is that repo's work, outside this unit.
- **Stale projections.** `CLAUDE.md` and ARCHITECTURE still say "twenty-three skills", and § Boundaries says `plugin/skills/` holds exactly the distributed commands. `/esq:arch` refreshes both after landing. Nothing checks those counts.

## Open questions

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

### Phase 1 — completed 2026-10-23

**Plan committed at:** 9aefa83

**Commits:** f641e9e, deb2d61, 049d00c, e264535

**Verified:** e264535084a3dfbf5da63d076f633bc4277ff643
- `scripts/check-plugin.sh plugin`
- `scripts/check-structure.sh`
- `grep -rniE 'tamialog|events-tracker|googleverif|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' plugin/skills/capacitor-android plugin/skills/capacitor-ios plugin/skills/store-review`
- `grep -h '^description:' plugin/skills/capacitor-android/SKILL.md plugin/skills/capacitor-ios/SKILL.md plugin/skills/store-review/SKILL.md | awk 'length($0) > 460 { bad = 1 } END { exit bad }'`

**What got built:** Three expertise skills (`user-invocable: false`) ship in plugin/skills: capacitor-android, capacitor-ios and store-review, each opening with a parsed `**As of:** 2026-10-23`, a `**Paths:**` line, the 180-day staleness rule and the project-skill-wins rule. check-plugin.sh accepts this second skill kind (requires a calendar-valid As of and a Paths line with a backticked span, refuses disable-model-invocation on it), check-structure.sh requires each under the README's new `## Expertise` section instead of `## Commands`.

**Verification:**
- (auto) scripts/check-plugin.sh plugin — PASS: 'plugin, embedded CLI, native hooks and 26 skills (3 expertise) validate', exit 0; claude plugin validate --strict accepted user-invocable: false
- (auto) scripts/check-structure.sh — PASS: 'structure clean — … 23 commands, 3 expertise skills, README coverage …', exit 0
- (auto) grep -rniE 'tamialog|events-tracker|googleverif|B-[0-9]{3}|\bD-[a-z]+(-[a-z]+)+' over the three skill dirs — PASS: no match, exit 1
- (auto) description length awk over the three skills — PASS: exit 0 (308, 309, 356 chars, all ≤ 460)
- Task 1.1 negative case (scratch copy): a fake expertise skill with disable-model-invocation, As of 2026-02-30 and no Paths produced exactly those three findings, exit 1
- Task 1.4 sanitization reading, each skill against its source side by side: capacitor-android vs events-tracker landing-and-deploy § The Android shell and the five shell/ repair commits — dropped the app host, the channel id, the release env-var name, requireBuildOrigins(), check-assetlinks.sh, pnpm check:play-listing, the versionCode epoch date, every B-/D- reference; capacitor-ios vs store-review § Apple and the two iOS project commits — dropped the owner's no-Mac note, the 2026-10-13 image date, every B- row, the bundle identity; store-review vs its source — dropped the review account address, the 1.0.1/1.0.2 history, the Google-sign-in flag and its row, the client file paths, the in-app deletion label and component, the category choice (kept only as a generic conditional), the pricing slug, the notification topic decision (kept as 'decide with the product owner'). A second grep for project paths, host patterns and product terms over the three skills matched nothing. Result: no account, identifier, project domain, project reference or product decision carried over.

**Decided for you:**
- architecture: a `**Paths:**` line must name at least one backticked span, and `**As of:**` must be a real calendar date (GNU date round-trip) — Phase 2's parser can read backticked spans only and compute an age — undo: relax the two regexes in scripts/check-plugin.sh

**Surprises / decisions made during execution:** - Re-checked dated facts before setting As of: Play API 36 floor since 2026-08-31 (extension to 2026-11-01) confirmed; 16 KB page size from 2027-02-01 confirmed; Health apps declaration mandatory for every app confirmed; Apple Xcode 26 / iOS 26 SDK since 2026-04-28 and iOS 13 minimum since 2026-09-09 confirmed; GitHub macos-26 GA 2026-02-26 confirmed.
- Play's App access page (9859455) does not carry the 'reusable, accessible at all times' wording the source skill quoted; store-review now states what the page says (every detail needed, unusual mechanisms such as OTP/MFA flagged in 'Any other instructions').
- App Store Medical device status date (March 2026) was not re-verified; written as reported, with 're-check in App Store Connect'.
- check-plugin's summary line now reads 'N skills (M expertise) validate' and check-structure's counts commands and expertise skills separately.

**Backlog candidates:** None.

**For Phase 2:** 1. The three skills' frontmatter is `user-invocable: false` (no model/effort/arguments); `**As of:** YYYY-MM-DD` and `**Paths:** ` + comma-separated backticked spans are lines of their own right after the H1 — the format `esq expertise match` parses. A span ending in `/` is a directory (`android/`, `ios/`, `*.xcodeproj/`), `*` is within one segment.
2. README `## Expertise` exists with a table spelling each skill `esq:<name>` (no slash: check-structure's /esq:[a-z]+ rule would misread a hyphenated slash form); Phase 2 updates its intro to say esq flows load the skills automatically.
3. check-structure.sh and check-plugin.sh each detect the kind with the same small awk over the frontmatter; scripts/test-plugin-guards.sh (--release) has no case for the new expertise branch yet.

### Phase 2 — completed 2026-10-23

**Plan committed at:** 30e612d

**Commits:** b4586b4, abeaf4b

**Verified:** abeaf4b9ae474811d78f6ea1b1a21d700ab60370
- `plugin/bin/esq expertise match shell/android/app/build.gradle shell/ios/App/App/Info.plist frontend/src/App.tsx`
- `./scripts/audit.sh`

**What got built:** `esq expertise match <path…>|--paths -` answers the expertise skills a set of paths touches (id, asOf, ageDays, stale, matched; `unread` for a malformed skill), and `esq next-phase --preflight` carries it as `expertise` for the selected phase's touched paths and unread spans. /esq:plan names each phase's `**Expertise:**` and files a candidate row for an uncovered domain, /esq:build loads the preflight matches plus that item, /esq:review loads the matches over its scope plus the phases' items; README and CONFORMANCE (scenario E-01) follow.

**Verification:**
- (auto) plugin/bin/esq expertise match shell/android/app/build.gradle shell/ios/App/App/Info.plist frontend/src/App.tsx — PASS: esq:capacitor-android matched on the gradle path, esq:capacitor-ios on the plist (esq:store-review also on the plist, which its Paths names), no skill lists frontend/src/App.tsx
- (auto) ./scripts/audit.sh — PASS: 'Clean — 7 checks (product)', exit 0; structure, package, conformance (5 scenarios), product suites within 120s, the new expertise suite included
- Task 2.1 targeted: node --test tests/cli/expertise.test.mjs — 6 pass; the two next-phase --preflight tests in tests/cli/esq.test.mjs — 2 pass

**Decided for you:**
- architecture: an expertise skill's age is counted against the caller's local calendar day, not UTC — a UTC day read 2026-10-23 skills as 1 day old the evening they were written — undo: use new Date().toISOString().slice(0, 10) in expertiseMatch (plugin/lib/cli.mjs)
- architecture: a directory span (`ios/`) also matches a path whose last segment it is, so a phase naming only `ios/` matches — undo: require a following segment in expertiseSpanMatches (plugin/lib/cli.mjs)

**Surprises / decisions made during execution:** - tests/cli/esq.test.mjs (not in Files touched) was edited: its preflight-equals-context assertion now strips the new `expertise` key beside `lessons`, and asserts it empty for a plan touching nothing mobile.
- Fixture skills live under tests/cli/fixtures/expertise/ (outside plugin/, so none counts as a plugin skill); expertiseMatch takes `skillsDir` and `today` options for them.
- The README's CLI row in § How it works also gained `esq expertise match`, beside `esq lessons match`.
- Audit wall clock not separately timed; it completed within the product pass's 120 s suite bound.

**Backlog candidates:** None.

**For Phase 3:** Last phase: /esq:review next. `/esq:arch` should refresh the skill count ("twenty-three skills") in CLAUDE.md and ARCHITECTURE after landing.
