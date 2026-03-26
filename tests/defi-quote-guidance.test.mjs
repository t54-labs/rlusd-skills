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

test('routing docs explain explicit chain and venue usage for top-level defi flows', () => {
  const routing = read('skills/use-rlusd-evm-defi/references/routing.md');
  const venues = read('skills/use-rlusd-evm-defi/references/venues.md');

  assert.match(routing, /defi quote swap[\s\S]*--chain[\s\S]*--venue/i);
  assert.match(routing, /defi swap prepare/i);
  assert.match(routing, /defi swap execute/i);
  assert.doesNotMatch(routing, /uniswap-only/i);
  assert.match(venues, /curve/i);
  assert.doesNotMatch(venues, /discovery-only/i);
  assert.match(venues, /live quote|swap prepare|lp/i);
});

test('troubleshooting tells users to retry common fee tiers for QUOTE_UNAVAILABLE', () => {
  const troubleshooting = read('docs/troubleshooting.md');

  assert.match(troubleshooting, /QUOTE_UNAVAILABLE/);
  assert.match(troubleshooting, /fee-tier/i);
  assert.match(troubleshooting, /100[\s\S]*500[\s\S]*3000[\s\S]*10000/i);
  assert.match(troubleshooting, /--venue/i);
});

test('docs describe prepared swap and curve lp flows on ethereum mainnet', () => {
  const examples = read('docs/examples/defi.md');
  const skill = read('skills/rlusd-defi-action/SKILL.md');

  assert.match(examples, /defi swap prepare/i);
  assert.match(examples, /defi swap execute/i);
  assert.match(examples, /defi lp preview/i);
  assert.match(examples, /defi lp prepare/i);
  assert.match(examples, /defi lp execute/i);
  assert.match(examples, /ethereum-mainnet/i);

  assert.match(skill, /defi swap prepare/i);
  assert.match(skill, /defi swap execute/i);
  assert.match(skill, /defi lp preview|defi lp prepare|defi lp execute/i);
});
