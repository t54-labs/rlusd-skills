# Architecture

## Overview

The RLUSD toolkit is split into three layers:

1. skills that route prompts and teach workflow semantics
2. an external CLI that exposes deterministic JSON commands
3. a registry that holds changing chain, asset, venue, and policy metadata

This keeps operational facts out of the skill prose while preserving a stable
command surface for agents.

## Top-Level Components

### Skill Layer

The skill layer lives under `skills/`.

- routing skills choose the correct chain or product flow
- wallet-preflight skill inspects local aliases before wallet-backed actions
- action skills guide users through `prepare -> review -> execute`
- reference subfiles capture chain-specific details without bloating the main
  skill text

### CLI Layer

The canonical CLI now lives in the external `rlusd-cli` repository and exposes
these namespaces:

- `resolve`
- `evm`
- `xrpl`
- `defi`
- `bridge`
- `fiat`

Every command supports JSON output and returns a shared envelope shape with:

- `ok`
- `command`
- `chain` when applicable
- `timestamp`
- `data`
- `warnings`
- `next`

`rlusd-skills` no longer treats `cli/rlusd` as the source of truth for runtime
metadata. This repo's job is to document and route into the external CLI
surface, while chain, asset, venue, and policy facts live in `rlusd-cli`.

## Data Flow

### Read Commands

Read flows resolve registry metadata first, then call the appropriate adapter.

Examples:

- `resolve asset` loads chain and asset metadata
- `evm tx wait` and `evm tx receipt` resolve the reviewed on-chain hash
- `xrpl trustline status` and `xrpl account info` resolve XRPL issuer/account state
- `bridge routes`, `bridge metadata`, `bridge status`, and `bridge history`
  resolve Wormhole NTT route and transfer status data

### Prepare Commands

Prepare flows convert user intent into deterministic plan artifacts stored under
`~/.config/rlusd-cli/plans`.

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

Bridge prepare flows create `bridge.ntt` plans with approval calldata and NTT
transfer calldata. They also record source and destination NTT chain labels,
recipient fields, required native delivery value, and ordered `approve` then
`ntt_transfer` steps.

### Execute Commands

Execute flows:

1. load the stored plan
2. verify the action matches the command being run
3. verify the plan hash still matches the contents
4. require `--confirm-plan-id` when the policy marks the action as requiring
   explicit confirmation
5. resolve the configured signer
6. submit the transaction intent

Post-submit status is retrieved with chain-specific wait and receipt commands
for EVM and XRPL flows, or with `bridge status <id>` and `bridge history` for
Wormhole NTT bridge flows, instead of assuming that submission implies success.

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

- venue discovery is CLI-backed and capability-filtered
- swap quotes are live quote data with TTL/expiry metadata
- prepared swap flows are available for supported venues
- Curve LP preview/prepare/execute flows are available on `ethereum-mainnet`
- supply preview/prepare/execute currently support `aave` only
- DeFi supply execution is a multi-step flow that submits an `approve` step
  before the `supply` step

### Bridge

- Wormhole NTT bridge commands cover RLUSD routes across `ethereum`, `base`,
  `optimism`, `ink`, and `unichain`
- route metadata and recent transfer status come from bundled metadata or
  Wormholescan when `--live` or status/history commands are used
- `bridge prepare` creates a local plan with ERC-20 approval and NTT transfer
  intent
- `bridge execute` submits stored approval and transfer steps from the selected
  local EVM wallet
- XRPL L1 is outside this Wormhole NTT surface

## Wallet Model

Wallets, plans, and runtime configuration are loaded from `rlusd-cli` local
storage:

- `~/.config/rlusd-cli/wallets`
- `~/.config/rlusd-cli/plans`
- `~/.config/rlusd-cli/config.yml`

Preferred write-path inputs are explicit wallet flags:

- EVM: `--from-wallet` and `--owner-wallet`
- XRPL: `--from-wallet` and `--wallet`

## Safety Model

The architecture intentionally pushes side effects behind reviewable plan files.

- writes do not happen during `prepare`
- execution is blocked when plan integrity fails
- mainnet-style actions can require explicit confirmation
- XRPL payment prepare fails if the destination cannot receive RLUSD
- unsupported chains and venues fail with structured errors

## Known Gaps

- no dry-run simulator for multi-step DeFi plans yet
- supply flow remains `aave`-only
- LP flows remain `curve`-only on `ethereum-mainnet`
- no borrow or generic vault flows yet
- no multisig or external signer backends yet
