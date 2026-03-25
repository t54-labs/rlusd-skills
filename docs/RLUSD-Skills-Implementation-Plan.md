# RLUSD Skills for AI Agent CLI — Implementation Plan

- **Status:** Draft v1.0
- **Owner:** Engineering
- **Last updated:** 2026-03-25
- **Assumption:** This plan targets a local repo + CLI workflow with Claude-style skills, no MCP, and a mainnet-only initial scope.

## 1. Build Strategy

Implement the product in **three layers**:

1. **Skill layer** — markdown playbooks that teach the agent how to classify RLUSD tasks and which command sequence to run.
2. **CLI layer** — deterministic local commands with JSON output and an explicit transaction lifecycle.
3. **Registry / adapter layer** — the source of changing runtime truth such as contract addresses, issuer accounts, supported venues, and policy thresholds.

This split is deliberate:

- Circle's public skills repo is a plugin-hosted library of reusable skills rather than a monolithic SDK.[1]
- Claude Code skills can be background-only or manual-only depending on frontmatter, which is ideal for separating reference guidance from side-effecting workflows.[2]
- Ripple's RLUSD docs expose stable integration rules on Ethereum and XRPL, while the exact contract and issuer data belongs in a runtime-configurable layer.[3][4]

## 2. Recommended Tech Stack

This plan assumes:

- **Language:** TypeScript
- **Package manager:** pnpm
- **CLI runtime:** Node.js
- **CLI framework:** `commander` or equivalent
- **EVM client:** `viem`
- **XRPL client:** `xrpl.js`
- **Validation:** `zod`
- **Testing:** `vitest`
- **Formatting / linting:** `prettier` + `eslint`

Why this stack:

- `viem` is a modern, type-safe TypeScript interface for Ethereum.[5]
- `xrpl.js` is the recommended JavaScript/TypeScript library for advanced XRP Ledger integrations.[6]
- TypeScript makes it easier to keep command schemas, config schemas, and adapter contracts aligned.

### Security note

Pin all blockchain SDK versions via lockfile and review advisories before release. XRPL ecosystem packages have had supply-chain incidents before, so dependency hygiene is part of the plan, not a later hardening task.[7]

## 3. Target Repository Layout

```text
rlusd-skills/
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   └── ripple/
│       ├── README.md
│       └── skills/
│           ├── use-rlusd/
│           │   └── SKILL.md
│           ├── use-rlusd-ethereum/
│           │   ├── SKILL.md
│           │   └── references/
│           │       ├── contracts.md
│           │       ├── permit.md
│           │       └── transfers.md
│           ├── use-rlusd-xrpl/
│           │   ├── SKILL.md
│           │   └── references/
│           │       ├── trustlines.md
│           │       ├── issuer-settings.md
│           │       └── payments.md
│           ├── use-rlusd-evm-defi/
│           │   ├── SKILL.md
│           │   └── references/
│           │       ├── venues.md
│           │       ├── routing.md
│           │       └── risk-model.md
│           ├── buy-redeem-rlusd/
│           │   └── SKILL.md
│           ├── rlusd-transfer/
│           │   └── SKILL.md
│           ├── rlusd-trustline/
│           │   └── SKILL.md
│           └── rlusd-defi-action/
│               └── SKILL.md
├── cli/
│   └── rlusd/
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── commands/
│       │   ├── adapters/
│       │   ├── registry/
│       │   ├── policy/
│       │   ├── plans/
│       │   ├── schemas/
│       │   ├── wallets/
│       │   └── utils/
│       └── test/
└── docs/
    ├── examples/
    ├── architecture.md
    └── command-reference.md
```

## 4. Skill Design

### 4.1 Skill Types

Use two categories.

#### A. Background / routing / reference skills

Use for:

- `use-rlusd`
- `use-rlusd-ethereum`
- `use-rlusd-xrpl`
- `use-rlusd-evm-defi`
- `buy-redeem-rlusd`

Recommended frontmatter pattern:

```yaml
---
name: use-rlusd-ethereum
description: RLUSD on EVM chains. Use for balances, transfers, approvals, permit, and DeFi routing.
user-invocable: false
---
```

Rationale: these are background playbooks that Claude should be able to load automatically when relevant.[2]

#### B. Manual-only action skills

Use for:

- `rlusd-transfer`
- `rlusd-trustline`
- `rlusd-defi-action`

Recommended frontmatter pattern:

```yaml
---
name: rlusd-transfer
description: Prepare and execute an RLUSD transfer using the local CLI.
disable-model-invocation: true
---
```

Rationale: Claude docs explicitly recommend `disable-model-invocation: true` for workflows with side effects.[2]

### 4.2 Skill Content Template

Every skill should follow the same skeleton:

1. **Purpose**
2. **When to use this skill**
3. **Do not use this skill when**
4. **Decision guide**
5. **Command sequence**
6. **Common warnings / failure modes**
7. **Examples**
8. **References**

### 4.3 Core Skill Logic

#### `use-rlusd`

Responsibilities:

- detect chain from prompt artifacts:
  - `0x...`, allowance, permit, approve, Uniswap, Aave -> EVM
  - `r...`, trust line, destination tag, TrustSet -> XRPL
  - bank account, wire, redeem, onboarding -> institutional/reference flow
- map the intent to read / preview / prepare / execute
- load a more specific skill
- enforce the rule that all writes go through `prepare` first

#### `use-rlusd-ethereum`

Responsibilities:

- teach that RLUSD is ERC-20 on Ethereum and should be integrated through the **proxy address** rather than the implementation address;[3]
- encode 18-decimal handling;[3]
- distinguish approval vs permit vs transfer flows;
- warn about admin features like freeze, clawback, and upgradeability as integration constraints, not user actions.[8]

#### `use-rlusd-xrpl`

Responsibilities:

- teach that RLUSD is an XRPL issued token with issuer-based trust-line semantics;[4]
- require trust line checks before payment flows;[4][9]
- surface destination-tag awareness;
- document issuer-side settings that matter for expectations.

#### `use-rlusd-evm-defi`

Responsibilities:

- handle venue discovery, route preview, supply/borrow preview, LP/vault preview;
- enforce venue capability checks from registry;
- distinguish preview from execution;
- warn when an action would require prior approval or permit;
- keep venue specifics outside core skill prose.

#### `buy-redeem-rlusd`

Responsibilities:

- explain onboarding steps, approved bank account requirements, wallet IDs, and chain-specific prerequisites like XRPL trust lines;[10][11][12]
- provide operator checklists and instruction surfaces;
- explicitly state that v1 does not automate bank-wire submission.

## 5. CLI Design

### 5.1 Command Philosophy

The CLI should be built around a tiny set of verbs with uniform semantics:

- `resolve`
- `status`
- `quote`
- `preview`
- `prepare`
- `execute`
- `wait`
- `receipt`

This lets agents learn one execution grammar and reuse it everywhere.

### 5.2 Top-Level Namespaces

```bash
rlusd resolve ...
rlusd evm ...
rlusd xrpl ...
rlusd defi ...
rlusd fiat ...
rlusd config ...
```

### 5.3 Initial Command Surface

#### Resolve / Registry

```bash
rlusd resolve asset --chain ethereum-mainnet --json
rlusd resolve asset --chain xrpl-mainnet --json
rlusd resolve venue --chain ethereum-mainnet --venue aave --json
rlusd resolve policy --json
```

#### EVM Read Path

```bash
rlusd evm balance --chain ethereum-mainnet --address 0x... --json
rlusd evm allowance --chain ethereum-mainnet --owner 0x... --spender 0x... --json
rlusd evm tx receipt --hash 0x... --json
```

#### EVM Write Path

```bash
rlusd evm transfer prepare --chain ethereum-mainnet --from wallet:ops --to 0x... --amount 25.5 --json
rlusd evm transfer execute --plan ./plan.json --json
rlusd evm approve prepare --chain ethereum-mainnet --owner wallet:ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan ./plan.json --json
rlusd evm permit build --chain ethereum-mainnet --owner wallet:ops --spender 0x... --amount 1000 --json
rlusd evm tx wait --hash 0x... --json
```

#### XRPL Read Path

```bash
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
rlusd xrpl account info --chain xrpl-mainnet --address r... --json
rlusd xrpl payment receipt --hash <txid> --json
```

#### XRPL Write Path

```bash
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan ./plan.json --json
rlusd xrpl payment prepare --chain xrpl-mainnet --from wallet:ops --to r... --amount 250 --json
rlusd xrpl payment execute --plan ./plan.json --json
rlusd xrpl tx wait --hash <txid> --json
```

