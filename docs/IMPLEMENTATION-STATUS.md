# RLUSD Skills Implementation Status

- Last updated: 2026-03-26
- Scope: current repo state vs `docs/RLUSD-Skills-Implementation-Plan.md`

## Summary

The repository now has nine RLUSD skill files, supporting reference material,
and repo docs retargeted to the external `rlusd-cli` runtime.

The install guidance now points to the external `rlusd-cli` repository on
`main`.

The biggest remaining gaps are now product-scope limits rather than cutover
work: `aave`-only supply, `curve`-only LP flows on `ethereum-mainnet`, no
borrow or generic vault flows, and no multisig or external signer backends.

## Phase Status

### Phase 0

Status: complete for skills/docs scope

Implemented:

- plugin marketplace metadata
- skill packaging scaffold
- docs and references that route into `rlusd-cli`

### Phase 1

Status: complete for the skills/docs cutover

Implemented:

- `use-rlusd`
- `use-rlusd-ethereum`
- `use-rlusd-xrpl`
- external `resolve asset` routing
- external `balance`
- external `eth allowance`
- external `xrpl trustline status`
- external `xrpl account info`

### Phase 2

Status: complete for the skills/docs cutover

Implemented:

- external `prepare` flows for EVM and XRPL
- warnings and confirmation policy documentation

### Phase 3

Status: complete for the skills/docs cutover

Implemented:

- external execute/wait/receipt flows for EVM and XRPL
- confirmation policy enforcement documentation

### Phase 4

Status: complete for the skills/docs cutover

Implemented:

- `use-rlusd-evm-defi`
- external `defi venues`
- external `defi quote swap`
- external `defi swap prepare`
- external `defi swap execute`
- external `defi lp preview`
- external `defi lp prepare`
- external `defi lp execute`
- external `defi supply preview`
- external `defi supply prepare`
- external `defi supply execute`

Current scope notes:

- swap quotes are live and time-limited
- prepared swap execution is supported
- Curve LP flows are `curve`-only on `ethereum-mainnet`
- supply flow is `aave`-only
- `defi supply execute` remains a reviewed multi-step `approve` then `supply` flow

Still missing or narrowed:

- no borrow preview
- no generic multi-venue LP/vault abstraction
- no richer multi-venue lending abstraction
- no dry-run simulator for multi-step DeFi plans

### Phase 5

Status: complete for the skills/docs cutover

Implemented:

- `buy-redeem-rlusd`
- external `fiat onboarding checklist`
- external `fiat buy instructions`
- external `fiat redeem instructions`
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

- `skills/use-rlusd/SKILL.md`
- `skills/use-rlusd-ethereum/SKILL.md`
- `skills/use-rlusd-xrpl/SKILL.md`
- `skills/use-rlusd-evm-defi/SKILL.md`
- `skills/rlusd-wallets/SKILL.md`
- `skills/buy-redeem-rlusd/SKILL.md`
- `skills/rlusd-transfer/SKILL.md`
- `skills/rlusd-trustline/SKILL.md`
- `skills/rlusd-defi-action/SKILL.md`

Important note:

- the original plan described `rlusd-transfer`, `rlusd-trustline`, and
  `rlusd-defi-action` as manual-only action skills
- current repo state intentionally implements them as regular user-invocable
  prepare-first action skills

## Implemented CLI Surface

### `resolve`

- external `resolve asset`

### `balance`

- external `balance`

### `eth`

- external `eth allowance`

### `evm`

- external `evm transfer prepare`
- external `evm transfer execute`
- external `evm approve prepare`
- external `evm approve execute`
- external `evm tx wait`
- external `evm tx receipt`

### `xrpl`

- external `xrpl trustline status`
- external `xrpl trustline prepare`
- external `xrpl trustline execute`
- external `xrpl account info`
- external `xrpl payment prepare`
- external `xrpl payment execute`
- external `xrpl tx wait`
- external `xrpl payment receipt`

### `defi`

- external `defi venues`
- external `defi quote swap`
- external `defi swap prepare`
- external `defi swap execute`
- external `defi lp preview`
- external `defi lp prepare`
- external `defi lp execute`
- external `defi supply preview`
- external `defi supply prepare`
- external `defi supply execute`

### `fiat`

- external `fiat onboarding checklist`
- external `fiat buy instructions`
- external `fiat redeem instructions`

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

- `skills/use-rlusd-ethereum/references/contracts.md`
- `skills/use-rlusd-ethereum/references/permit.md`
- `skills/use-rlusd-ethereum/references/transfers.md`
- `skills/use-rlusd-xrpl/references/trustlines.md`
- `skills/use-rlusd-xrpl/references/issuer-settings.md`
- `skills/use-rlusd-xrpl/references/payments.md`
- `skills/use-rlusd-evm-defi/references/venues.md`
- `skills/use-rlusd-evm-defi/references/routing.md`
- `skills/use-rlusd-evm-defi/references/risk-model.md`

## Remaining TODO

### Product Scope Still Narrowed

- DeFi supply is `aave`-only
- DeFi LP flows are `curve`-only on `ethereum-mainnet`
- DeFi borrow and generic vault flows are not implemented
- multisig or external signer backends are not implemented
- fiat commands are guidance-only and do not automate wires or onboarding

### Backlog Still Open

- expand DeFi coverage beyond Aave supply and Curve LP workflows
- add multisig or external signer support if the external CLI exposes it

## Verification Snapshot

Most recently verified state before this doc was written:

- user-facing install docs point to `rlusd-cli` on `main`
- `pnpm test` passed
- `pnpm typecheck` passed (`rlusd-skills` is skills/docs-only; no local typecheck target)
- `pnpm build` passed (`rlusd-skills` is skills/docs-only; no local build target)

Important note:

- this repo is now skills/docs-only
- runtime command execution coverage lives in the external `rlusd-cli` repository
- root `pnpm test`, `pnpm typecheck`, and `pnpm build` validate the reduced workspace shape, not an in-repo CLI runtime
