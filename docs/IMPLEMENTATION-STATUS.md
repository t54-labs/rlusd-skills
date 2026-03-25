# RLUSD Skills Implementation Status

- Last updated: 2026-03-25
- Scope: current repo state vs `docs/RLUSD-Skills-Implementation-Plan.md`

## Summary

The repository now has eight RLUSD skill files, supporting reference material,
and repo docs retargeted to the external `rlusd-cli` runtime.

The external CLI branch currently targeted for cutover is
`feat/skills-backend-migration` at pinned commit `374a1b1`.

The biggest remaining gap is:

- final repo-level validation after removing the embedded CLI package.

## Phase Status

### Phase 0

Status: complete for skills/docs scope

Implemented:

- plugin marketplace metadata
- skill packaging scaffold
- docs and references that route into `rlusd-cli`

### Phase 1

Status: in progress during CLI cutover

Implemented:

- `use-rlusd`
- `use-rlusd-ethereum`
- `use-rlusd-xrpl`
- external `resolve asset` routing
- external `evm balance`
- external `evm allowance`
- external `xrpl trustline status`
- external `xrpl account info`

### Phase 2

Status: in progress during CLI cutover

Implemented:

- external `prepare` flows for EVM and XRPL
- warnings and confirmation policy documentation

### Phase 3

Status: in progress during CLI cutover

Implemented:

- external execute/wait/receipt flows for EVM and XRPL
- confirmation policy enforcement documentation

### Phase 4

Status: in progress during CLI cutover

Implemented:

- `use-rlusd-evm-defi`
- external `defi venues`
- external `defi quote swap`
- external `defi supply preview`
- external `defi supply prepare`
- external `defi supply execute`

Current scope notes:

- swap quotes are live and time-limited
- supply flow is `aave`-only
- `defi supply execute` remains a reviewed multi-step `approve` then `supply` flow

Still missing or narrowed:

- no borrow preview
- no LP/vault preview
- no richer multi-venue lending abstraction
- no live quote adapters

### Phase 5

Status: in progress during CLI cutover

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

- external `resolve asset`

### `evm`

- external `evm balance`
- external `evm allowance`
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

- finish the broad examples/planning-doc rewrite
- embedded `cli/rlusd` package removal and workspace cleanup
- run final repo QA after workspace cleanup

## Verification Snapshot

Most recently verified state before this doc was written:

- `rlusd-cli` branch `feat/skills-backend-migration` pushed
- pinned cutover commit available: `374a1b1`
- remaining verification is on the `rlusd-skills` side after cutover edits

The codebase currently has working automated coverage for:

- registry loading and resolution
- read commands
- prepare commands
- execute commands
- wait/receipt commands
- DeFi preview and Aave supply flow
- fiat guidance commands
