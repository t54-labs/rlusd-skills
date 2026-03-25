---
name: use-rlusd-evm-defi
description: RLUSD in EVM DeFi. Use for venue discovery, preview-only swap routing, and Aave-only supply preview/prepare/execute flows.
user-invocable: false
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
- The user expects live market prices. This batch only supports registry-backed
  preview quotes.

# Decision Guide

- Start with `defi venues` to discover chain-compatible RLUSD venues by capability.
- Use `defi quote swap` for a preview route only after confirming the venue matrix.
- Use `defi supply preview` and `defi supply prepare` for the first Aave-only
  lending flow.
- Only call `defi supply execute` after reviewing the prepared two-step plan.
- For the explicit action workflow around those DeFi commands, use
  `rlusd-defi-action`.
- Treat preview quotes as advisory, not executable market data.

# Current Command Sequence

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from wallet:ops --amount 5000 --json
rlusd defi supply execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
```

Use the output to confirm:

- the venue supports at least one requested capability from the filter,
- the preview route is marked as `reference_preview`,
- the quoted `amount_out` and the `reference_rate` are both explicitly marked as
  net of the listed fee for this static batch,
- Aave supply preview outputs are marked as preview-only and surface whether
  RLUSD is treated as collateral,
- Aave supply execute submits the stored `approve` step before the stored
  `supply` step,
- and warnings clearly state the quote is not live market data.

# Common Warnings

- These DeFi quotes are static registry-backed previews, not live market prices.
- Capability filters match venues that support any requested capability.
- Unsupported pairs should fail with structured `QUOTE_UNAVAILABLE` errors.
- This batch only supports `aave` for supply preview/prepare; other venues should
  fail clearly if they do not advertise `lend`.
- Aave supply execution depends on a reviewed prepared plan and a configured EVM
  signer.
- The current Aave supply flow is approve-based; it does not build a permit path
  yet.
- In this batch, `reference_rate` is a curator-defined all-in preview rate and
  `fee_bps` is disclosed alongside it.
- Venue capability flags are the source of truth for this batch; do not infer
  support from token listings or brand familiarity.
- Preview-only quotes do not imply execution support for that venue yet.

# Examples

- "Where can RLUSD be used in DeFi on Ethereum?" -> run `defi venues`
- "Preview swapping 1000 RLUSD to USDC." -> run `defi quote swap`
- "Preview supplying 5000 RLUSD to Aave." -> run `defi supply preview`
- "Prepare supplying 5000 RLUSD to Aave." -> run `defi supply prepare`
- "Submit the reviewed 5000 RLUSD Aave supply plan." -> run `defi supply execute`

# References

- `./references/venues.md`
- `./references/routing.md`
- `./references/risk-model.md`
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
