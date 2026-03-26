---
name: use-rlusd-evm-defi
description: RLUSD in EVM DeFi. Use for venue discovery, live swap quotes, Curve LP previews, and Aave supply previews on EVM chains.
user-invocable: true
---

# Purpose

Use this skill for RLUSD requests about DeFi venues, live swap quotes, and
preview-first route selection for swap, LP, and supply flows on EVM chains.
Stop at discovery and preview here; hand off to `rlusd-defi-action` before any
plan-writing or submission step.

# When To Use This Skill

- The prompt mentions DeFi, swaps, lending, LPs, vaults, or venue discovery.
- The user wants to know where RLUSD can be used before choosing a protocol action.
- The request is about previewing a swap route rather than executing on-chain
  token transfers directly.

# Do Not Use This Skill When

- The task is purely about proxy metadata, balances, allowances, or direct token
  transfer/approval flows.
- The task is about XRPL trust lines, payments, or destination tags.
- The task is about creating or submitting a DeFi action plan; use
  `rlusd-defi-action`.

# Decision Guide

- Start with `defi venues` to discover chain-compatible RLUSD venues by capability.
- Use `defi quote swap` for a live quote only after confirming the venue matrix.
- For predictable automation, prefer passing explicit `--chain` on top-level
  `defi` commands. If omitted, the CLI can also resolve it from the global flag
  or `default_chain` config.
- Pass explicit `--venue` on swap quote and LP preview flows.
- If the default quote returns `QUOTE_UNAVAILABLE`, retry common Uniswap fee tiers
  `100`, `500`, `3000`, and `10000` before concluding the pair is unavailable.
- Use `--venue uniswap` when fee-tier selection matters.
- Use `--venue curve` for the bundled Ethereum mainnet RLUSD/USDC quote path and
  Curve LP preview path.
- Use `defi lp preview` for Curve LP discovery on `ethereum-mainnet`.
- Use `defi supply preview` for the first Aave-only lending preview flow.
- If the user wants to create a plan or submit a DeFi action, switch to
  `rlusd-defi-action` before any wallet-backed step.
- Treat quotes as time-sensitive market data and review freshness metadata before
  describing them.

# Current Command Sequence

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
rlusd defi quote swap --chain ethereum-mainnet --venue uniswap --from RLUSD --to USDC --amount 1000 --json
rlusd defi quote swap --chain ethereum-mainnet --venue uniswap --from RLUSD --to USDC --amount 1000 --fee-tier 100 --json
rlusd defi quote swap --chain ethereum-mainnet --venue curve --from RLUSD --to USDC --amount 1000 --json
rlusd defi lp preview --chain ethereum-mainnet --venue curve --operation add --rlusd-amount 1000 --usdc-amount 1000 --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
```

Use the output to confirm:

- the venue supports at least one requested capability from the filter,
- the swap quote includes `quoted_at`, `ttl_seconds`, and `expires_at`,
- the quote result surfaces `route.venue`, plus `fee_bps` for Uniswap or
  `pool_name`/`pool_address` for Curve,
- the quoted `amount_out` is treated as expiring live quote data,
- `defi lp preview` stays preview-only and does not return `plan_id`,
  `plan_path`, or `intent.steps`,
- Aave supply preview outputs are marked as preview-only and surface whether
  RLUSD is treated as collateral,
- and preview warnings stay attached to the supply preview flow rather than the
  live quote flow.

# Common Warnings

- `defi quote swap` is live quote data and should be treated as time-sensitive.
- `defi quote swap` defaults to Uniswap fee tier `3000`; a revert there does not
  prove the pair is unsupported.
- Retry `--fee-tier 100`, `500`, `3000`, and `10000` before concluding a quote is
  unavailable.
- Examples in this skill pass explicit `--chain` and `--venue` for
  predictability, but `--chain` can also come from the global flag or
  `default_chain` config.
- Swap quote and LP preview flows take explicit `--venue`.
- Curve support in this batch is intentionally narrow: `ethereum-mainnet` only,
  RLUSD/USDC only for swaps, and LP add/remove only through `defi lp`.
- Capability filters match venues that support any requested capability.
- Unsupported pairs or unsupported symbols should fail with structured quote
  errors.
- This batch only supports `aave` for supply preview; other venues should
  fail clearly if they do not advertise `lend`.
- This skill stops at discovery and preview; move to `rlusd-defi-action` before
  any wallet-backed plan creation or submission.
- Venue capability flags are the source of truth for this batch; do not infer
  support from token listings or brand familiarity.
- Live quotes and previews do not imply execution support in this skill.

# Examples

- "Where can RLUSD be used in DeFi on Ethereum?" -> run `defi venues`
- "Preview swapping 1000 RLUSD to USDC." -> run `defi quote swap`; if the
  Uniswap default quote fails, retry common fee tiers before reporting `QUOTE_UNAVAILABLE`
- "Preview adding Curve liquidity on Ethereum mainnet." -> run `defi lp preview`
- "Preview supplying 5000 RLUSD to Aave." -> run `defi supply preview`
- "Prepare or submit a DeFi action." -> switch to `rlusd-defi-action`

# References

- `./references/venues.md`
- `./references/routing.md`
- `./references/risk-model.md`
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
