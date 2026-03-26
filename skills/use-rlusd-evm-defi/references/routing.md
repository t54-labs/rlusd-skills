# DeFi Routing

## Venue Discovery

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
```

Capability filtering is inclusive. A venue is returned when it supports any
requested capability, not necessarily all of them.

## Swap Quote Selection

```bash
rlusd defi quote swap --chain ethereum-mainnet --venue uniswap --from RLUSD --to USDC --amount 1000 --json
rlusd defi quote swap --chain ethereum-mainnet --venue uniswap --from RLUSD --to USDC --amount 1000 --fee-tier 100 --json
rlusd defi quote swap --chain ethereum-mainnet --venue curve --from RLUSD --to USDC --amount 1000 --json
```

Current quote behavior:

- top-level `defi quote swap` requires explicit `--chain` and explicit `--venue`
- `--venue uniswap` inspects a live Uniswap quote path for the requested RLUSD pair
- the default `--fee-tier` is `3000`
- if the default quote fails, retry common Uniswap fee tiers `100`, `500`,
  `3000`, and `10000` before concluding the pair is unavailable
- `--venue curve` uses the bundled Curve RLUSD/USDC pool on `ethereum-mainnet`
- Curve quoting in this batch is limited to the `RLUSD <-> USDC` pair
- the result includes freshness metadata: `quoted_at`, `ttl_seconds`, and
  `expires_at`
- quote output should be treated as expiring market data rather than static
  preview data

## Swap Plan Routing

```bash
rlusd defi swap prepare --chain ethereum-mainnet --venue curve --from-wallet ops --from RLUSD --to USDC --amount 1000 --slippage 50 --json
rlusd defi swap execute --plan ~/.config/rlusd-cli/plans/<plan_id>.json --confirm-plan-id <plan_id> --json
```

Current swap routing:

- `defi swap prepare` stores deterministic venue-specific `intent.steps`
- `defi swap execute` replays the stored steps after confirmation checks
- Curve swap execution in this batch is limited to `ethereum-mainnet` RLUSD/USDC

## LP Routing

```bash
rlusd defi lp preview --chain ethereum-mainnet --venue curve --operation add --rlusd-amount 1000 --usdc-amount 1000 --json
rlusd defi lp prepare --chain ethereum-mainnet --venue curve --operation remove --from-wallet ops --lp-amount 50 --receive-token RLUSD --json
rlusd defi lp execute --plan ~/.config/rlusd-cli/plans/<plan_id>.json --confirm-plan-id <plan_id> --json
```

Current LP routing:

- LP flows currently require `--venue curve`
- `--operation add` uses both token amounts
- `--operation remove` uses `--lp-amount` plus `--receive-token`
- the bundled LP path is limited to `ethereum-mainnet`

## Supply Routing

```bash
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from-wallet ops --amount 5000 --json
```

Current supply routing is narrow:

- only venues with the `lend` capability can be previewed/prepared
- `aave` is the only bundled supply execution path
- the stored plan expands into `approve` then `supply`
