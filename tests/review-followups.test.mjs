import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('execute examples include the wallet password requirement', () => {
  const commandRef = read('docs/command-reference.md');
  const routerSkill = read('skills/use-rlusd/SKILL.md');
  const transferSkill = read('skills/rlusd-transfer/SKILL.md');
  const trustlineSkill = read('skills/rlusd-trustline/SKILL.md');
  const defiActionSkill = read('skills/rlusd-defi-action/SKILL.md');

  assert.match(
    commandRef,
    /rlusd evm transfer execute --plan <path> \[--confirm-plan-id <plan_id>\] --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    commandRef,
    /rlusd xrpl trustline execute --plan <path> \[--confirm-plan-id <plan_id>\] --wallet <wallet_name> --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    commandRef,
    /rlusd defi swap execute --plan <path> \[--confirm-plan-id <plan_id>\] --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    transferSkill,
    /rlusd evm transfer execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    transferSkill,
    /rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    trustlineSkill,
    /rlusd xrpl trustline execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    defiActionSkill,
    /rlusd defi supply execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
  assert.match(
    routerSkill,
    /rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "\$RLUSD_WALLET_PASSWORD" --json/i
  );
});

test('fiat guidance skill reflects provider-based manual instructions', () => {
  const skill = read('skills/buy-redeem-rlusd/SKILL.md');
  const routerSkill = read('skills/use-rlusd/SKILL.md');

  assert.match(skill, /provider and rail guidance/i);
  assert.match(skill, /manual and chain-agnostic/i);
  assert.doesNotMatch(skill, /institutional onboarding, buy, and redeem guidance/i);
  assert.doesNotMatch(skill, /Ripple's institutional process/i);
  assert.match(routerSkill, /fiat buy\/redeem guidance/i);
});

test('DeFi risk model matches the current execution surface', () => {
  const riskModel = read('skills/use-rlusd-evm-defi/references/risk-model.md');

  assert.doesNotMatch(riskModel, /swap execution is not implemented/i);
  assert.match(riskModel, /swap execution is available/i);
  assert.match(riskModel, /Curve LP execution is available/i);
  assert.match(riskModel, /supply execution is `aave`-only/i);
});

test('docs explain chain key conventions and the xrpl trustline status chain flag', () => {
  const commandRef = read('docs/command-reference.md');
  const routerSkill = read('skills/use-rlusd/SKILL.md');

  assert.match(
    commandRef,
    /some CLI help output may only list `--address`[\s\S]*`--chain` is still accepted via the global flag/i
  );
  assert.match(
    routerSkill,
    /top-level reads such as `balance`, `eth allowance`, and `wallet` commands use\s+family aliases `ethereum` and `xrpl`[\s\S]*network-scoped commands use\s+`ethereum-mainnet` and `xrpl-mainnet`/i
  );
});
