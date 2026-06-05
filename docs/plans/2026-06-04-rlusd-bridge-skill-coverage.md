# RLUSD Bridge Skill Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `rlusd-skills` so the skill layer, docs, and tests cover the latest `rlusd-cli` Wormhole NTT bridge command surface.

**Architecture:** Add a dedicated bridge action skill for RLUSD Wormhole NTT, route bridge prompts from `use-rlusd`, and document the command contract in the same places this repo already documents transfer and DeFi action flows. Keep changing runtime facts in `../rlusd-cli`; this repo should describe the command surface and safety workflow only.

**Tech Stack:** Markdown skills/docs, Node.js `node:test` alignment tests, external sibling runtime at `/Users/luthermartin/t54/rlusd-cli`.

## Current Evidence

- `../rlusd-cli` is current on `main` at `155ab72`.
- `npm run build` passes in `../rlusd-cli`.
- `pnpm test` passes in this repo before bridge coverage changes.
- `rlusd bridge --help` now exposes `routes`, `metadata`, `estimate`, `prepare`, `execute`, `status`, and `history`.
- Current `rlusd-skills` docs and skills have no `bridge`, `Wormhole`, or `NTT` coverage.

## Scope

Add coverage for:

- read-only bridge discovery: `rlusd bridge routes`, `metadata`, `estimate`, `status`, `history`
- prepared bridge action flow: `bridge prepare -> review -> bridge execute`
- supported NTT chain names: `ethereum`, `base`, `optimism`, `ink`, `unichain`
- unsupported route warning: XRPL L1 to EVM is not supported by Wormhole NTT
- wallet and safety guidance for `bridge execute`

Do not add:

- runtime implementation in `rlusd-skills`
- invented bridge metadata outside the CLI surface
- XRPL bridge support
- extra generated assets or broad refactors

## Task 1: Add Failing Bridge Alignment Tests

**Files:**

- Create: `tests/bridge-guidance.test.mjs`

**Step 1: Write the failing test**

Create `tests/bridge-guidance.test.mjs` with these checks:

```js
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
  assert.match(skill, /--refund-address 0x\.\.\./i);
  assert.match(skill, /--queue/i);
  assert.match(skill, /rlusd bridge execute --plan <plan_path_from_prepare> --from-wallet ops --confirm-plan-id <plan_id_from_prepare> --password "\$RLUSD_WALLET_PASSWORD" --json/i);
  assert.match(skill, /rlusd bridge status <id> --json/i);
  assert.match(skill, /operation id[\s\S]*Wormhole sequence[\s\S]*source tx hash[\s\S]*target tx hash/i);
  assert.match(skill, /rlusd bridge history --limit 20 --json/i);
  assert.match(skill, /rlusd bridge history --address 0x\.\.\. --limit 20 --json/i);
  assert.match(skill, /1[\s\S]*100/i);
  assert.match(skill, /ethereum[\s\S]*base[\s\S]*optimism[\s\S]*ink[\s\S]*unichain/i);
  assert.match(skill, /XRPL L1[\s\S]*not supported/i);
  assert.match(skill, /source-chain RPC[\s\S]*quoteDeliveryPrice|quoteDeliveryPrice[\s\S]*source-chain RPC/i);
  assert.match(skill, /writes a local plan/i);
});

test('router skill routes cross-chain RLUSD requests to the bridge skill', () => {
  const router = read('skills/use-rlusd/SKILL.md');

  assert.match(router, /Route to `rlusd-bridge`/i);
  assert.match(router, /bridge|cross-chain|Wormhole|NTT/i);
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
  assert.match(security, /Bridge-Specific Rules[\s\S]*review[\s\S]*execute/i);
  assert.match(troubleshooting, /Unsupported Bridge Route[\s\S]*XRPL L1[\s\S]*not supported/i);
  assert.match(examples, /List Supported Routes[\s\S]*rlusd bridge routes --json/i);
  assert.match(examples, /Prepare a Bridge Plan[\s\S]*rlusd bridge prepare/i);
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
  const skill = read('skills/rlusd-bridge/SKILL.md');
  const commandRef = read('docs/command-reference.md');

  assert.match(cliReadme, /rlusd bridge routes/i);
  assert.match(cliReadme, /rlusd bridge metadata --live/i);
  assert.match(cliReadme, /rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x/i);
  assert.match(skill, /bridge prepare[\s\S]*(non-destructive|auditable plan)/i);
  assert.match(commandRef, /approval calldata[\s\S]*NTT transfer calldata/i);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test
```

Expected: FAIL because `skills/rlusd-bridge/SKILL.md` and `docs/examples/bridge.md` do not exist yet, and router/docs do not mention bridge.

## Task 2: Add the Bridge Skill

