# Ethereum Examples

## Prerequisites

- build the CLI with `pnpm --filter rlusd build`
- set `ETHEREUM_MAINNET_RPC_URL`
- configure `.rlusd/config.json` if you plan to execute a transaction

Example wallet config entry:

```json
{
  "wallets": {
    "ops": {
      "chain": "ethereum-mainnet",
      "address": "0x1234567890123456789012345678901234567890",
      "signer": "env:OPS_PRIVATE_KEY"
    }
  }
}
```

## Resolve RLUSD Metadata

```bash
node cli/rlusd/dist/index.js resolve asset --chain ethereum-mainnet --json
```

Expected highlights:

- `symbol = RLUSD`
- `address_type = proxy`
- `decimals = 18`

## Read a Balance

```bash
node cli/rlusd/dist/index.js evm balance \
  --chain ethereum-mainnet \
  --address 0x1234567890123456789012345678901234567890 \
  --json
```

## Read an Allowance

```bash
node cli/rlusd/dist/index.js evm allowance \
  --chain ethereum-mainnet \
  --owner 0x1234567890123456789012345678901234567890 \
  --spender 0x1111111111111111111111111111111111111111 \
  --json
```

## Prepare a Transfer

```bash
node cli/rlusd/dist/index.js evm transfer prepare \
  --chain ethereum-mainnet \
  --from wallet:ops \
  --to 0x1111111111111111111111111111111111111111 \
  --amount 25.5 \
  --json
```

Review the returned:

- `data.plan_id`
- `data.plan_path`
- `data.human_summary`
- `data.intent.to`
- `data.intent.data`

## Execute the Prepared Transfer

Use the exact values returned by `prepare`:

```bash
node cli/rlusd/dist/index.js evm transfer execute \
  --plan ./.rlusd/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --json
```

The response returns the submitted `tx_hash`.

## Wait for Mining

```bash
node cli/rlusd/dist/index.js evm tx wait \
  --chain ethereum-mainnet \
  --hash 0x<tx_hash> \
  --json
```

## Inspect the Receipt

```bash
node cli/rlusd/dist/index.js evm tx receipt \
  --chain ethereum-mainnet \
  --hash 0x<tx_hash> \
  --json
```

## Prepare and Execute an Approval

```bash
node cli/rlusd/dist/index.js evm approve prepare \
  --chain ethereum-mainnet \
  --owner wallet:ops \
  --spender 0x2222222222222222222222222222222222222222 \
  --amount 1000 \
  --json

node cli/rlusd/dist/index.js evm approve execute \
  --plan ./.rlusd/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --json
```

## Notes

- this toolkit currently documents Ethereum Mainnet only in the bundled registry
