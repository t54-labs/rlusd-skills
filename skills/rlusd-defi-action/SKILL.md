---
name: rlusd-defi-action
description: Execute an explicit RLUSD DeFi workflow using the external rlusd-cli runtime, including prepared swap, LP, and Aave supply execution flows.
user-invocable: true
---

# Purpose

Use this skill when the user explicitly wants to take a DeFi action with RLUSD,
not just discover venues or preview routes.

# When To Use This Skill

- The user wants to preview, prepare, or execute an RLUSD DeFi swap, LP, or supply flow.
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
- Use `defi quote swap` for live quote reads before any swap decision.
- For predictable automation, prefer passing explicit `--chain` on top-level
  `defi` commands. If omitted, the CLI can also resolve it from the global flag
  or `default_chain` config.
- Pass explicit `--venue` on swap quote, swap prepare, LP preview, and LP
  prepare flows. Swap and LP execute commands load the venue from the stored
  plan instead.
- If a swap quote returns `QUOTE_UNAVAILABLE`, retry common Uniswap fee tiers
  `100`, `500`, `3000`, and `10000` before concluding the pair is unavailable.
- Use `--venue uniswap` when fee-tier selection matters.
- Use `--venue curve` for the bundled Ethereum mainnet RLUSD/USDC swap and LP
  flows.
- Before any DeFi action that uses `--from-wallet`, load `rlusd-wallets` to
  confirm the local wallet alias or provision one with explicit user approval.
- For swaps, use `defi swap prepare`, review the stored steps, then
  `defi swap execute` with the reviewed `plan_id`.
- For Curve LP, use `defi lp preview`, then `defi lp prepare`, then
  `defi lp execute`.
- For the current Aave lending flow, use `defi supply preview`, then
  `defi supply prepare`, then `defi supply execute` with the reviewed `plan_id`.

# Current Command Sequence

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lp,lend --json
rlusd defi swap prepare --chain ethereum-mainnet --venue curve --from-wallet ops --from RLUSD --to USDC --amount 1000 --slippage 50 --json
rlusd defi swap execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd defi lp preview --chain ethereum-mainnet --venue curve --operation add --rlusd-amount 1000 --usdc-amount 1000 --json
rlusd defi lp prepare --chain ethereum-mainnet --venue curve --operation remove --from-wallet ops --lp-amount 50 --receive-token RLUSD --json
rlusd defi lp execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
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
- Examples in this skill pass explicit `--chain` and `--venue` for
  predictability, but `--chain` can also come from the global flag or
  `default_chain` config.
- Swap quote, LP preview, and prepare flows take explicit `--venue`; execute
  flows read the venue from the stored plan.
- Curve support is intentionally narrow: `ethereum-mainnet` only, RLUSD/USDC
  only for swaps, and add/remove LP through `defi lp`.
- `defi lp preview` is preview-only and does not return `plan_id`, `plan_path`,
  or `intent.steps`.
- The current supply execute path is still Aave-only.
- Aave supply execution submits the stored `approve` step before the stored
  `supply` step.
- Swap and LP execute paths also submit the stored plan steps in order.
- Do not assume the example wallet alias `ops` already exists locally; use
  `rlusd-wallets` before wallet-backed prepare or execute steps.
- Mainnet DeFi execution requires explicit confirmation using the prepared
  `plan_id`.

# Examples

- "Prepare swapping RLUSD to USDC on Curve." -> run `defi swap prepare`
- "Preview adding Curve liquidity." -> run `defi lp preview`
- "Prepare removing Curve liquidity to RLUSD." -> run `defi lp prepare`
- "Prepare supplying 5000 RLUSD to Aave." -> run `defi supply prepare`
- "Prepare supplying 5000 RLUSD to Aave from my wallet." -> use `rlusd-wallets`, then run `defi supply prepare`
- "Submit the reviewed DeFi plan." -> run the matching `defi ... execute`