**Files:**

- Create: `skills/rlusd-bridge/SKILL.md`

**Step 1: Write minimal skill content**

Use the existing action-skill structure from `skills/rlusd-transfer/SKILL.md` and `skills/rlusd-defi-action/SKILL.md`.

Required sections:

- frontmatter:
  - `name: rlusd-bridge`
  - `description: Execute or inspect RLUSD Wormhole NTT bridge workflows using the external rlusd-cli runtime, including route metadata, estimates, prepared bridge plans, execution, and status checks.`
  - `user-invocable: true`
- Purpose
- When To Use This Skill
- Do Not Use This Skill When
- Decision Guide
- Current Command Sequence
- Common Warnings
- Examples

Required command examples:

```bash
rlusd bridge routes --json
rlusd bridge routes --live --json
rlusd bridge metadata --json
rlusd bridge metadata --live --json
rlusd bridge estimate --from ethereum --to base --amount 500 --json
rlusd bridge estimate --from ethereum --to base --amount 500 --live --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --refund-address 0x... --queue --json
rlusd bridge execute --plan <plan_path_from_prepare> --from-wallet ops --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd bridge status <id> --json
rlusd bridge history --limit 20 --json
rlusd bridge history --address 0x... --limit 20 --json
```

Required warnings:

- supported NTT chains are `ethereum`, `base`, `optimism`, `ink`, and `unichain`
- bridge chain names use NTT family labels, not `ethereum-mainnet`
- XRPL L1 to EVM is not supported by Wormhole NTT
- `bridge prepare` is non-destructive and creates an auditable plan
- `bridge prepare` still needs a source-chain RPC for `quoteDeliveryPrice` and
  writes a local plan file under `~/.config/rlusd-cli/plans`
- `bridge execute` submits approval and NTT transfer transactions from a local EVM wallet
- use `rlusd-wallets` before `bridge execute` when a local wallet alias is needed
- use isolated low-value wallets for initial live bridge execution
- routine verification must not run `bridge execute`; examples are
  documentation only unless the user intentionally provides a funded wallet

**Step 2: Run targeted test**

Run:

```bash
node --test tests/bridge-guidance.test.mjs
```

Expected: partial FAIL. The bridge skill-specific test should pass; router/docs tests should still fail.

## Task 3: Route Bridge Requests From `use-rlusd`

**Files:**

- Modify: `skills/use-rlusd/SKILL.md`

**Step 1: Update routing**

Add `rlusd-bridge` to the decision guide for:

- bridge
- cross-chain
- Wormhole
- NTT
- Base, Optimism, Ink, or Unichain bridge requests

Add bridge command examples to the current command sequence:

```bash
rlusd bridge routes --json
rlusd bridge estimate --from ethereum --to base --amount 500 --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --json
rlusd bridge execute --plan <plan_path_from_prepare> --from-wallet ops --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
```

Add warnings:

- bridge uses NTT chain labels: `ethereum`, `base`, `optimism`, `ink`, `unichain`
- XRPL L1 to EVM bridge is not supported
- before bridge execution, load `rlusd-wallets`

Add examples:

- "Bridge RLUSD from Ethereum to Base." -> use `rlusd-bridge`
- "Show RLUSD Wormhole routes." -> use `rlusd-bridge`

**Step 2: Run targeted test**

Run:

```bash
node --test tests/bridge-guidance.test.mjs
```

Expected: docs tests still fail until README and docs are updated.

## Task 4: Update README and Plugin Descriptions

**Files:**

- Modify: `README.md`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Step 1: README updates**

Update:

- "10 packaged RLUSD skills" -> "11 packaged RLUSD skills"
- Current Coverage: add Wormhole NTT bridge routes, metadata, estimates, prepare/execute, status/history
- Current Constraints: note XRPL L1 to EVM is not supported by Wormhole NTT
- Common Flows: add a short bridge block
- Documentation table: add `docs/examples/bridge.md`
- Skills table: add `rlusd-bridge`
- Action-flow paragraph: include bridge prepare/review/execute

**Step 2: Plugin description updates**

Update descriptions to mention cross-chain bridge support without changing version unless the user asks for release prep.

**Step 3: Run targeted test**

Run:

```bash
node --test tests/bridge-guidance.test.mjs
```

Expected: command-reference/examples/architecture/security/troubleshooting assertions still fail.

## Task 5: Add Command Reference and Bridge Examples

**Files:**

- Modify: `docs/command-reference.md`
- Create: `docs/examples/bridge.md`

**Step 1: Command reference**

Add `## bridge` after DeFi or before Fiat.

Document:

