# DeFi Routing

## Venue Discovery

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
```

Capability filtering is inclusive. A venue is returned when it supports any
requested capability, not necessarily all of them.

## Swap Quote Selection

```bash
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --json
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --fee-tier 100 --json
```

Current quote behavior:

- the CLI inspects a live Uniswap quote path for the requested RLUSD pair
- the default `--fee-tier` is `3000`
- if the default quote fails, retry common Uniswap fee tiers `100`, `500`,
  `3000`, and `10000` before concluding the pair is unavailable
- `curve` may appear in `defi venues`, but the current quote path is still
  Uniswap-only and does not accept `--venue`
- the result includes freshness metadata: `quoted_at`, `ttl_seconds`, and
  `expires_at`
- quote output should be treated as expiring market data rather than static
  preview data

## Supply Routing

```bash
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from-wallet ops --amount 5000 --json
```

Current supply routing is narrow:

- only venues with the `lend` capability can be previewed/prepared
- `aave` is the only bundled supply execution path
- the stored plan expands into `approve` then `supply`
