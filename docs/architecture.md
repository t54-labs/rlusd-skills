# Architecture

## Overview

The RLUSD toolkit is split into three layers:

1. skills that route prompts and teach workflow semantics
2. a local CLI that exposes deterministic JSON commands
3. a registry that holds changing chain, asset, venue, and policy metadata

This keeps operational facts out of the skill prose while preserving a stable
command surface for agents.

## Top-Level Components

### Skill Layer

The skill layer lives under `plugins/ripple/skills`.

- routing skills choose the correct chain or product flow
- action skills guide users through `prepare -> review -> execute`
- reference subfiles capture chain-specific details without bloating the main
  skill text

### CLI Layer

The CLI lives under `cli/rlusd/src/index.ts` and exposes these namespaces:

- `resolve`
- `evm`
- `xrpl`
- `defi`
- `fiat`

Every command supports JSON output and returns a shared envelope shape with:

- `ok`
- `command`
- `chain` when applicable
- `timestamp`
- `data`
- `warnings`
- `next`

### Registry Layer

The registry lives under `cli/rlusd/src/registry`.

- `chains/` describes chain family and transport configuration
- `assets/` describes RLUSD metadata per chain
- `venues/` describes DeFi capabilities and preview-only quote data

At the moment, the bundled registry covers:

- `ethereum-mainnet`
- `xrpl-mainnet`

The current scope is intentionally mainnet-only.

## Data Flow

### Read Commands

Read flows resolve registry metadata first, then call the appropriate adapter.

Examples:

- `resolve asset` loads chain and asset metadata
- `evm balance` and `evm allowance` resolve the RLUSD proxy address first
- `xrpl trustline status` resolves the RLUSD issuer and currency first

### Prepare Commands

Prepare flows convert user intent into deterministic plan artifacts stored under
`.rlusd/plans`.

Each plan includes:

- a deterministic `plan_id`
- a `plan_path`
- a human-readable summary
- normalized params
- low-level intent payloads ready for execution
- warnings and suggested next commands

The plan ID is derived from a stable hash of the command, chain, action, asset,
params, intent, and warnings. If the file is modified later, load-time integrity
checks fail.

### Execute Commands

Execute flows:

1. load the stored plan
2. verify the action matches the command being run
3. verify the plan hash still matches the contents
4. require `--confirm-plan-id` when the policy marks the action as requiring
   explicit confirmation
5. resolve the configured signer
6. submit the transaction intent

Post-submit status is always retrieved with chain-specific wait and receipt
commands instead of assuming that submission implies success.

## Chain-Specific Design

### Ethereum

- RLUSD is treated as an ERC-20 on EVM chains
- integrations use the registry-resolved proxy address
- transfer and approval plans encode ABI call data with `viem`
- wait and receipt commands read transaction status from the configured RPC

### XRPL

- RLUSD is treated as an issued token with issuer and currency metadata
- trust lines are explicit prerequisites for receive/payment workflows
- trust-line and payment plans build `TrustSet` and `Payment` `tx_json` payloads
- wait and receipt commands poll XRPL transaction status over WebSocket

### DeFi

- venue discovery is registry-backed
- swap quotes are static reference previews
- supply preview/prepare/execute currently support `aave` only
- DeFi supply execution is a multi-step flow that submits an `approve` step
  before the `supply` step

## Wallet Model

Wallet aliases are loaded from `.rlusd/config.json`.

- direct addresses are allowed for read flows and prepare inputs
- execute flows require a configured wallet alias or a configured address match
- signer references currently support environment-backed local keys only

Examples:

- EVM signer env refs: `env:OPS_PRIVATE_KEY`
- XRPL signer env refs: `env:XRPL_MAINNET_SEED`

## Safety Model

The architecture intentionally pushes side effects behind reviewable plan files.

- writes do not happen during `prepare`
- execution is blocked when plan integrity fails
- mainnet-style actions can require explicit confirmation
- XRPL payment prepare fails if the destination cannot receive RLUSD
- unsupported chains and venues fail with structured errors

## Known Gaps

- no live DeFi quote adapters yet
- no dry-run simulator for multi-step DeFi plans yet
- no multisig or external signer backends yet