- `bridge routes`
- `bridge metadata`
- `bridge estimate`
- `bridge prepare`
- `bridge execute`
- `bridge status`
- `bridge history`
- options: `--live`, `--refund-address`, `--queue`, `--address`, and
  `--limit` range 1 through 100

Include:

- supported chains
- returned route/estimate fields
- emitted prepare response fields: `plan_id`, `plan_path`, `approval_data`,
  `transfer_data`, `required_native_value_wei`, and
  `required_native_value_eth`
- stored plan fields: `human_summary`, `intent.steps[].action = approve`,
  `intent.steps[].action = ntt_transfer`, and chain/recipient intent fields
- execute returns submitted transaction hashes
- XRPL L1 to EVM unsupported warning

Update `Current Supported Chain Keys` so it distinguishes:

- registry-backed skill examples: `ethereum-mainnet`, `xrpl-mainnet`
- bridge NTT labels: `ethereum`, `base`, `optimism`, `ink`, `unichain`

Document the current error behavior: unsupported bridge routes and XRPL L1
bridge attempts currently surface as structured `COMMAND_ERROR` responses. Do
not invent bridge-specific error codes unless the CLI adds them.

**Step 2: Bridge examples**

Create `docs/examples/bridge.md` with:

- prerequisites
- list routes
- inspect metadata
- estimate Ethereum to Base
- prepare Ethereum to Base
- execute a reviewed plan
- check status/history
- explicit XRPL unsupported note
- note that `status <id>` accepts operation id, Wormhole sequence, source tx
  hash, or target tx hash
- note that `history --limit` accepts 1 through 100 and can filter by
  `--address`

**Step 3: Run targeted test**

Run:

```bash
node --test tests/bridge-guidance.test.mjs
```

Expected: architecture/security/troubleshooting assertions may still fail.

## Task 6: Update Architecture, Security, and Troubleshooting

**Files:**

- Modify: `docs/architecture.md`
- Modify: `docs/security.md`
- Modify: `docs/troubleshooting.md`

**Step 1: Architecture**

Update CLI namespaces to include `bridge`.

Add Bridge subsection:

- Wormhole NTT route metadata and status are CLI-backed
- `bridge prepare` creates a local plan with ERC-20 approval and NTT transfer intent
- `bridge execute` submits stored approval and transfer steps
- bridge chain labels are `ethereum`, `base`, `optimism`, `ink`, `unichain`
- XRPL L1 is outside this NTT surface

**Step 2: Security**

Add Bridge-Specific Rules:

- review plan before execution
- execution uses local EVM wallet alias and wallet password
- native delivery value and transaction calldata must be reviewed
- use low-value funded wallets for initial live execution
- no XRPL bridge assumption

**Step 3: Troubleshooting**

Add:

- Unsupported Bridge Route
- Live Wormholescan metadata unavailable
- Bridge delivery quote or RPC unavailable

Use current CLI language where available; do not invent exact error codes unless verified.

**Step 4: Run targeted test**

Run:

```bash
node --test tests/bridge-guidance.test.mjs
```

Expected: PASS.

## Task 7: Full Verification

**Files:**

- No edits unless verification finds a real gap.

**Step 1: Verify current CLI remains buildable**

Run:

```bash
cd ../rlusd-cli
npm run build
```

Expected: build success.

**Step 2: Verify bridge CLI examples still work for read-only commands**

Run:

```bash
cd ../rlusd-cli
./dist/bin/rlusd.js bridge --help
./dist/bin/rlusd.js bridge routes --json
./dist/bin/rlusd.js bridge metadata --json
./dist/bin/rlusd.js bridge estimate --from ethereum --to base --amount 500 --json
./dist/bin/rlusd.js bridge history --limit 1 --json
./dist/bin/rlusd.js bridge estimate --from xrpl --to base --amount 1 --json
```

Expected:

- help lists all bridge subcommands
- routes returns `ok: true`
- metadata returns `ok: true`
- estimate returns `ok: true`, `route.from = ethereum`, `route.to = base`, and static metadata warning when live metadata is not requested
- history returns `ok: true`
- unsupported XRPL bridge returns structured failure with `code = COMMAND_ERROR`
- do not run `bridge execute` during verification

**Step 3: Verify docs and skills**

Run:

```bash
cd ../rlusd-skills
pnpm test
pnpm build
pnpm typecheck
```

Expected:

- `pnpm test`: all tests pass
- `pnpm build`: docs-only smoke output
- `pnpm typecheck`: docs-only smoke output

**Step 4: Inspect final diff**

Run:

```bash
git diff --stat
git diff --check
git status --short --branch --untracked-files=all
```

Expected:

- diff only touches bridge coverage files plus the implementation plan
- no whitespace errors
- pre-existing untracked `AGENTS.md` remains untracked and unchanged
