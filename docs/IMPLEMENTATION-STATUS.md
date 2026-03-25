# RLUSD Skills Implementation Status

- Last updated: 2026-03-25
- Scope: current repo state vs `docs/RLUSD-Skills-Implementation-Plan.md`

## Summary

The repository now has a working TypeScript CLI, registry-backed chain and venue
data, eight skill files, deterministic plan storage, EVM and XRPL execution
flows, DeFi preview/supply flows, and institutional guidance commands.

The current documented scope is mainnet-only. Sepolia/XRPL Testnet support and
live testnet demo work are not tracked for now.

The biggest remaining gap is:

- broader post-v1 expansion work around richer DeFi, signer, and adapter
  capabilities.

## Phase Status

### Phase 0

Status: complete

Implemented:

- monorepo/workspace scaffold
- plugin marketplace metadata
- CLI package scaffold
- registry loading
- shared JSON envelope schemas
- test harness

### Phase 1

Status: complete

Implemented:

- `use-rlusd`
- `use-rlusd-ethereum`
- `use-rlusd-xrpl`
- `resolve asset`
- `evm balance`
- `evm allowance`
- `xrpl trustline status`
- `xrpl account info`

### Phase 2

Status: complete

Implemented:

- deterministic plan schema and file-backed storage
- `evm transfer prepare`
- `evm approve prepare`
- `xrpl trustline prepare`
- `xrpl payment prepare`
- warnings and confirmation policy inputs

### Phase 3

Status: complete for current mainnet-only scope

Implemented:

- signer abstraction
- `evm transfer execute`
- `evm approve execute`
- `xrpl trustline execute`
- `xrpl payment execute`
- `evm tx wait`
- `evm tx receipt`
- `xrpl tx wait`
- `xrpl payment receipt`
- confirmation policy enforcement

### Phase 4

Status: complete

Implemented:

- `use-rlusd-evm-defi`
- `defi venues`
- `defi quote swap`
- `defi supply preview`
- `defi supply prepare`
- `defi supply execute`
- venue registry and capability flags

Current scope notes:

- swap quotes are static preview-only
- supply flow is `aave`-only
- `defi supply execute` submits stored `approve` then `supply` steps

Still missing or narrowed:

- no borrow preview
- no LP/vault preview
- no richer multi-venue lending abstraction
- no live quote adapters

### Phase 5

Status: complete

Implemented:

- `buy-redeem-rlusd`
- `fiat onboarding checklist`
- `fiat buy instructions`
- `fiat redeem instructions`
- `README.md`
- `docs/architecture.md`
- `docs/command-reference.md`
- `docs/examples/ethereum.md`
- `docs/examples/xrpl.md`
- `docs/examples/defi.md`
- `docs/security.md`
- `docs/troubleshooting.md`

## Implemented Skills

Current skill files present:

- `plugins/ripple/skills/use-rlusd/SKILL.md`
- `plugins/ripple/skills/use-rlusd-ethereum/SKILL.md`
- `plugins/ripple/skills/use-rlusd-xrpl/SKILL.md`
- `plugins/ripple/skills/use-rlusd-evm-defi/SKILL.md`
- `plugins/ripple/skills/buy-redeem-rlusd/SKILL.md`
- `plugins/ripple/skills/rlusd-transfer/SKILL.md`
- `plugins/ripple/skills/rlusd-trustline/SKILL.md`
- `plugins/ripple/skills/rlusd-defi-action/SKILL.md`

Important note:

- the original plan described `rlusd-transfer`, `rlusd-trustline`, and
  `rlusd-defi-action` as manual-only action skills
- current repo state intentionally implements them as regular user-invocable
  prepare-first action skills

## Implemented CLI Surface

### `resolve`

- `resolve asset`

### `evm`

- `evm balance`
- `evm allowance`
- `evm transfer prepare`
- `evm transfer execute`
- `evm approve prepare`
- `evm approve execute`
- `evm tx wait`
- `evm tx receipt`

### `xrpl`

- `xrpl trustline status`
- `xrpl trustline prepare`
- `xrpl trustline execute`
- `xrpl account info`
- `xrpl payment prepare`
- `xrpl payment execute`
- `xrpl tx wait`
- `xrpl payment receipt`

### `defi`

- `defi venues`
- `defi quote swap`
- `defi supply preview`
- `defi supply prepare`
- `defi supply execute`

### `fiat`

- `fiat onboarding checklist`
- `fiat buy instructions`
- `fiat redeem instructions`

## Recently Completed

### Documentation Deliverables

Completed in repo:

- `README.md` at repo root
- `docs/architecture.md`
- `docs/command-reference.md`
- `docs/examples/ethereum.md`
- `docs/examples/xrpl.md`
- `docs/examples/defi.md`
- `docs/security.md`
- `docs/troubleshooting.md`

### Skill Reference Files

Completed in repo:

- `plugins/ripple/skills/use-rlusd-ethereum/references/contracts.md`
- `plugins/ripple/skills/use-rlusd-ethereum/references/permit.md`
- `plugins/ripple/skills/use-rlusd-ethereum/references/transfers.md`
- `plugins/ripple/skills/use-rlusd-xrpl/references/trustlines.md`
- `plugins/ripple/skills/use-rlusd-xrpl/references/issuer-settings.md`
- `plugins/ripple/skills/use-rlusd-xrpl/references/payments.md`
- `plugins/ripple/skills/use-rlusd-evm-defi/references/venues.md`
- `plugins/ripple/skills/use-rlusd-evm-defi/references/routing.md`
- `plugins/ripple/skills/use-rlusd-evm-defi/references/risk-model.md`

## Remaining TODO

### Product Scope Still Narrowed

- DeFi swap quotes are registry-backed preview data, not live market data
- DeFi supply is `aave`-only
- DeFi borrow/LP/vault flows are not implemented
- fiat commands are guidance-only and do not automate wires or onboarding

### Backlog Still Open

- more EVM chains as RLUSD support expands
- richer DeFi venue integrations
- multisig / external signer adapters
- policy plug-ins for spending limits and allowlists
- optional MCP adapter
- dry-run simulation for multi-step DeFi actions

## Verification Snapshot

Most recently verified state before this doc was written:

- `pnpm test` passing
- `pnpm typecheck` passing
- `pnpm build` passing

The codebase currently has working automated coverage for:

- registry loading and resolution
- read commands
- prepare commands
- execute commands
- wait/receipt commands
- DeFi preview and Aave supply flow
- fiat guidance commands
