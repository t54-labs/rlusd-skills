# DeFi Venues

## Current Bundled Venues

Use the CLI to inspect the registry-backed venue list:

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
```

Current bundled venue metadata:

- `aave`
  - capabilities: `lend`, `borrow`
  - approval mode: `approve`
  - current supply execution target
- `curve`
  - capabilities: `swap`, `lp`
  - approval mode: `approve`
  - live quote source for `defi quote swap --venue curve`
  - current prepared swap and LP venue on `ethereum-mainnet` for RLUSD/USDC
- `uniswap`
  - capabilities: `swap`, `lp`
  - approval mode: `approve`
  - live quote source for `defi quote swap --venue uniswap`
  - use when fee-tier selection is required

## Important Limits

- venue metadata is curated registry data, not a live protocol crawl
- live quote and execution support are venue-specific; inspect the venue and
  command contract rather than assuming parity
- Aave remains the bundled lend/supply execution venue
- Curve is the bundled swap/LP execution venue for `ethereum-mainnet`
