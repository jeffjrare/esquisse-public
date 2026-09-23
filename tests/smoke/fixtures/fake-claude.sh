#!/bin/sh
# fake-claude — a `claude` that is not claude, for the tests that prove the
# runner's deadline is a bound.
#
# The defect B-135 names is only observable against a child that leaves
# something of its own running: `close` fires when every inherited pipe is
# closed, and a killed `claude`'s surviving children still hold them. So this
# fixture's whole job is to be that shape, on demand and for free — no token is
# spent here, and nothing about it resembles a real run beyond the stream-json
# lines the harness reduces.
#
# Knobs, all environment, so the argv the runner passes stays the real one:
#
#   FAKE_CLAUDE_PIDFILE             write this process's own pid here
#   FAKE_CLAUDE_GRANDCHILD_PIDFILE  spawn a child that inherits stdout, holds it
#                                   open for 60s, and writes its pid here — the
#                                   process that makes `close` wait
#   FAKE_CLAUDE_ESCAPEE_PIDFILE     spawn a grandchild that `setsid`s out of this
#                                   process group — so the deadline's group kill
#                                   cannot reach it — while still holding the
#                                   inherited stdout open, and write its pid here
#   FAKE_CLAUDE_ESCAPEE_PROBE=N     that escapee waits N seconds, writes one line
#                                   to the inherited stdout, and records the shell
#                                   status of that write in
#                                   FAKE_CLAUDE_ESCAPEE_PROBEFILE: 0 while the
#                                   runner still holds the read end, non-zero
#                                   (SIGPIPE) once the grace has destroyed it
#   FAKE_CLAUDE_ESCAPEE_PROBEFILE   where that status lands
#   FAKE_CLAUDE_EMIT=1              print the three stream-json lines a reduced
#                                   record needs (init, assistant text, result)
#   FAKE_CLAUDE_SLEEP=N             stay alive N seconds before exiting
#   FAKE_CLAUDE_EXIT=N              exit with this status (default 0)

if [ "$1" = "--version" ]; then echo "9.9.9 (Claude Code)"; exit 0; fi

[ -n "$FAKE_CLAUDE_PIDFILE" ] && echo $$ > "$FAKE_CLAUDE_PIDFILE"

# Drain the prompt the runner writes, so its `stdin.end` does not EPIPE.
cat > /dev/null

if [ -n "$FAKE_CLAUDE_GRANDCHILD_PIDFILE" ]; then
  # `exec` keeps the pid this wrote, and the sleep keeps the inherited stdout
  # open. It is in this process's group, so a group kill reaches it.
  sh -c 'echo $$ > "$FAKE_CLAUDE_GRANDCHILD_PIDFILE"; exec sleep 60' &
fi

if [ -n "$FAKE_CLAUDE_ESCAPEE_PIDFILE" ]; then
  # `setsid` puts this one in a session and process group of its own, so the
  # deadline's `kill(-pid)` cannot reach it — the case the grace exists for. It
  # keeps the inherited stdout, so `close` cannot fire while it lives, and its
  # cwd is this process's cwd, which is the scratch root the survivor reading
  # walks. Nothing kills it: the test that asks for it kills it by pid.
  setsid sh -c 'echo $$ > "$FAKE_CLAUDE_ESCAPEE_PIDFILE"
    if [ -n "$FAKE_CLAUDE_ESCAPEE_PROBE" ]; then
      sleep "$FAKE_CLAUDE_ESCAPEE_PROBE"
      # A subshell, so a SIGPIPE kills it and not this one; its status is the
      # reading — 0 while the pipe is open, 141 once the read end is gone.
      ( echo escapee-probe ) 2>/dev/null
      echo $? > "$FAKE_CLAUDE_ESCAPEE_PROBEFILE"
    fi
    exec sleep 60' &
fi

if [ -n "$FAKE_CLAUDE_EMIT" ]; then
  echo '{"type":"system","subtype":"init","claude_code_version":"9.9.9","model":"opus"}'
  echo '{"type":"assistant","message":{"content":[{"type":"text","text":"alpha omega"}]}}'
  echo '{"type":"result","total_cost_usd":0.01,"num_turns":2}'
fi

[ -n "$FAKE_CLAUDE_SLEEP" ] && sleep "$FAKE_CLAUDE_SLEEP"

exit "${FAKE_CLAUDE_EXIT:-0}"