#### DeFi Preview / Execution

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply execute --plan ./plan.json --json
```

#### Fiat / Institutional Guidance

```bash
rlusd fiat onboarding checklist --json
rlusd fiat buy instructions --wallet-id <wallet-id> --chain xrpl-mainnet --json
rlusd fiat redeem instructions --wallet-id <wallet-id> --amount 10000 --json
```

The `fiat` namespace is intentionally guidance-oriented in v1 because Ripple's current public flow depends on UI onboarding, approved bank accounts, and bank wires.[10][11][12]

## 6. JSON Contracts

### 6.1 Rules

Every command must:

- support `--json`;
- return valid JSON on stdout;
- return non-zero exit code on failure;
- use a shared envelope structure.

### 6.2 Shared Response Envelope

```json
{
  "ok": true,
  "command": "evm.transfer.prepare",
  "chain": "ethereum-mainnet",
  "timestamp": "2026-03-24T18:00:00Z",
  "data": {},
  "warnings": [],
  "next": []
}
```

### 6.3 Plan Schema

```json
{
  "ok": true,
  "command": "evm.transfer.prepare",
  "chain": "ethereum-mainnet",
  "data": {
    "plan_id": "plan_01H...",
    "action": "evm.transfer",
    "requires_confirmation": true,
    "human_summary": "Transfer 25.5 RLUSD from wallet:ops to 0xabc... on Ethereum Mainnet",
    "asset": {
      "symbol": "RLUSD",
      "address": "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
      "address_type": "proxy",
      "decimals": 18
    },
    "params": {
      "from": "wallet:ops",
      "to": "0xabc...",
      "amount": "25.5"
    }
  },
  "warnings": ["mainnet", "real_funds"],
  "next": [
    {
      "command": "rlusd evm transfer execute --plan ./plan.json --json"
    }
  ]
}
```

### 6.4 Error Schema

```json
{
  "ok": false,
  "command": "xrpl.payment.prepare",
  "error": {
    "code": "TRUSTLINE_MISSING",
    "message": "Destination account does not currently have an RLUSD trust line.",
    "retryable": false,
    "suggested_next_steps": [
      "Run rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json",
      "Prepare a trust line before retrying payment preparation"
    ]
  },
  "warnings": []
}
```

## 7. Registry Design

### 7.1 Purpose

The registry holds values that can change without rewriting skill prose:

- chain metadata,
- RLUSD addresses and issuers,
- venue metadata,
- policy thresholds,
- wallet aliases.

### 7.2 File Layout

```text
src/registry/
  chains/
    ethereum-mainnet.json
    xrpl-mainnet.json
  assets/
    rlusd.json
  venues/
    aave.json
    uniswap.json
    curve.json
  policy/
    default.json
```

### 7.3 Example Chain Registry: Ethereum Mainnet

```json
{
  "chain": "ethereum-mainnet",
  "family": "evm",
  "rpc_url_env": "ETHEREUM_MAINNET_RPC_URL",
  "assets": {
    "RLUSD": {
      "symbol": "RLUSD",
      "decimals": 18,
      "implementation_address": "0x9747a0d261c2d56eb93f542068e5d1e23170fa9e",
      "proxy_address": "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD"
    }
  }
}
```

These values come from Ripple's current Ethereum documentation.[3]

### 7.4 Example Chain Registry: XRPL Mainnet

```json
{
  "chain": "xrpl-mainnet",
  "family": "xrpl",
  "rpc_url": "https://xrplcluster.com/",
  "ws_url": "wss://xrplcluster.com",
  "issuer": "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
  "currency": "RLUSD"
}
```

These values come from Ripple's current XRPL documentation.[4]

### 7.5 Venue Registry Schema

```json
{
  "venue": "aave",
  "chain": "ethereum-mainnet",
  "capabilities": ["lend", "borrow"],
  "approval_mode": "approve_or_permit",
  "collateral_supported": false,
  "status": "experimental",
  "notes": [
    "Use preview before prepare",
    "Verify current policy before production"
  ]
}
```

`collateral_supported` is intentionally explicit because RLUSD venue treatment may differ by protocol and deployment.

## 8. Adapter Architecture

### 8.1 Core Interfaces

```ts
interface ReadAdapter {
  balance(input: BalanceInput): Promise<BalanceOutput>
  allowance?(input: AllowanceInput): Promise<AllowanceOutput>
  status?(input: StatusInput): Promise<StatusOutput>
}

