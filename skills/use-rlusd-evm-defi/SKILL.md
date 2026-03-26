---
name: use-rlusd-evm-defi
description: RLUSD in EVM DeFi. Use for venue discovery, live swap quotes, and Aave-only supply preview/prepare/execute flows.
user-invocable: true
---

# Purpose

Use this skill for RLUSD requests about DeFi venues, swap discovery, and
preview-first DeFi route selection on EVM chains.

# When To Use This Skill

- The prompt mentions DeFi, swaps, lending, LPs, vaults, or venue discovery.
- The user wants to know where RLUSD can be used before preparing a protocol action.
- The request is about previewing a swap route rather than executing on-chain
  token transfers directly.

# Do Not Use This Skill When

- The task is purely about proxy metadata, balances, allowances, or direct token
  transfer/approval flows.
- The task is about XRPL trust lines, payments, or destination tags.
- The task is about direct ERC-20 transfer or approval execution rather than DeFi
  discovery, quote, or supply flows.

# Decision Guide

- Start with `defi venues` to discover chain-compatible RLUSD venues by capability.
- Use `defi quote swap` for a live quote only after confirming the venue matrix.
- If the default quote returns `QUOTE_UNAVAILABLE`, retry common Uniswap fee tiers
  `100`, `500`, `3000`, and `10000` before concluding the pair is unavailable.
- Treat `curve` as discovery-only in this top-level flow. `defi quote swap`
  currently routes through Uniswap and does not accept `--venue`.
- Use `defi supply preview` and `defi supply prepare` for the first Aave-only
  lending flow.
- Before DeFi actions that use `--from-wallet`, load `rlusd-wallets` to confirm
  the local wallet alias or provision one with explicit user approval.
- Only call `defi supply execute` after reviewing the prepared two-step plan.
- For the explicit action workflow around those DeFi commands, use
  `rlusd-defi-action`.
- Treat quotes as time-sensitive market data and review freshness metadata before
  describing them.

# Current Command Sequence

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --json
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --fee-tier 100 --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from-wallet ops --amount 5000 --json
rlusd defi supply execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
```

Use the output to confirm:

- the venue supports at least one requested capability from the filter,
- the swap quote includes `quoted_at`, `ttl_seconds`, and `expires_at`,
- the quote result surfaces `fee_bps`, especially when a non-default fee tier is
  required,
- the quoted `amount_out` is treated as expiring live quote data,
- Aave supply preview outputs are marked as preview-only and surface whether
  RLUSD is treated as collateral,
- Aave supply execute submits the stored `approve` step before the stored
  `supply` step,
- and preview warnings stay attached to the supply preview flow rather than the
  live quote flow.

# Common Warnings

- `defi quote swap` is live quote data and should be treated as time-sensitive.
- `defi quote swap` defaults to Uniswap fee tier `3000`; a revert there does not
  prove the pair is unsupported.
- Retry `--fee-tier 100`, `500`, `3000`, and `10000` before concluding a quote is
  unavailable.
- `defi venues` may list `curve`, but the current quote path is Uniswap-only and
  does not support `--venue`.
- Capability filters match venues that support any requested capability.
- Unsupported pairs or unsupported symbols should fail with structured quote
  errors.
- This batch only supports `aave` for supply preview/prepare; other venues should
  fail clearly if they do not advertise `lend`.
- Aave supply execution depends on a reviewed prepared plan and a configured EVM
  signer.
- Do not assume the example wallet alias `ops` exists locally; use
  `rlusd-wallets` before wallet-backed prepare or execute steps.
- The current Aave supply flow is approve-based; it does not build a permit path
  yet.
- Venue capability flags are the source of truth for this batch; do not infer
  support from token listings or brand familiarity.
- Live quotes do not imply swap execution support in this repo.

# Examples

- "Where can RLUSD be used in DeFi on Ethereum?" -> run `defi venues`
- "Preview swapping 1000 RLUSD to USDC." -> run `defi quote swap`; if the
  default quote fails, retry common fee tiers before reporting `QUOTE_UNAVAILABLE`
- "Preview supplying 5000 RLUSD to Aave." -> run `defi supply preview`
- "Prepare supplying 5000 RLUSD to Aave from my wallet." -> use `rlusd-wallets`, then run `defi supply prepare`
- "Prepare supplying 5000 RLUSD to Aave." -> run `defi supply prepare`
- "Submit the reviewed 5000 RLUSD Aave supply plan." -> run `defi supply execute`

# References

- `./references/venues.md`
- `./references/routing.md`
- `./references/risk-model.md`
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
