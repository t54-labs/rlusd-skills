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

test('routing docs explain explicit chain and venue usage for top-level defi discovery flows', () => {
  const routing = read('skills/use-rlusd-evm-defi/references/routing.md');
  const venues = read('skills/use-rlusd-evm-defi/references/venues.md');

  assert.match(routing, /defi quote swap[\s\S]*--chain[\s\S]*--venue/i);
  assert.match(routing, /switch to `rlusd-defi-action`/i);
  assert.doesNotMatch(routing, /defi swap prepare/i);
  assert.doesNotMatch(routing, /defi swap execute/i);
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

test('docs keep defi lp preview distinct from prepared-plan outputs', () => {
  const cliReadme = read('../rlusd-cli/README.md');
  const framework = read('../rlusd-cli/docs/FRAMEWORK.md');
  const examples = read('docs/examples/defi.md');
  const skill = read('skills/use-rlusd-evm-defi/SKILL.md');

  assert.doesNotMatch(cliReadme, /defi lp preview\|prepare\|execute[\s\S]*prepared-plan contract/i);
  assert.doesNotMatch(framework, /defi lp preview\|prepare\|execute[\s\S]*intent\.steps\[\]/i);
  assert.match(examples, /defi lp preview/i);
  assert.match(examples, /preview-only|does not return `plan_id`, `plan_path`, or `intent\.steps`/i);
  assert.match(skill, /defi lp preview/i);
  assert.match(skill, /preview-only|does not return `plan_id`, `plan_path`, or `intent\.steps`/i);
});

test('ethereum read guidance matches the current CLI balance and allowance surfaces', () => {
  const cliReadme = read('../rlusd-cli/README.md');
  const routing = read('skills/use-rlusd/SKILL.md');
  const ethSkill = read('skills/use-rlusd-ethereum/SKILL.md');
  const examples = read('docs/examples/ethereum.md');
  const commandRef = read('docs/command-reference.md');
  const troubleshooting = read('docs/troubleshooting.md');

  assert.match(cliReadme, /rlusd balance --chain ethereum/i);
  assert.match(cliReadme, /rlusd eth allowance --spender/i);

  for (const doc of [routing, examples, commandRef]) {
    assert.doesNotMatch(doc, /rlusd evm balance/i);
    assert.doesNotMatch(doc, /rlusd evm allowance/i);
  }

  assert.match(routing, /rlusd balance --chain ethereum --address 0x\.\.\. --json/i);
  assert.match(routing, /rlusd eth allowance --chain ethereum --owner-wallet ops --spender 0x\.\.\. --json/i);
  assert.match(routing, /defi quote swap[\s\S]*--venue/i);
  assert.match(ethSkill, /run `balance`/i);
  assert.match(ethSkill, /run `eth allowance`/i);
  assert.match(examples, /rlusd balance[\s\S]*--chain ethereum[\s\S]*--address/i);
  assert.match(examples, /rlusd eth allowance[\s\S]*--chain ethereum[\s\S]*--owner-wallet ops[\s\S]*--spender/i);
  assert.match(commandRef, /### `balance`[\s\S]*rlusd balance --chain <chain> --address <address> --json/i);
  assert.match(
    commandRef,
    /### `eth allowance`[\s\S]*rlusd eth allowance --chain <chain> --owner-wallet <wallet_name> --spender <address> --json/i,
  );
  assert.match(troubleshooting, /unknown command 'balance'|evm balance/i);
});

test('wallet skill uses json consistently for agent-facing command examples', () => {
  const walletSkill = read('skills/rlusd-wallets/SKILL.md');

  assert.match(walletSkill, /rlusd config get --json/i);
  assert.match(walletSkill, /rlusd wallet list --json/i);
  assert.match(walletSkill, /rlusd wallet address --chain ethereum --json/i);
  assert.match(walletSkill, /rlusd wallet address --chain xrpl --json/i);
  assert.match(walletSkill, /rlusd wallet generate --chain ethereum --name ops --password "\$RLUSD_WALLET_PASSWORD" --json/i);
  assert.match(walletSkill, /rlusd wallet import --chain ethereum --name ops --private-key 0x\.\.\. --password "\$RLUSD_WALLET_PASSWORD" --json/i);
  assert.match(walletSkill, /rlusd wallet use ops --chain ethereum --json/i);
});

test('discovery skill stops at discovery and preview while action skill owns prepare and execute flows', () => {
  const discoverySkill = read('skills/use-rlusd-evm-defi/SKILL.md');
  const actionSkill = read('skills/rlusd-defi-action/SKILL.md');

  assert.match(discoverySkill, /rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json/i);
  assert.match(discoverySkill, /rlusd defi quote swap --chain ethereum-mainnet --venue curve --from RLUSD --to USDC --amount 1000 --json/i);
  assert.match(discoverySkill, /rlusd defi lp preview --chain ethereum-mainnet --venue curve --operation add --rlusd-amount 1000 --usdc-amount 1000 --json/i);
  assert.match(discoverySkill, /rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json/i);
  assert.doesNotMatch(discoverySkill, /defi swap prepare/i);
  assert.doesNotMatch(discoverySkill, /defi swap execute/i);
  assert.doesNotMatch(discoverySkill, /defi lp prepare/i);
  assert.doesNotMatch(discoverySkill, /defi lp execute/i);
  assert.doesNotMatch(discoverySkill, /defi supply prepare/i);
  assert.doesNotMatch(discoverySkill, /defi supply execute/i);

  assert.match(actionSkill, /defi swap prepare/i);
  assert.match(actionSkill, /defi swap execute/i);
  assert.match(actionSkill, /defi lp prepare/i);
  assert.match(actionSkill, /defi lp execute/i);
  assert.match(actionSkill, /defi supply prepare/i);
  assert.match(actionSkill, /defi supply execute/i);
});

test('router skill gives a default start command for ambiguous RLUSD requests', () => {
  const routing = read('skills/use-rlusd/SKILL.md');

  assert.match(routing, /start with `rlusd resolve asset --chain ethereum-mainnet --json`/i);
  assert.match(
    routing,
    /if the user already said defi, start with `rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json`/i,
  );
});

test('docs recommend explicit chain and venue without overstating runtime requirements', () => {
  const cliReadme = read('../rlusd-cli/README.md');
  const framework = read('../rlusd-cli/docs/FRAMEWORK.md');
  const skillsReadme = read('README.md');
  const commandRef = read('docs/command-reference.md');
  const troubleshooting = read('docs/troubleshooting.md');
  const skill = read('skills/use-rlusd-evm-defi/SKILL.md');
  const actionSkill = read('skills/rlusd-defi-action/SKILL.md');

  assert.doesNotMatch(cliReadme, /always require an explicit `--chain`/i);
  assert.doesNotMatch(cliReadme, /all swap or LP flows require an explicit `--venue`/i);
  assert.doesNotMatch(framework, /require an explicit `--chain`; swap and LP flows also require an explicit `--venue`/i);
  assert.doesNotMatch(skillsReadme, /requires explicit `--chain` and explicit `--venue`/i);
  assert.doesNotMatch(commandRef, /all top-level DeFi quote calls require explicit `--chain` and explicit `--venue`/i);
  assert.doesNotMatch(troubleshooting, /`defi quote swap` requires explicit `--chain` and explicit `--venue`/i);
  assert.doesNotMatch(skill, /Top-level `defi` flows require explicit `--chain`/i);
  assert.doesNotMatch(actionSkill, /Top-level `defi` flows require explicit `--chain`/i);
});
