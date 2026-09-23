#!/usr/bin/env bash
# Release verified plugin changes from a clean main checkout.
# The version script owns source drift; release-local owns publishing and the
# installation report. No audit, branch switch or unrelated commit is made here.
# Exit 0: a release succeeded, or no new release is needed (installation merely
# reported). Invalid verdicts refuse; report/release failures propagate.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

say()  { printf '%s\n' "$1"; }
stop() { printf '\n%s\n' "$1"; exit 1; }

say "esq update — checking what this needs."
say ""

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || stop "Not a git repository."
if [ "$branch" != "main" ]; then
  stop "You are on '$branch', not main. Land the intended work with /esq:land <plan>,
then run this from the main checkout. This command never switches branches for you."
fi

status=$(git status --porcelain) || stop "Could not read the working tree status."
if [ -n "$status" ]; then
  stop "You have uncommitted changes. Commit or stash them, then run this again —
a release commit must contain the two manifests and nothing else."
fi

# Keep the producer's exit status and stderr: valid JSON cannot excuse a failed
# version check. A pending release is a successful verdict, not a check failure.
if ! version=$(scripts/check-release-version.sh . --json); then
  stop "The version check failed. Resolve the diagnostic above before updating."
fi
if ! need=$(node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    try {
      const need = JSON.parse(s).releaseNeeded;
      if (typeof need !== "boolean") throw new Error("missing boolean releaseNeeded");
      process.stdout.write(String(need));
    } catch (error) {
      console.error(`Invalid version verdict: ${error.message}`);
      process.exitCode = 1;
    }
  });
' <<< "$version"); then
  stop "The version check returned no usable verdict. Run ./scripts/check-release-version.sh . --json for details."
fi

if [ "$need" = "false" ]; then
  scripts/release-local.sh --check || exit $?
  say ""
  say "No new release needed. Installation status is reported above; no install performed."
  exit 0
fi

say "plugin/ has moved since the last release. Releasing."
say ""
exec ./scripts/release-local.sh --patch
