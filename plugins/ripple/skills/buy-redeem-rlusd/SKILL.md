---
name: buy-redeem-rlusd
description: RLUSD institutional onboarding, buy, and redeem guidance. Use for parameterized checklists and wire-flow instructions, not automated fiat execution.
user-invocable: false
---

# Purpose

Use this skill when the request is about buying or redeeming RLUSD through
Ripple's institutional process rather than on-chain token transfers.

# When To Use This Skill

- The prompt mentions onboarding, bank accounts, wire funding, wallet IDs,
  direct buy, or redeeming RLUSD.
- The user needs operator instructions for Ripple's UI and bank-wire flow.
- The task is about prerequisites and process rather than chain execution.

# Do Not Use This Skill When

- The task is about direct ERC-20 transfers, approvals, or DeFi on Ethereum.
- The task is about XRPL trust line setup or XRPL payments outside the direct
  institutional buy/redeem flow.
- The user expects the CLI to place wires or submit Ripple onboarding for them.

# Decision Guide

- Start with `rlusd fiat onboarding checklist --json` when the user is not yet
  onboarded.
- Use `rlusd fiat buy instructions --wallet-id <wallet-id> --chain <chain> --json`
  when the user needs chain-specific funding steps for RLUSD acquisition.
- Use `rlusd fiat redeem instructions --wallet-id <wallet-id> --amount <amount> --json`
  when the user needs the redemption process and settlement caveats.

# Current Command Sequence

```bash
rlusd fiat onboarding checklist --json
rlusd fiat buy instructions --wallet-id wallet-123 --chain xrpl-mainnet --json
rlusd fiat redeem instructions --wallet-id wallet-123 --amount 10000 --json
```

Use the output to confirm:

- the process is clearly marked as manual and institutional,
- chain-specific prerequisites such as XRPL trust lines are surfaced,
- and warnings distinguish bank-wire timing from on-chain finality.

# Common Warnings

- These commands generate instructions only. They do not automate onboarding,
  bank registration, or wire submission.
- Only Ripple-approved bank accounts are valid for funding and redemption.
- XRPL buy flows require a trust line before the wallet can receive RLUSD.
- Banking settlement timing is distinct from blockchain confirmation timing.

# Examples

- "How do I onboard to buy RLUSD directly from Ripple?" -> run `rlusd fiat onboarding checklist --json`
- "What are the steps to buy RLUSD on XRPL with wallet ID wallet-123?" -> run `rlusd fiat buy instructions --wallet-id wallet-123 --chain xrpl-mainnet --json`
- "What are the steps to redeem 10000 RLUSD?" -> run `rlusd fiat redeem instructions --wallet-id wallet-123 --amount 10000 --json`

# References

- https://docs.ripple.com/products/stablecoin/user-interface/tutorials/connect-your-accounts
- https://docs.ripple.com/products/stablecoin/user-interface/settings/bank-accounts
- https://docs.ripple.com/products/stablecoin/user-interface/tutorials/buy-rlusd
