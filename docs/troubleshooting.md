# Troubleshooting

## Unsupported Chain

Symptom:

- the CLI returns `UNSUPPORTED_CHAIN`

Cause:

- the requested chain key is not present in the bundled registry
- the current CLI uses different chain labels for top-level reads vs
  registry-backed prepared flows

What to do:

- use `ethereum-mainnet` for registry-backed `resolve`, `defi`, and prepared
  `evm ... prepare|execute|tx` flows
- use `ethereum` for top-level `rlusd balance` and `rlusd eth allowance`
- use `xrpl-mainnet` for the registry-backed XRPL flows documented in this repo
- if you need additional networks later, add the registry entry first instead of
  guessing chain metadata

## Unknown EVM Balance Command

Symptom:

- `error: unknown command 'balance'` after running `rlusd evm balance`

Cause:

- current CLI releases moved RLUSD balance reads to top-level `rlusd balance`
- allowance reads now live under `rlusd eth allowance`

What to do:

- use `rlusd balance --chain ethereum --address <0x-address> --json`
- use `rlusd eth allowance --chain ethereum --owner-wallet <wallet_name> --spender <0x-address> --json`
- keep prepared transfer, approval, and tx monitoring flows under `rlusd evm ...`

## Missing Wallet Alias

Symptom:

- execute commands fail because a local wallet name is not configured

Cause:

- `rlusd-cli` wallet/config storage is missing
- the named wallet does not exist
- the wallet is configured for a different chain

What to do:

- verify the named wallet after `--from-wallet`, `--owner-wallet`, or `--wallet`
- make sure the wallet `chain` matches the command's `--chain`
- confirm `RLUSD_WALLET_PASSWORD` is set when the command decrypts a local wallet

## Missing Environment Variables

Symptom:

- execution or wait/receipt commands fail asking for an env var

Common examples:

- `ETHEREUM_MAINNET_RPC_URL`
- the signer secret or wallet file expected by `rlusd-cli`

What to do:

- export the missing variable in the current shell
- confirm the env var name exactly matches the registry or wallet config entry

## Plan Integrity Mismatch

Symptom:

- `PLAN_INTEGRITY_MISMATCH`
- `Prepared plan contents do not match the stored deterministic plan id`

Cause:

- the stored plan JSON was edited after `prepare`

What to do:

- rerun the matching `prepare` command
- use the newly returned `plan_path` and `plan_id`

## Confirmation Required

Symptom:

- `CONFIRMATION_REQUIRED`

Cause:

- the loaded plan requires explicit confirmation and the provided
  `--confirm-plan-id` is missing or wrong

What to do:

- copy the exact `plan_id` from the `prepare` output
- rerun `execute --confirm-plan-id <plan_id>`

## XRPL Destination Cannot Receive RLUSD

Symptom:

- `TRUSTLINE_MISSING`

Cause:

- the destination account exists but does not currently have an RLUSD trust line

What to do:

- run `rlusd xrpl trustline status --chain xrpl-mainnet --address <r-address> --json`
- create the trust line before retrying the payment flow

## XRPL Destination Account Missing

Symptom:

- `DESTINATION_ACCOUNT_MISSING`

Cause:

- the destination XRPL account does not exist or is not activated

What to do:

- run `rlusd xrpl account info --chain xrpl-mainnet --address <r-address> --json`
- activate or correct the destination address before retrying

## DeFi Quote Unavailable

Symptom:

- `QUOTE_UNAVAILABLE`

Cause:

- the external CLI could not produce a supported live quote for that pair
- the selected Uniswap fee tier may not have a live RLUSD pool even when another
  supported tier does

What to do:

- list swap venues with `rlusd defi venues --chain ethereum-mainnet --capability swap --json`
- retry `defi quote swap --venue uniswap` with `--fee-tier 100`, `500`, `3000`, and `10000`
- do not conclude the pair is unsupported until those common Uniswap tiers fail
- `defi quote swap` requires explicit `--venue`; pass explicit `--chain` for
  predictability, or let the CLI resolve it from the global flag or
  `default_chain` config
- for the bundled Curve route, retry with `--venue curve` on `ethereum-mainnet`
  for the fixed `RLUSD <-> USDC` pool
- if all common tiers fail, fall back to currently modeled pairs only

## Venue or Capability Unsupported

Symptom:

- `VENUE_UNAVAILABLE`
- `CAPABILITY_UNSUPPORTED`
- `PREVIEW_UNAVAILABLE`

Cause:

- the venue is not configured for that chain
- the venue does not support the requested capability
- preview data is not modeled in the registry yet

What to do:

- inspect `rlusd defi venues --chain ethereum-mainnet --json`
- use `aave` for the current lend/supply path
- use the reported quote freshness fields before relying on a swap quote

## Unsupported Bridge Route

Symptom:

- bridge commands return a structured `COMMAND_ERROR`
- the message says XRPL L1 bridging is not supported
- the route uses a chain outside the supported Wormhole NTT labels

Cause:

- XRPL L1 to EVM bridging is not supported by Wormhole NTT
- the supported bridge labels are `ethereum`, `base`, `optimism`, `ink`, and
  `unichain`
- bridge commands use NTT family labels, not registry labels such as
  `ethereum-mainnet`

What to do:

- inspect supported routes with `rlusd bridge routes --json`
- estimate only supported EVM NTT routes, for example
  `rlusd bridge estimate --from ethereum --to base --amount 500 --json`
- for XRPL payments, use the XRPL payment and trust-line workflows instead of
  Wormhole NTT

## Bridge Metadata or Quote Unavailable

Symptom:

- live Wormholescan metadata is unavailable
- `bridge prepare` fails while quoting delivery value
- source-chain RPC is missing or unavailable

Cause:

- `--live` depends on Wormholescan
- `bridge prepare` needs source-chain RPC access for `quoteDeliveryPrice`
- the source chain may be missing RPC configuration

What to do:

- retry without `--live` if bundled metadata is acceptable for discovery
- confirm source-chain RPC config before `bridge prepare`
- use `bridge estimate` before `bridge prepare` to check route limits
- do not proceed to `bridge execute` until the local plan has been reviewed

## Invalid Address or Hash

Symptom:

- EVM or XRPL address validation errors
- `INVALID_HASH`

Cause:

- malformed user input

What to do:

- make sure EVM addresses are valid `0x...` values
- make sure XRPL addresses are valid classic `r...` addresses
- use 66-character hex for EVM tx hashes and 64-character hex for XRPL tx IDs
