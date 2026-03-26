import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('DeFi skill retries common Uniswap fee tiers before declaring a quote unavailable', () => {
  const skill = read('skills/use-rlusd-evm-defi/SKILL.md');

  assert.match(skill, /fee-tier/i);
  assert.match(skill, /100[\s\S]*500[\s\S]*3000[\s\S]*10000/i);
  assert.match(skill, /before concluding[\s\S]*(quote|pair)[\s\S]*unavailable/i);
});

test('routing docs explain that swap quotes are Uniswap-only and Curve is discovery-only', () => {
  const routing = read('skills/use-rlusd-evm-defi/references/routing.md');
  const venues = read('skills/use-rlusd-evm-defi/references/venues.md');

  assert.match(routing, /current quote behavior/i);
  assert.match(routing, /uniswap/i);
  assert.match(routing, /curve/i);
  assert.match(routing, /--venue/i);
  assert.match(venues, /curve/i);
  assert.match(venues, /discovery-only/i);
});

test('troubleshooting tells users to retry common fee tiers for QUOTE_UNAVAILABLE', () => {
  const troubleshooting = read('docs/troubleshooting.md');

  assert.match(troubleshooting, /QUOTE_UNAVAILABLE/);
  assert.match(troubleshooting, /fee-tier/i);
  assert.match(troubleshooting, /100[\s\S]*500[\s\S]*3000[\s\S]*10000/i);
});
