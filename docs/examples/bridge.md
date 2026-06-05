# Bridge Examples

These examples target the current external `rlusd-cli` Wormhole NTT bridge
surface. Bridge commands use NTT chain labels such as `ethereum`, `base`,
`optimism`, `ink`, and `unichain`.

XRPL L1 to EVM bridging is not supported by Wormhole NTT.

## Prerequisites

- install `rlusd-cli` from the `main` branch
- build the CLI before testing examples
- configure source-chain RPC before `bridge prepare`
- configure a local EVM wallet alias before `bridge execute`
- use a low-value wallet for initial live bridge execution

## List Supported Routes

```bash
rlusd bridge routes --json
```

Use live Wormholescan metadata when current deployment data matters:

```bash
rlusd bridge routes --live --json
```

## Inspect Metadata

```bash
rlusd bridge metadata --json
rlusd bridge metadata --live --json
```

The default metadata command can use bundled static metadata. `--live` asks
Wormholescan for current NTT deployment data.

## Estimate Ethereum to Base

```bash
rlusd bridge estimate \
  --from ethereum \
  --to base \
  --amount 500 \
  --json
```

The estimate returns route fields, source outbound and destination inbound
limits, expected flow, warnings, and Wormhole links.

## Prepare a Bridge Plan

```bash
rlusd bridge prepare \
  --from ethereum \
  --to base \
  --amount 500 \
  --recipient 0x1234567890123456789012345678901234567890 \
  --json
```

`bridge prepare` is non-destructive on-chain, but it needs a source-chain RPC
for `quoteDeliveryPrice` and writes a local plan file. Review the emitted
`plan_id`, `plan_path`, `approval_data`, `transfer_data`, and
`required_native_value_wei`.

Use live metadata for production-oriented preparation when possible:

```bash
rlusd bridge prepare \
  --from ethereum \
  --to base \
  --amount 500 \
  --recipient 0x1234567890123456789012345678901234567890 \
  --live \
  --json
```

Optional prepare flags:

```bash
rlusd bridge prepare \
  --from ethereum \
  --to base \
  --amount 500 \
  --recipient 0x1234567890123456789012345678901234567890 \
  --refund-address 0x1234567890123456789012345678901234567890 \
  --queue \
  --live \
  --json
```

## Execute a Reviewed Plan

```bash
rlusd bridge execute \
  --plan ~/.config/rlusd-cli/plans/<plan_id>.json \
  --from-wallet ops \
  --confirm-plan-id <plan_id> \
  --password "$RLUSD_WALLET_PASSWORD" \
  --json
```

`bridge execute` submits an approval transaction and then an NTT transfer
transaction. Do not run it during docs verification. Use it only after reviewing
the prepared plan and intentionally selecting a funded EVM wallet.

## Check Status and History

```bash
rlusd bridge status <id> --json
rlusd bridge history --limit 20 --json
rlusd bridge history --address 0x1234567890123456789012345678901234567890 --limit 20 --json
```

`bridge status <id>` accepts an operation id, Wormhole sequence, source tx hash,
or target tx hash. `bridge history --limit` accepts values from 1 through 100
and can filter by `--address`.

## Unsupported XRPL Bridge Route

Do not use Wormhole NTT for XRPL L1 to EVM bridging. The current CLI returns a
structured `COMMAND_ERROR` for XRPL L1 bridge attempts, for example:

```bash
rlusd bridge estimate --from xrpl --to base --amount 1 --json
```
