# XRPL Examples

## Prerequisites

- install `rlusd-cli` from the `main` branch
- set `RLUSD_WALLET_PASSWORD`
- configure an XRPL wallet in `~/.config/rlusd-cli/wallets`
- use a valid XRPL classic address for all examples

## Resolve RLUSD Metadata

```bash
rlusd resolve asset --chain xrpl-mainnet --symbol RLUSD --json
```

Expected highlights:

- `symbol = RLUSD`
- `issuer` is present
- use `symbol = RLUSD` as the human-readable identity check
- `currency` may be returned as XRPL-encoded RLUSD metadata

## Check Trust-Line Status

```bash
rlusd xrpl trustline status \
  --chain xrpl-mainnet \
  --address rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --json
```

Use this before planning a payment to the destination account.

## Read Account Info

```bash
rlusd xrpl account info \
  --chain xrpl-mainnet \
  --address rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --json
```

## Prepare a Trust Line

```bash
rlusd xrpl trustline prepare \
  --chain xrpl-mainnet \
  --address rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --limit 100000 \
  --json
```

Review the returned:

- `data.plan_id`
- `data.plan_path`
- `data.intent.tx_json.TransactionType`
- `data.human_summary`

## Execute the Prepared Trust Line

```bash
rlusd xrpl trustline execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --wallet treasury-xrpl \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

## Wait for Validation

```bash
rlusd xrpl tx wait \
  --chain xrpl-mainnet \
  --hash <tx_hash> \
  --json
```

## Prepare a Payment

Before this step, make sure the destination already has an RLUSD trust line.

```bash
rlusd xrpl payment prepare \
  --chain xrpl-mainnet \
  --from-wallet treasury-xrpl \
  --to rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh \
  --amount 250 \
  --json
```

If the destination account cannot receive RLUSD, preparation fails with
`TRUSTLINE_MISSING` or `DESTINATION_ACCOUNT_MISSING`.

## Execute the Prepared Payment

```bash
rlusd xrpl payment execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --wallet treasury-xrpl \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

## Read the Payment Receipt

```bash
rlusd xrpl payment receipt \
  --chain xrpl-mainnet \
  --hash <tx_hash> \
  --json
```

## Notes

- the bundled registry currently targets XRPL Mainnet only
