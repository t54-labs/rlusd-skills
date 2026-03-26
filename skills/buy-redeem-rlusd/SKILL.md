---
name: buy-redeem-rlusd
description: RLUSD buy and redeem guidance. Use for manual provider, rail, and prerequisite instructions, not automated fiat execution.
user-invocable: true
---

# Purpose

Use this skill when the request is about buying or redeeming RLUSD through
manual provider guidance rather than on-chain token transfers.

# When To Use This Skill

- The prompt mentions onboarding, bank accounts, wire funding, wallet IDs,
  payment rails, direct buy, or redeeming RLUSD.
- The user needs provider and rail guidance for a manual and chain-agnostic
  buy or redeem flow.
- The task is about prerequisites and process rather than chain execution.

# Do Not Use This Skill When

- The task is about direct ERC-20 transfers, approvals, or DeFi on Ethereum.
- The task is about XRPL trust line setup or XRPL payments outside the direct
  fiat buy/redeem flow.
- The user expects the CLI to place wires or submit Ripple onboarding for them.

# Decision Guide

- Start with `rlusd fiat onboarding checklist --json` when the user is not yet
  onboarded.
- Use `rlusd fiat buy instructions --json` when the user needs provider and rail
  guidance for RLUSD acquisition.
- Use `rlusd fiat redeem instructions --json` when the user needs the redemption
  process and settlement caveats.

# Current Command Sequence

```bash
rlusd fiat onboarding checklist --json
rlusd fiat buy instructions --json
rlusd fiat redeem instructions --json
```

Use the output to confirm:

- the process is clearly marked as manual and chain-agnostic,
- the guidance identifies provider and rail guidance instead of implying a
  single bank-wire-only path,
- the JSON guidance is chain-agnostic and omits `chain`,
- chain-specific prerequisites such as XRPL trust lines should be checked
  separately with the chain skills,
- and warnings distinguish provider settlement timing from on-chain finality.

# Common Warnings

- These commands generate instructions only. They do not automate onboarding,
  provider onboarding, payment method setup, or redemption submission.
- The JSON envelopes intentionally omit `chain`; chain-specific state should be
  checked with the Ethereum or XRPL skills.
- Provider availability, supported rails, and settlement timing can vary by
  region or partner.
- XRPL buy flows require a trust line before the wallet can receive RLUSD.
- Provider settlement timing is distinct from blockchain confirmation timing.

# Examples

- "How do I onboard to buy RLUSD?" -> run `rlusd fiat onboarding checklist --json`
- "What are the steps to buy RLUSD?" -> run `rlusd fiat buy instructions --json`
- "What are the steps to redeem RLUSD?" -> run `rlusd fiat redeem instructions --json`

# References

- https://docs.ripple.com/products/stablecoin/user-interface/tutorials/connect-your-accounts
- https://docs.ripple.com/products/stablecoin/user-interface/settings/bank-accounts
- https://docs.ripple.com/products/stablecoin/user-interface/tutorials/buy-rlusd
