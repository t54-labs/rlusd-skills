# XRPL Examples

## Prerequisites

- build the CLI with `pnpm --filter rlusd build`
- configure `.rlusd/config.json` if you plan to execute a trust-line or payment
- use a valid XRPL classic address for all examples

Example wallet config entry:

```json
{
  "wallets": {
    "treasury-xrpl": {
      "chain": "xrpl-mainnet",
      "address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
      "signer": "env:XRPL_MAINNET_SEED"
    }
  }
}
```

## Resolve RLUSD Metadata

```bash
node cli/rlusd/dist/index.js resolve asset --chain xrpl-mainnet --json
```

Expected highlights:

- `symbol = RLUSD`
- `issuer` is present
- `currency = RLUSD`

## Check Trust-Line Status

```bash
node cli/rlusd/dist/index.js xrpl trustline status \
  --chain xrpl-mainnet \
  --address rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --json
```

Use this before planning a payment to the destination account.

## Read Account Info

```bash
node cli/rlusd/dist/index.js xrpl account info \
  --chain xrpl-mainnet \
  --address rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --json
```

## Prepare a Trust Line

```bash
node cli/rlusd/dist/index.js xrpl trustline prepare \
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
node cli/rlusd/dist/index.js xrpl trustline execute \
  --plan ./.rlusd/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --json
```

## Wait for Validation

```bash
node cli/rlusd/dist/index.js xrpl tx wait \
  --chain xrpl-mainnet \
  --hash <tx_hash> \
  --json
```

## Prepare a Payment

Before this step, make sure the destination already has an RLUSD trust line.

```bash
node cli/rlusd/dist/index.js xrpl payment prepare \
  --chain xrpl-mainnet \
  --from wallet:treasury-xrpl \
  --to rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh \
  --amount 250 \
  --json
```

If the destination account cannot receive RLUSD, preparation fails with
`TRUSTLINE_MISSING` or `DESTINATION_ACCOUNT_MISSING`.

## Execute the Prepared Payment

```bash
node cli/rlusd/dist/index.js xrpl payment execute \
  --plan ./.rlusd/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --json
```

## Read the Payment Receipt

```bash
node cli/rlusd/dist/index.js xrpl payment receipt \
  --chain xrpl-mainnet \
  --hash <tx_hash> \
  --json
```

## Notes

- the bundled registry currently targets XRPL Mainnet only
