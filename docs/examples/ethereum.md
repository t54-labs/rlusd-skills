# Ethereum Examples

## Prerequisites

- install `rlusd-cli` from the pushed `feat/skills-backend-migration` branch
- set `RLUSD_WALLET_PASSWORD`
- configure an Ethereum wallet in `~/.config/rlusd-cli/wallets`
- set the Ethereum RPC in `~/.config/rlusd-cli/config.yml` if you are executing on chain

## Resolve RLUSD Metadata

```bash
rlusd resolve asset --chain ethereum-mainnet --symbol RLUSD --json
```

Expected highlights:

- `symbol = RLUSD`
- `address_type = proxy`
- `decimals = 18`

## Read a Balance

```bash
rlusd evm balance \
  --chain ethereum-mainnet \
  --address 0x1234567890123456789012345678901234567890 \
  --json
```

## Read an Allowance

```bash
rlusd evm allowance \
  --chain ethereum-mainnet \
  --owner 0x1234567890123456789012345678901234567890 \
  --spender 0x1111111111111111111111111111111111111111 \
  --json
```

## Prepare a Transfer

```bash
rlusd evm transfer prepare \
  --chain ethereum-mainnet \
  --from-wallet ops \
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
rlusd evm transfer execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

The response returns the submitted `tx_hash`.

## Wait for Mining

```bash
rlusd evm tx wait \
  --chain ethereum-mainnet \
  --hash 0x<tx_hash> \
  --json
```

## Inspect the Receipt

```bash
rlusd evm tx receipt \
  --chain ethereum-mainnet \
  --hash 0x<tx_hash> \
  --json
```

## Prepare and Execute an Approval

```bash
rlusd evm approve prepare \
  --chain ethereum-mainnet \
  --owner-wallet ops \
  --spender 0x2222222222222222222222222222222222222222 \
  --amount 1000 \
  --json

rlusd evm approve execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --confirm-plan-id <plan_id> \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

## Notes

- this toolkit currently documents Ethereum Mainnet only in the bundled registry