interface PlanAdapter {
  prepare(input: PrepareInput): Promise<PlanOutput>
  execute(input: ExecuteInput): Promise<ExecuteOutput>
  wait?(input: WaitInput): Promise<WaitOutput>
  receipt?(input: ReceiptInput): Promise<ReceiptOutput>
}
```

### 8.2 EVM Adapter Responsibilities

- use registry-resolved proxy address for RLUSD;[3]
- read balances and allowances;
- encode `transfer`, `approve`, and permit payloads;
- sign and submit transactions through a wallet backend;
- normalize receipts and confirmations.

### 8.3 XRPL Adapter Responsibilities

- resolve issuer and network metadata from registry;[4]
- inspect trust line state;
- build TrustSet and Payment transactions;
- sign and submit transactions;
- normalize ledger results.

### 8.4 DeFi Adapter Responsibilities

- discover venue metadata;
- preview actions without side effects;
- expand multi-step plans such as approval -> supply;
- return warnings for unsupported or unsafe routes.

## 9. Wallet and Signing Model

### 9.1 v1 Recommendation

Support three signing modes:

1. **read-only mode** — no signer configured
2. **local key mode** — env / local secret for dev and test
3. **external signer mode** — pluggable adapter for production later

### 9.2 Wallet Alias Resolution

Support aliases like `wallet:ops`, `wallet:treasury`, `wallet:treasury-xrpl`.

Define them in local config:

```json
{
  "wallets": {
    "ops": {
      "chain": "ethereum-mainnet",
      "address": "0x...",
      "signer": "env:OPS_PRIVATE_KEY"
    },
    "treasury-xrpl": {
      "chain": "xrpl-mainnet",
      "address": "r...",
      "signer": "env:XRPL_MAINNET_SEED"
    }
  }
}
```

### 9.3 Safety Rules

- reject `execute` if the referenced plan hash does not match current contents;
- reject execution on mainnet when `requires_confirmation` is true and explicit confirmation metadata is absent;
- reject EVM execution if the resolved RLUSD address is not the registered proxy;
- reject XRPL payment preparation when trust line prerequisites are not met.

## 10. Phase Plan

### Phase 0 — Project Scaffold

**Goal:** create the base repo and contracts.

Tasks:

- initialize monorepo structure
- add plugin metadata
- add CLI package scaffold
- add registry loading
- add shared JSON envelope schemas
- add test harness

Exit criteria:

- `pnpm test` runs
- `rlusd --help` works
- plugin directory loads without errors

### Phase 1 — Skill Router + Read-Only Core

**Goal:** make the toolkit useful without any writes.

Tasks:

- author `use-rlusd`
- author `use-rlusd-ethereum`
- author `use-rlusd-xrpl`
- implement `resolve asset`
- implement `evm balance`
- implement `evm allowance`
- implement `xrpl trustline status`
- implement `xrpl account info`

Exit criteria:

- agent can answer read-only RLUSD questions on both chains
- router skill chooses the right child skill for common prompts

### Phase 2 — Transaction Planning Layer

**Goal:** introduce plans, but not execution yet.

Tasks:

- implement plan schema and storage
- implement `evm transfer prepare`
- implement `evm approve prepare`
- implement `xrpl trustline prepare`
- implement `xrpl payment prepare`
- add warnings and policy checks

Exit criteria:

- all prepare commands produce deterministic plans
- no command produces writes yet

### Phase 3 — Transaction Execution Layer

**Goal:** safely execute prepared actions.

Tasks:

- implement signer abstraction
- implement `evm transfer execute`
- implement `evm approve execute`
- implement `xrpl trustline execute`
- implement `xrpl payment execute`
- implement `wait` and `receipt`
- implement confirmation policy

Exit criteria:

- automated execution-path coverage passes for Ethereum Mainnet and XRPL Mainnet
- mainnet safety checks are enforced

### Phase 4 — EVM DeFi Preview + Action Layer

**Goal:** support generalized RLUSD DeFi workflows.

Tasks:

- author `use-rlusd-evm-defi`
- implement `defi venues`
- implement `defi quote swap`
- implement `defi supply preview`
- implement `defi supply prepare`
- optionally implement `defi supply execute`
- add venue registry and capability flags

Exit criteria:

- agent can preview RLUSD DeFi actions without protocol-specific prompt engineering
- unsupported venues fail cleanly with actionable warnings

### Phase 5 — Institutional Guidance + Polish

**Goal:** document the fiat flow and finish operator ergonomics.

Tasks:

- author `buy-redeem-rlusd`
- implement `fiat onboarding checklist`
- implement `fiat buy instructions`
- implement `fiat redeem instructions`
- add examples, docs, and troubleshooting

Exit criteria:

- an operator can follow the documented Ripple UI + wire process from the generated guidance
- docs clearly mark the difference between automated on-chain actions and manual fiat operations

## 11. Acceptance Criteria

### 11.1 Functional Acceptance

1. `use-rlusd` routes correctly for at least 15 representative prompts.
2. Ethereum flows always use registry-resolved proxy addresses.[3]
3. XRPL flows enforce trust line checks before payment planning.[4][9]
4. All write paths require `prepare` first.
5. All commands support `--json`.
6. Errors are structured and actionable.

### 11.2 Quality Acceptance

1. unit tests cover command parsing and schema validation;
2. fixture tests cover Ethereum and XRPL read flows;
3. automated command-path coverage passes for EVM and XRPL execute/wait/receipt flows;
4. markdown skills reference the CLI correctly;
5. examples in docs are copy-pasteable.

## 12. Test Plan

### 12.1 Unit Tests

- registry parsing
- schema validation
- amount normalization
- wallet alias resolution
- route classification
- warning generation

### 12.2 Fixture Tests

- resolved RLUSD metadata per chain
- EVM allowance/balance formatting
- XRPL trust line presence / absence
- prepare output snapshots

### 12.3 Execution Flow Coverage

- Ethereum Mainnet transfer prepare + execute + wait + receipt coverage
- Ethereum Mainnet approval prepare + execute + wait + receipt coverage
- XRPL Mainnet trust line prepare + execute + wait coverage
- XRPL Mainnet payment prepare + execute + wait + receipt coverage

### 12.4 Skill Validation

- lint frontmatter
- verify all referenced commands exist
- verify manual-only skills use `disable-model-invocation: true`
- verify background skills do not include side-effecting command sequences without an explicit prepare step

## 13. Documentation Deliverables

Ship these docs alongside the code:

1. `README.md`
2. `docs/architecture.md`
3. `docs/command-reference.md`
4. `docs/examples/ethereum.md`
5. `docs/examples/xrpl.md`
6. `docs/examples/defi.md`
7. `docs/security.md`

## 14. Backlog After v1

1. more EVM chains as RLUSD support expands;
2. richer DeFi venue integrations;
3. multisig / external signer adapters;
4. policy plug-ins for spending limits and address allowlists;
5. optional MCP adapter;
6. dry-run simulation for multi-step DeFi actions.

## 15. Open Questions to Resolve During Build

1. Should the CLI persist plans as files, local sqlite rows, or both?
2. Which signer model should be the default for developer onboarding?
3. Which DeFi venue should be the first supported execution adapter, if any, beyond preview?
4. Should `permit` be first-class in v1 execution, or initially preview/build only?
5. How strict should mainnet confirmation policy be for agents?

## 16. Immediate Next Steps

1. Create the repo scaffold.
2. Implement the registry loader and shared JSON envelope.
3. Write `use-rlusd`, `use-rlusd-ethereum`, and `use-rlusd-xrpl` first.
4. Land Phase 1 read-only commands before any execution logic.
5. Add transaction planning before signing.

That order matters: it gives you a usable agent-integrated toolkit early, while preserving the safety model.

## 17. References

1. Circle Skills repository: https://github.com/circlefin/skills
2. Claude Code Docs — Skills: https://code.claude.com/docs/en/skills
3. Ripple Docs — RLUSD on the Ethereum network: https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
4. Ripple Docs — RLUSD on the XRP Ledger: https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl
5. Viem docs: https://viem.sh/
6. xrpl.js docs: https://js.xrpl.org/
7. NVD advisory for compromised xrpl.js versions: https://nvd.nist.gov/vuln/detail/CVE-2025-32965
8. Ripple RLUSD Ethereum design: https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-ethereum-design.md
9. Ripple RLUSD XRPL settings: https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-xrpl-settings.md
10. Ripple Docs — Connect your accounts: https://docs.ripple.com/products/stablecoin/user-interface/tutorials/connect-your-accounts
11. Ripple Docs — Bank accounts: https://docs.ripple.com/products/stablecoin/user-interface/settings/bank-accounts
12. Ripple Docs — Buy Ripple USD: https://docs.ripple.com/products/stablecoin/user-interface/tutorials/buy-rlusd
