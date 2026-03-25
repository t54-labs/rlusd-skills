# XRPL Payments

## Payment Flow

```bash
rlusd xrpl payment prepare --chain xrpl-mainnet --from-wallet treasury-xrpl --to r... --amount 250 --json
rlusd xrpl payment execute --plan <plan_path> --confirm-plan-id <plan_id> --wallet treasury-xrpl --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash <tx_hash> --json
rlusd xrpl payment receipt --chain xrpl-mainnet --hash <tx_hash> --json
```

## Preparation Checks

Payment preparation validates the destination before writing a plan.

Common failures:

- `DESTINATION_ACCOUNT_MISSING`
- `TRUSTLINE_MISSING`

Helpful preflight commands:

```bash
rlusd xrpl account info --chain xrpl-mainnet --address r... --json
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
```

## Receipt Handling

Use:

- `xrpl tx wait` to confirm validation
- `xrpl payment receipt` to inspect destination and delivered amount

Do not assume that transaction submission alone means the RLUSD payment
completed successfully.
