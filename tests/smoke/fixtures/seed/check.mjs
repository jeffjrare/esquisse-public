#!/usr/bin/env node
// The project's verification, named in CLAUDE.md: greet() must produce the canonical greeting.
import { greet } from './lib/greet.mjs';

const expected = 'Hello, world!';
const actual = greet('world');
if (actual !== expected) {
  console.error(`check: greeting mismatch — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  process.exit(1);
}
console.log('check: ok');
