# A README the budget tool can parse

### Measured cost per command — 2026-01-02

**Subagent runs** — one row per command group the summary prints:

| Command group | Runs | Status | Median out tok | Budget (out tok / duration) | Models observed |
|---|---|---|---|---|---|
| `esq:apply` † | 3 | provisional | 8.1k | — | fable-5 3 · 8.1k |
| `/esq:build` | 33 | confirmed | 28.9k | 43.5k / 10m45s · n=33 · 2026-01-02 | fable-5 29 · 26.8k |
| `/esq:work` | 5 | confirmed | 14.4k | 22.0k / 7m15s · n=5 · 2026-01-02 | fable-5 5 · 14.4k |

**Direct sessions** — a table with no budget column, which the tool must not read:

| Command | Runs | Status | Median out tok |
|---|---|---|---|
| `/esq:build` | 1 | provisional | 999.9k |

### The verdict this measurement supports

Prose below the table, never parsed.
