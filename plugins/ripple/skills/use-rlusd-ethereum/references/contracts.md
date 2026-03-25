# Ethereum RLUSD Contracts

## Canonical Integration Rule

Use the registry-resolved RLUSD proxy address as the canonical token address.
Do not integrate against the implementation contract when the proxy is present.

Current bundled mainnet metadata:

- proxy: `0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD`
- implementation: `0x9747a0d261c2d56eb93f542068e5d1e23170fa9e`
- decimals: `18`

## How To Resolve It

```bash
rlusd resolve asset --chain ethereum-mainnet --json
```

The response should confirm:

- `symbol = RLUSD`
- `address_type = proxy`
- `decimals = 18`

## Why This Matters

- plans encode transfers and approvals against `asset.address`
- balances and allowances resolve the same asset metadata first
- proxy vs implementation confusion is a real integration failure mode for
  upgradeable tokens

## Notes

- the bundled registry currently documents Ethereum Mainnet only
- if a new chain is needed, extend the registry before documenting commands
