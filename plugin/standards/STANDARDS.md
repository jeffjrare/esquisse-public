# esq standards referent

The written standard a run arbitrates a **stated constraint** against, before it decides whether that
constraint is the user's to rule on. It is read through `esq standards`, which resolves the project's
own `docs/STANDARDS.md` over this file and returns both: **where the project file speaks, it wins; this
file covers the rest.** Nothing writes either file during a run.

Why it exists: a stated constraint — a number, a budget, a limit written into a brief, a plan's
`## Done looks like`, or the repo's own conventions — used to be an absolute ask trigger. A 265px
overrun against a 4800px budget stopped a run to ask the user whether 5.5% was acceptable, with no
written standard to arbitrate it against. With one, the run decides inside a stated threshold, records
the decision citing the clause it decided under, and keeps working.

## Part 1 — Arbitrating a stated constraint

### The default is: not arbitrable

**A stated constraint is not arbitrable unless a class below names it.** Silence here is a 🔴, not a
licence. A constraint whose class you cannot place, a class named below whose threshold does not cover
the overrun in hand, and a constraint the user wrote with the hard marker are all the same outcome: the
run stops and asks, exactly as it did before this file existed.

### Never arbitrable, at any magnitude

No threshold, no proportion, no "it is only one field" reaches these. An overrun here is always the
user's, however small:

- **Security** — authentication, authorization, secrets handling, input trust boundaries, sandboxing,
  the permission surface a command opens.
- **Privacy** — what is collected, what is stored, what leaves the machine, what a telemetry row
  carries, what a log line prints.
- **Data retention and data loss** — retention windows, deletion guarantees, and any irreversible
  mutation of a user's data or history.
- **A stated legal, regulatory, licensing or contractual limit.**
- **A public API, wire format, on-disk format or other durable contract** a consumer outside this
  repository reads.

### Arbitrable classes, and by how much

Each class states the overrun a run may absorb on its own. The threshold is a ceiling on a **single**
constraint, judged against the stated number; it is not a budget to spend across several, and two
overruns in one unit are not averaged.

| Class | What it covers | Arbitrable up to |
| --- | --- | --- |
| Dimensional | A pixel dimension, a line count, a character or word budget, a file-size target, a page or section count | **10%** over the stated number |
| Performance | A latency, throughput or wall-clock target that no user-visible guarantee and no SLA pins | **15%** over the stated number |
| Count | A number of items, steps, phases, tasks, options or retries | **1 unit**, when the stated number is 5 or more |
| Cosmetic tolerance | A spacing, alignment, colour-step or typographic-scale value inside an existing design system | **1 step** of the system's own scale |
| Scope-neutral substitution | A named tool, library or command replaced by one already in the repository that does the same job at the same or greater strictness | **exact equivalence only** — no reduction in what is checked |

Anything an arbitrable class covers but whose overrun exceeds its threshold is the user's. So is any
overrun of a constraint that names no class here.

### What an arbitrated decision records

Deciding is not free of paperwork — the trade of an interruption for a record is the whole point. An
arbitrated constraint is recorded where the run's own command records its decisions
(`docs/DECISIONS.md`, or the execution-log entry's surprises when the command writes no registry entry),
and the record names all four:

1. **The constraint as stated** — the number, and where it was written.
2. **The observed value** — what the work actually came to, and the overrun as a proportion or a count.
3. **The clause it was decided under** — the class above and its threshold, cited from this file or
   from the project's `docs/STANDARDS.md` when that file spoke.
4. **`Fondement: mandate — <the clause>`** where the record carries that field. There is no fourth
   `Fondement` state for a standard: `mandate` already means *the accepted frame delegated this
   choice*, and this referent is that frame written down.

A decision that cannot name all four is not arbitrated. It is a 🔴.

### The `(hard)` marker

A user who means a number literally writes `(hard)` as a leading tag on the line that states it:

```markdown
- (hard) The rendered page is at most 4800px tall.
```

A constraint carrying `(hard)` is **never arbitrable**, whatever class it would otherwise fall in and
however small the overrun. It re-arms the 🔴 the user gave up by writing a number a class covers. The
notation is the repository's existing one — `(auto)`, `(manual)`, `(reads)` are read the same way, as a
leading parenthesized tag on a line.

The marker is read wherever a constraint is stated: a brief, a plan's `## Done looks like`, an epic, a
backlog row, or `CLAUDE.md`.

## Part 2 — Domain defaults

**Empty on purpose.** Part 1 says which classes of stated constraint a run may decide and by how much.
Part 2 is where a *default value* lives for a constraint nobody stated — front-end, back-end and design
defaults a run could adopt when the brief is silent. Filling it is a later unit of work, and nothing in
this repository reads it yet.

Until it is filled, a run that finds no stated constraint at all has no default to adopt here, and
treats the absence the way it always has: it decides from the repository's own conventions, and asks
only when the answer lives in the user's head.

### Front end

*(empty — reserved)*

### Back end

*(empty — reserved)*

### Design

*(empty — reserved)*
