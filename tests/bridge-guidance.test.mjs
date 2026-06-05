import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('bridge skill documents the current Wormhole NTT command surface', () => {
  const skill = read('skills/rlusd-bridge/SKILL.md');

  assert.match(skill, /Wormhole NTT/i);
  assert.match(skill, /rlusd bridge routes --json/i);
  assert.match(skill, /rlusd bridge routes --live --json/i);
  assert.match(skill, /rlusd bridge metadata --json/i);
  assert.match(skill, /rlusd bridge metadata --live --json/i);
  assert.match(skill, /rlusd bridge estimate --from ethereum --to base --amount 500 --json/i);
  assert.match(skill, /rlusd bridge estimate --from ethereum --to base --amount 500 --live --json/i);
  assert.match(skill, /rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x\.\.\. --json/i);
  assert.match(skill, /rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x\.\.\. --live --json/i);
  assert.match(skill, /--refund-address 0x\.\.\./i);
  assert.match(skill, /--queue/i);
  assert.match(skill, /rlusd bridge execute --plan <plan_path_from_prepare> --from-wallet ops --confirm-plan-id <plan_id_from_prepare> --password "\$RLUSD_WALLET_PASSWORD" --json/i);
  assert.match(skill, /rlusd bridge status <id> --json/i);
  assert.match(skill, /operation id[\s\S]*Wormhole sequence[\s\S]*source tx hash[\s\S]*target tx hash/i);
  assert.match(skill, /rlusd bridge history --limit 20 --json/i);
  assert.match(skill, /rlusd bridge history --address 0x\.\.\. --limit 20 --json/i);
  assert.match(skill, /limit[\s\S]*1[\s\S]*100/i);
  assert.match(skill, /ethereum[\s\S]*base[\s\S]*optimism[\s\S]*ink[\s\S]*unichain/i);
  assert.match(skill, /XRPL L1[\s\S]*not supported/i);
  assert.match(skill, /XRPL L1 bridge[\s\S]*explain unsupported/i);
  assert.match(skill, /do not prepare or execute/i);
  assert.match(skill, /(source-chain RPC[\s\S]*quoteDeliveryPrice|quoteDeliveryPrice[\s\S]*source-chain RPC)/i);
  assert.match(skill, /writes a local plan/i);
  assert.match(skill, /Routine verification must not run `bridge execute`/i);
});

test('router skill routes cross-chain RLUSD requests to the bridge skill', () => {
  const router = read('skills/use-rlusd/SKILL.md');

  assert.match(router, /Route to `rlusd-bridge`/i);
  assert.match(router, /bridge/i);
  assert.match(router, /cross-chain/i);
  assert.match(router, /Wormhole/i);
  assert.match(router, /NTT/i);
  assert.match(router, /rlusd bridge routes --json/i);
  assert.match(router, /rlusd bridge estimate --from ethereum --to base --amount 500 --json/i);
});

test('repo docs include bridge coverage and safety constraints', () => {
  const readme = read('README.md');
  const commandRef = read('docs/command-reference.md');
  const architecture = read('docs/architecture.md');
  const security = read('docs/security.md');
  const troubleshooting = read('docs/troubleshooting.md');
  const examples = read('docs/examples/bridge.md');

  assert.match(readme, /11 packaged RLUSD skills/i);
  assert.match(readme, /rlusd-bridge/i);
  assert.match(readme, /Wormhole NTT/i);
  assert.match(commandRef, /## `bridge`/i);
  for (const command of [
    'bridge routes',
    'bridge metadata',
    'bridge estimate',
    'bridge prepare',
    'bridge execute',
    'bridge status',
    'bridge history',
  ]) {
    assert.match(commandRef, new RegExp(command, 'i'));
  }
  assert.match(commandRef, /approval_data/i);
  assert.match(commandRef, /transfer_data/i);
  assert.match(commandRef, /required_native_value_wei/i);
  assert.match(commandRef, /human_summary[\s\S]*stored plan/i);
  assert.match(commandRef, /XRPL L1[\s\S]*not supported/i);
  assert.match(architecture, /Bridge[\s\S]*Wormhole NTT/i);
  assert.match(architecture, /bridge status <id>[\s\S]*bridge history/i);
  assert.match(security, /Bridge-Specific Rules[\s\S]*review[\s\S]*execute/i);
  assert.match(security, /do not run `bridge execute` during docs or skill verification/i);
  assert.match(security, /wait\/receipt[\s\S]*bridge status\/history/i);
  assert.match(troubleshooting, /Unsupported Bridge Route[\s\S]*XRPL L1[\s\S]*not supported/i);
  assert.match(examples, /List Supported Routes[\s\S]*rlusd bridge routes --json/i);
  assert.match(examples, /Prepare a Bridge Plan[\s\S]*rlusd bridge prepare/i);
  assert.match(examples, /--live/i);
  assert.match(examples, /Do not run it during docs verification/i);
});

test('plugin metadata advertises bridge coverage', () => {
  const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
  const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));

  assert.match(plugin.description, /bridge|Wormhole|cross-chain/i);
  assert.match(marketplace.metadata.description, /bridge|Wormhole|cross-chain/i);
  assert.match(marketplace.plugins[0].description, /bridge|Wormhole|cross-chain/i);
});

test('bridge docs stay aligned with the updated CLI README', () => {
  const cliReadme = read('../rlusd-cli/README.md');
  const bridgeCommand = read('../rlusd-cli/src/commands/bridge.cmd.ts');
  const skill = read('skills/rlusd-bridge/SKILL.md');
  const commandRef = read('docs/command-reference.md');

  assert.match(cliReadme, /rlusd bridge routes/i);
  assert.match(cliReadme, /rlusd bridge metadata --live/i);
  assert.match(cliReadme, /rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x/i);
  assert.match(bridgeCommand, /\.option\("--live"[\s\S]*bridgeCmd[\s\S]*\.command\("execute"\)/i);
  assert.match(bridgeCommand, /approval_data/i);
  assert.match(bridgeCommand, /transfer_data/i);
  assert.match(bridgeCommand, /required_native_value_wei/i);
  assert.match(bridgeCommand, /approval_tx_hash/i);
  assert.match(bridgeCommand, /transfer_tx_hash/i);
  assert.match(skill, /bridge prepare[\s\S]*(non-destructive|auditable plan)/i);
  assert.match(commandRef, /approval calldata[\s\S]*NTT transfer calldata/i);
});
