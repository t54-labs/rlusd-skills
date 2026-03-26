# DeFi Examples

## Prerequisites

- install `rlusd-cli` from the pushed `feat/skills-backend-migration` branch
- set `RLUSD_WALLET_PASSWORD`
- configure an Ethereum wallet in `~/.config/rlusd-cli/wallets`
- remember that `defi quote swap` is live quote data with a short TTL
- remember that `defi supply preview` remains preview-only guidance

## Discover RLUSD Venues

```bash
rlusd defi venues \
  --chain ethereum-mainnet \
  --capability swap,lend,lp \
  --json
```

Current bundled venues:

- `aave` for lend/borrow metadata and supply execution
- `curve` for live RLUSD/USDC swap quotes plus LP preview/prepare/execute on `ethereum-mainnet`
- `uniswap` for live swap quotes, especially when fee-tier selection matters

## Preview a Swap Quote

```bash
rlusd defi quote swap \
  --chain ethereum-mainnet \
  --venue uniswap \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --json

rlusd defi quote swap \
  --chain ethereum-mainnet \
  --venue uniswap \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --fee-tier 100 \
  --json

rlusd defi quote swap \
  --chain ethereum-mainnet \
  --venue curve \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --json
```

Review:

- `data.route.venue`
- `data.route.pricing_source`
- `data.route.amount_out`
- `data.route.fee_bps`
- `data.route.quoted_at`
- `data.route.ttl_seconds`
- `data.route.expires_at`
- `warnings`

Treat the quote as expiring market data, not a standing execution guarantee.
If the default quote reverts, retry common Uniswap fee tiers `100`, `500`,
`3000`, and `10000` before reporting `QUOTE_UNAVAILABLE`.
Use `--venue curve` for the fixed Ethereum mainnet RLUSD/USDC pool. Use
`--venue uniswap` when fee-tier selection matters.

## Prepare a Curve Swap Plan

```bash
rlusd defi swap prepare \
  --chain ethereum-mainnet \
  --venue curve \
  --from-wallet ops \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --slippage 50 \
  --json
```

Review:

- `plan_id`
- `plan_path`
- `intent.steps`
- `human_summary`

## Execute the Prepared Swap Plan

```bash
rlusd defi swap execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

## Preview a Curve LP Add Flow

```bash
rlusd defi lp preview \
  --chain ethereum-mainnet \
  --venue curve \
  --operation add \
  --rlusd-amount 1000 \
  --usdc-amount 1000 \
  --json
```

Review:

- `operation`
- `lp_token_amount`
- `warnings`

## Prepare a Curve LP Remove Plan

```bash
rlusd defi lp prepare \
  --chain ethereum-mainnet \
  --venue curve \
  --operation remove \
  --from-wallet ops \
  --lp-amount 50 \
  --receive-token RLUSD \
  --json
```

`--operation add` requires both token amounts. `--operation remove` requires
`--lp-amount` and an explicit `--receive-token` of `RLUSD` or `USDC`.

## Execute the Prepared LP Plan

```bash
rlusd defi lp execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

## Preview an Aave Supply Flow

```bash
rlusd defi supply preview \
  --chain ethereum-mainnet \
  --venue aave \
  --amount 5000 \
  --json
```

Review:

- `reference_supply_apy`
- `approval_mode`
- `supply_target_reference`
- `collateral_supported`

## Prepare an Aave Supply Plan

```bash
rlusd defi supply prepare \
  --chain ethereum-mainnet \
  --venue aave \
  --from-wallet ops \
  --amount 5000 \
  --json
```

The stored plan contains two steps:

1. `approve`
2. `supply`

Review the returned `plan_id`, `plan_path`, and `intent.steps` before
submitting anything.

## Execute the Prepared Supply Plan

```bash
rlusd defi supply execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

The response returns submitted hashes for each stored step.

## Current Limitations

- quotes are live but short-lived
- `defi quote swap` defaults to Uniswap fee tier `3000`, which may not match
  the best live RLUSD pool for a given pair
- Curve support is intentionally narrow: `ethereum-mainnet` only and RLUSD/USDC
  only for swap and LP flows
- the current supply execute path is `aave`-only
- preview warnings such as `collateral_unsupported` should be treated as action
  blockers, not informational decoration
