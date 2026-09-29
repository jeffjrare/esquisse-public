# Fixes brief: Close B-181 with a brief-fidelity fix and one paid Tamialog trial

Source: /esq:review on b181-closing-evidence, 2026-09-29
Reviewed at: 484cc41

## 🟢 Fix now (safe)
Mechanical, contained, one clearly-correct fix each. /esq:fix applies these.
- The retained proposal does not match its recorded hash: `sha256sum docs/preparation/2026-09-29-b181-fidelity/proposal.md` gives `e441839b…`, while `metrics.json` `proposal_sha256` and the report (`9fbd323e…`) record the raw output; the file carries one extra trailing `\n` (its sibling `2026-09-25-b181-tamialog/after-proposal.md` matches its hash exactly). Anyone verifying the "proposal kept whole" claim gets a mismatch and must suspect the evidence was edited — `docs/preparation/2026-09-29-b181-fidelity/proposal.md` (EOF) — fix: drop the final newline (`truncate -s -1 docs/preparation/2026-09-29-b181-fidelity/proposal.md`) — verify: `sha256sum docs/preparation/2026-09-29-b181-fidelity/proposal.md | grep -q 9fbd323e34a7acecb28764e43d6e52afe25cd249038abe27e9887a53c7cf0daa`

## For /esq:fix and /esq:plan
<!-- Corrective brief. /esq:fix applies the 🟢 items; /esq:plan plans the 🟡 items;
🔴 items need a human answer first. Do not edit below this line. -->
