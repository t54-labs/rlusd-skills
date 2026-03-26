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

- `defi quote swap` requires explicit `--venue`
- for predictable automation, pass explicit `--chain`; otherwise the CLI can
  resolve it from the global flag or `default_chain` config
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

## Action Handoff

Use `use-rlusd-evm-defi` for venue discovery, live quotes, LP previews, and
supply previews only.

When the user wants to create a plan or submit a DeFi action:

- switch to `rlusd-defi-action`
- run wallet preflight with `rlusd-wallets` before any wallet-backed step
- keep the action flow on a `prepare -> review -> execute` path

## LP Routing

```bash
rlusd defi lp preview --chain ethereum-mainnet --venue curve --operation add --rlusd-amount 1000 --usdc-amount 1000 --json
```

Current LP routing:

- LP flows currently require `--venue curve`
- `--operation add` uses both token amounts
- `--operation remove` uses `--lp-amount` plus `--receive-token`
- `defi lp preview` returns preview data only; it does not return `plan_id`,
  `plan_path`, or `intent.steps`
- the bundled LP path is limited to `ethereum-mainnet`

## Supply Routing

```bash
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
```

Current supply routing is narrow:

- only venues with the `lend` capability can be previewed
- `aave` is the only bundled supply preview path in this batch
- move to `rlusd-defi-action` for any wallet-backed supply plan or submission
