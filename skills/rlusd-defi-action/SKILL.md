---
name: rlusd-defi-action
description: Execute an explicit RLUSD DeFi workflow using the external rlusd-cli runtime, with live quote reads and Aave-only supply execution in the current batch.
user-invocable: true
---

# Purpose

Use this skill when the user explicitly wants to take a DeFi action with RLUSD,
not just discover venues or preview routes.

# When To Use This Skill

- The user wants to preview, prepare, or execute an RLUSD DeFi supply flow.
- The user already reviewed a DeFi plan and now wants to submit it.
- The user wants a concrete DeFi action path rather than general venue discovery.

# Do Not Use This Skill When

- The task is only about DeFi discovery or swap preview; use
  `use-rlusd-evm-defi`.
- The task is about direct Ethereum token transfer/approval or XRPL trust-line
  and payment flows.
- The task is about institutional buy/redeem guidance.

# Decision Guide

- Start with `defi venues` to confirm the venue supports the required
  capability.
- Use `defi quote swap` for live quote reads only. Swap execution is not
  implemented in this repo.
- If a swap quote returns `QUOTE_UNAVAILABLE`, retry common Uniswap fee tiers
  `100`, `500`, `3000`, and `10000` before concluding the pair is unavailable.
- Treat `curve` as discovery-only in the current quote flow. `defi quote swap`
  currently routes through Uniswap and does not accept `--venue`.
- Before any DeFi action that uses `--from-wallet`, load `rlusd-wallets` to
  confirm the local wallet alias or provision one with explicit user approval.
- For the current Aave-only lending flow, use `defi supply preview`, then
  `defi supply prepare`, then `defi supply execute` with the reviewed
  `plan_id`.

# Current Command Sequence

```bash
rlusd defi venues --chain ethereum-mainnet --capability lend --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from-wallet ops --amount 5000 --json
rlusd defi supply execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
```

# Common Warnings

- `defi quote swap` is live quote data and should be treated as expiring market
  data, while `defi supply preview` remains preview-only guidance.
- `defi quote swap` defaults to Uniswap fee tier `3000`; a revert there does not
  prove the pair is unsupported.
- Retry `--fee-tier 100`, `500`, `3000`, and `10000` before reporting
  `QUOTE_UNAVAILABLE` for a pair.
- `defi venues` may list `curve`, but the current quote path is Uniswap-only and
  does not support `--venue`.
- The current supply execute path is Aave-only.
- Aave supply execution submits the stored `approve` step before the stored
  `supply` step.
- Do not assume the example wallet alias `ops` already exists locally; use
  `rlusd-wallets` before wallet-backed prepare or execute steps.
- Mainnet DeFi execution requires explicit confirmation using the prepared
  `plan_id`.

# Examples

- "Prepare supplying 5000 RLUSD to Aave." -> run `defi supply prepare`
- "Prepare supplying 5000 RLUSD to Aave from my wallet." -> use `rlusd-wallets`, then run `defi supply prepare`
- "Submit the reviewed Aave supply plan." -> run `defi supply execute`
