# Maintaining esquisse

Material for people who develop or release esquisse itself. Users of the plugin need
none of it; start from the [README](../README.md). The editing rules and their
reasons are in [CLAUDE.md](../CLAUDE.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Developing

Source lives in `plugin/`; installed files are not source. Preview a checkout with
`claude --plugin-dir ./plugin` rather than editing the plugin cache under `~/.claude/`.
Bash and GNU `timeout` are needed for the development and release scripts.

Run checks proportionate to the change and one final audit:

```bash
./scripts/audit.sh
```

This includes structural references, package validation, the no-push contract,
parsed-format conformance, manifest agreement, the bounded runner and the CLI,
hook and corpus-helper tests. Node suites are discovered by convention and run
inside the audit; do not run them a second time alongside it on the same tree.
A pending release is reported, not treated as a product regression.

For release or packaging changes, add `--release`. For research tools or their
fixtures, add `--lab`. Flags add checks without repeating the base pass:

```bash
./scripts/audit.sh --release --lab
```

Release tests use disposable repositories and isolated configuration; they do not
update your real installation. The lab pass uses fixtures and replay, not billed
model calls. See [AUDIT.md](AUDIT.md) for semantic reading and
[CONFORMANCE.md](CONFORMANCE.md) for the small set of parsed formats.
Checks enforce working references and code contracts, not preferred prose.

To inspect CLI behavior from this checkout, use `./plugin/bin/esq`.

## Updating the local installation

After the intended changes are verified, committed and on `main`, run from this
repository:

```bash
./scripts/update.sh
```

The router refuses a dirty tree or a branch other than `main`. It asks
`check-release-version.sh` whether the plugin changed since its version bump:

- **A release is needed:** `release-local.sh --patch` requires a primary checkout,
  checks that Claude's `esquisse` marketplace resolves to this local checkout,
  bumps both manifests, proves that only their versions changed, commits the bump,
  then invokes the official Claude plugin updater. It verifies installed version,
  release commit and bytes. Restart Claude Code after success.
- **No release is needed:** show `release-local.sh --check` and exit without
  installing. This does **not** mean the installed plugin matches the checkout;
  read the reported version, commit and byte comparison.
- **The verdict is missing, malformed or its command fails:** refuse. Report and
  release failures propagate instead of printing a success message.

The router runs no audit; verification must already have passed. It never pushes,
switches branches or commits unrelated work. The release's only installation
write is the official `claude --bare plugin update esq@esquisse --scope user --yes`
call, with closed stdin and a timeout. Nothing edits `~/.claude/` directly.

For a read-only installation report at any time:

```bash
./scripts/release-local.sh --check
```

This report exits zero even when the installation differs or cannot be read; its
exit code is not an installation certificate. If an install fails after a bump
commit, that commit remains. Follow the updater's printed retry command rather
than making another release to retry the same installation.

If you move or clone the repository, Claude may still use the old directory.
The release refuses before changing versions when that happens; `--check` also
reports the registered source. From the intended checkout, reconnect it and
install the version already committed:

```bash
claude --bare plugin marketplace add "$PWD" --scope user </dev/null
claude --bare plugin update esq@esquisse --scope user --yes </dev/null
./scripts/release-local.sh --check
```

## Operations

| Tool | Use |
|---|---|
| `scripts/audit.sh [--release] [--lab]` | Development verification with optional release and research-fixture passes |
| `scripts/check-plugin.sh` | Official plugin validation, syntax, hooks and skill frontmatter |
| `scripts/check-structure.sh` | Command, section, brief and reference-path resolution |
| `scripts/check-conformance.sh` | Template tokens consumed by retained parsers |
| `scripts/check-release-version.sh . --json` | Manifest agreement and whether source changes need a release |
| `scripts/update.sh` | Route a verified local checkout to release, or report without installing |
| `scripts/release-local.sh --check` | Read source and installation state without changing either |
| `scripts/worktree.sh new\|ls\|rm` | Terminal worktree operations; `/esq:worktree` works without it |

Research remains optional. `probe-model-pins.mjs`, `smoke-work-capture.mjs` and
`smoke-journeys.mjs` have live paths that make billed model calls; run them only
intentionally. `measure-wait-cost.mjs`, `measure-rereads.mjs` and
`cost-budgets.mjs` inspect local usage. None is a product prerequisite or part of
the default audit. Historical harness observations live in
[EVIDENCE.md](EVIDENCE.md); they are not fresh runtime guarantees.

A bounded, read-only headless trial recipe lives in
[headless-trial.md](headless-trial.md).

### Measured cost per command — 2026-08-19

Historical subagent baseline, retained because `scripts/cost-budgets.mjs` reads
its budget column. **These measurements predate the simplified workflow and
prompt compression. They do not measure the current release or promise savings.**
“Confirmed” here means at least five token-bearing runs in that historical
sample, not a current model or behavior certification.

**Subagent runs** — historical sample:

| Command group | Runs | Status | Median out tok | Median duration | Budget (out tok / duration) |
|---|---|---|---|---|---|
| `esq:apply` | 3 | provisional | 8.1k | 2m09s | — |
| `/esq:build` | 33 | confirmed | 28.9k | 7m02s | 43.5k / 10m45s · n=33 · 2026-08-19 |
| `/esq:check` | 13 | confirmed | 6.7k | 2m03s | 10.5k / 3m15s · n=13 · 2026-08-19 |
| `/esq:fix` | 11 | confirmed | 5.5k | 2m08s | 8.5k / 3m15s · n=11 · 2026-08-19 |
| `/esq:review` | 13 | confirmed | 13.6k | 3m24s | 20.5k / 5m15s · n=13 · 2026-08-19 |
| `/esq:roadmap` | 1 | provisional | 194 | 6s | — |
| `/esq:work` | 5 | confirmed | 14.4k | 4m43s | 22.0k / 7m15s · n=5 · 2026-08-19 |

Budgets are 1.5 times the historical median, rounded upward. The tool compares
current confirmed subagent samples with those budgets; a breach needs
interpretation, not an automatic product stop. Direct-session durations include
human waits and are not compared. `esq:apply` is an internal worker label, not a
slash command. Missing or provisional samples do not establish a cost claim.
