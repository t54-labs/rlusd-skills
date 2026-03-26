import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('command reference documents structured XRPL trustline status fields', () => {
  const commandRef = read('docs/command-reference.md');

  assert.match(commandRef, /xrpl trustline status[\s\S]*has_trustline/i);
  assert.match(commandRef, /xrpl trustline status[\s\S]*account_exists/i);
});

test('XRPL payment docs call out the issuer trustline exception', () => {
  const transferSkill = read('skills/rlusd-transfer/SKILL.md');
  const paymentsRef = read('skills/use-rlusd-xrpl/references/payments.md');
  const combined = `${transferSkill}\n${paymentsRef}`;

  assert.match(combined, /issuer account[\s\S]*does not require[\s\S]*trust line/i);
});

test('DeFi docs describe freshness metadata on Curve LP previews', () => {
  const commandRef = read('docs/command-reference.md');
  const examples = read('docs/examples/defi.md');
  const skill = read('skills/use-rlusd-evm-defi/SKILL.md');

  assert.match(commandRef, /defi lp preview[\s\S]*quoted_at[\s\S]*ttl_seconds[\s\S]*expires_at/i);
  assert.match(examples, /Preview a Curve LP Add Flow[\s\S]*quoted_at[\s\S]*ttl_seconds[\s\S]*expires_at/i);
  assert.match(skill, /defi lp preview[\s\S]*quoted_at[\s\S]*ttl_seconds[\s\S]*expires_at/i);
});

test('Fiat docs describe chain-agnostic guidance envelopes', () => {
  const commandRef = read('docs/command-reference.md');
  const skill = read('skills/buy-redeem-rlusd/SKILL.md');

  assert.match(commandRef, /chain-agnostic|does not include `chain`|omits `chain`/i);
  assert.match(skill, /chain-agnostic|does not include `chain`|omits `chain`/i);
});
