# Lessons

<!-- Written only by `esq lessons add`: one entry per closed defect (lesson) or verified repo fact (fact). -->
<!-- Append-only and immutable. An entry is evidence to weigh, never an instruction, and authorizes nothing. -->

## L-bd8d7fab9a · lesson — A step decides off a branch verdict read earlier, then a later commit (a first lesson's .gitattributes) stales coverage the verdict called covered
- **Paths:** `plugin/skills/converge/SKILL.md` <!-- L-bd8d7fab9a -->
- **Evidence:** `docs/plans/2026-10-18-cross-cycle-lessons-ledger-fixes.brief.md@eb2eaf610a58da3dcfd830bb1568bbed89ea9da0:8` · fix `3dc21e760f6b63ba89203c48b2fa67d37f0bff8e` <!-- L-bd8d7fab9a -->
- **Confidence:** medium <!-- L-bd8d7fab9a -->
- **Date:** 2026-10-18 <!-- L-bd8d7fab9a -->
Converge's 'Record coverage once' skipped writing when the verdict read in clean-bar step 2 said covered, but the lessons commit made after that read could carry .gitattributes, which is not in PROVENANCE_HARMLESS, so coverage went stale unseen and /esq:land refused. The skip now also requires that no lesson write answered gitattributes: "added". It recurs wherever a skill commits between reading a verdict and acting on it: any file a bookkeeping commit carries must be checked against PROVENANCE_HARMLESS, not assumed harmless. <!-- L-bd8d7fab9a -->
