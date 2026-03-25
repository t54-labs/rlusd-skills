# XRPL Trust Lines

## Why Trust Lines Matter

On XRPL, RLUSD is an issued token. Receiving accounts need an RLUSD trust line
before they can reliably receive payments.

## Read Before You Write

Check the current state first:

```bash
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
```

If the account can receive RLUSD, the returned trust-line data should show it as
present.

## Prepare And Execute

```bash
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan <plan_path> --confirm-plan-id <plan_id> --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash <tx_hash> --json
```

## Important Distinction

- a trust line is not a payment
- trust-line setup is a prerequisite for many RLUSD receive flows
- `xrpl payment prepare` will fail if the destination account is missing the
  RLUSD trust line
