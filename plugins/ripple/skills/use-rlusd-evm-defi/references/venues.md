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
  - static preview quote for `RLUSD -> USDC`
- `uniswap`
  - capabilities: `swap`, `lp`
  - approval mode: `approve_or_permit`
  - static preview quote for `RLUSD -> USDC`

## Important Limits

- venue metadata is curated registry data, not a live protocol crawl
- preview-only venue presence does not imply execution support
- Aave is the only current DeFi action venue with prepare/execute support
