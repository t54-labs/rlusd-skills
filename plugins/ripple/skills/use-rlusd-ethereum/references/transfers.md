# Ethereum Transfers And Approvals

## Transfer Flow

```bash
rlusd evm transfer prepare --chain ethereum-mainnet --from wallet:ops --to 0x... --amount 25.5 --json
rlusd evm transfer execute --plan <plan_path> --confirm-plan-id <plan_id> --json
rlusd evm tx wait --chain ethereum-mainnet --hash 0x... --json
rlusd evm tx receipt --chain ethereum-mainnet --hash 0x... --json
```

The prepared transfer includes:

- normalized recipient address
- amount in user-friendly units
- `amount_raw` encoded with 18 decimals
- ABI-encoded ERC-20 transfer call data

## Approval Flow

```bash
rlusd evm approve prepare --chain ethereum-mainnet --owner wallet:ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan <plan_path> --confirm-plan-id <plan_id> --json
```

## Safety Rules

- always review `human_summary`, `params`, and `intent` from `prepare`
- use the exact `plan_id` returned by `prepare`
- treat `wait` and `receipt` as required follow-through, not optional cleanup
- if the registry metadata does not resolve the proxy address, stop and fix the
  registry before proceeding
