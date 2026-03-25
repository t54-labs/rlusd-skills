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
- `curve` for swap/LP discovery metadata
- `uniswap` for live swap quotes and LP discovery metadata

## Preview a Swap Quote

```bash
rlusd defi quote swap \
  --chain ethereum-mainnet \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --json
```

Review:

- `data.route.venue`
- `data.route.pricing_source`
- `data.route.amount_out`
- `data.route.quoted_at`
- `data.route.ttl_seconds`
- `data.route.expires_at`
- `warnings`

Treat the quote as expiring market data, not a standing execution guarantee.

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

- swap execution is not implemented
- quotes are live but short-lived
- the current supply execute path is `aave`-only
- preview warnings such as `collateral_unsupported` should be treated as action
  blockers, not informational decoration
