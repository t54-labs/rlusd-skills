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
  - discovery-only in the current top-level DeFi surface
- `uniswap`
  - capabilities: `swap`, `lp`
  - approval mode: `approve`
  - current live quote source for `defi quote swap`

## Important Limits

- venue metadata is curated registry data, not a live protocol crawl
- live quote support does not imply swap execution support
- Aave is the only current DeFi action venue with prepare/execute support
