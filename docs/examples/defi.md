# DeFi Examples

## Prerequisites

- build the CLI with `pnpm --filter rlusd build`
- configure `.rlusd/config.json` plus `ETHEREUM_MAINNET_RPC_URL` for execution
- remember that quotes are preview-only and registry-backed in the current batch

## Discover RLUSD Venues

```bash
node cli/rlusd/dist/index.js defi venues \
  --chain ethereum-mainnet \
  --capability swap,lend,lp \
  --json
```

Current bundled venues:

- `aave` for lend/borrow metadata and supply execution
- `curve` for swap preview and LP capability metadata
- `uniswap` for swap preview and LP capability metadata

## Preview a Swap Quote

```bash
node cli/rlusd/dist/index.js defi quote swap \
  --chain ethereum-mainnet \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --json
```

Review:

- `data.route.venue`
- `data.route.pricing_source`
- `data.route.rate`
- `data.route.amount_out`
- `warnings`

The current registry should select `curve` as the best preview route for
`RLUSD -> USDC`.

## Preview an Aave Supply Flow

```bash
node cli/rlusd/dist/index.js defi supply preview \
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
node cli/rlusd/dist/index.js defi supply prepare \
  --chain ethereum-mainnet \
  --venue aave \
  --from wallet:ops \
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
node cli/rlusd/dist/index.js defi supply execute \
  --plan ./.rlusd/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --json
```

The response returns submitted hashes for each stored step.

## Current Limitations

- swap execution is not implemented
- quotes are not live market data
- the current supply execute path is `aave`-only
- preview warnings such as `collateral_unsupported` should be treated as action
  blockers, not informational decoration
