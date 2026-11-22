# Fixes brief: Gemini as a second opt-in adversary beside Codex in /esq:plan

Source: /esq:review on add-gemini-opt-in-adversary, 2026-11-21
Reviewed at: 54c4447

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- The read-only probe hides a write behind "inconclusive". A user runs `scripts/probe-gemini-readonly.sh` and Gemini creates `PWNED.md`, but it exits non-zero (a timeout) or answers without the seed token. The script then exits 2 at lines 83–91, before checks 3–4 ever run. The user sees only "inconclusive", never the FAIL the README tells them to act on, so a CLI that can write looks unproven instead of unsafe. — `scripts/probe-gemini-readonly.sh:83` — fix: run checks 3–4 (`git status --porcelain`, the `PWNED.md`/`pwned.txt` test) right after the call, before the `rc`/`response` inconclusive exits, and exit 1 whenever either FAILs, whatever the positive control says. Keep exit 2 for a clean tree with no positive control. Update the header comment (lines 19–22) to match. — verify: `bash -n scripts/probe-gemini-readonly.sh && awk '/^fails=0/{f=NR} /if \[ "\$rc" != 0 \]/{r=NR} END{exit !(f && r && f<r)}' scripts/probe-gemini-readonly.sh`
- Gemini can run outside the repository root. Every Codex call pins its workspace with `-C "$(git rev-parse --show-toplevel)"`, and `adversary.md:19` says every call runs from the repository root. The Gemini command has no `cd`, and Gemini's workspace is its cwd. A user whose session cwd is a subdirectory of the repo (for example, Claude launched in `packages/app` of a monorepo) gets a Gemini that cannot read `docs/plans/<plan>.md` or the rest of the repo, so the pre-mortem either fails or judges a plan it never saw. — `plugin/skills/plan/references/gemini-adversary.md:29` — fix: put `cd "$(git rev-parse --show-toplevel)" && ` before the `d=` line of the command, and the same prefix in the hook test's Gemini command (`tests/hooks/hooks.test.mjs:662`). — verify: `grep -n 'cd "$(git rev-parse --show-toplevel)" &&' plugin/skills/plan/references/gemini-adversary.md && ./scripts/audit.sh`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
