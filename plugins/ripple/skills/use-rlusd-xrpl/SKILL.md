---
name: use-rlusd-xrpl
description: RLUSD on XRPL. Use for issuer resolution, trust-line semantics, read commands, prepare workflows, controlled execution, and transaction status checks.
user-invocable: false
---

# Purpose

Use this skill for RLUSD tasks on XRPL, where issuer and trust-line state are
core parts of the workflow.

# When To Use This Skill

- The prompt mentions XRPL, XRP Ledger, Testnet, or an `r...` address.
- The task involves trust lines, `TrustSet`, issuer configuration, or
  destination-tag awareness.
- You need current RLUSD issuer metadata before planning a payment flow.

# Do Not Use This Skill When

- The task is about ERC-20 approvals, allowances, or proxy contracts.
- The request is about Ripple bank onboarding or wire instructions.

# Decision Guide

- Resolve registry metadata first to confirm issuer details.
- Treat trust-line verification as a prerequisite for receive and transfer
  workflows.
- Keep destination-tag handling explicit whenever counterparties require it.
- For explicit trust-line creation/update flows, use `rlusd-trustline`.
- For explicit XRPL payment flows, use `rlusd-transfer`.

# Current Command Sequence

```bash
rlusd resolve asset --chain xrpl-mainnet --json
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
rlusd xrpl account info --chain xrpl-mainnet --address r... --json
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd xrpl payment prepare --chain xrpl-mainnet --from wallet:ops --to r... --amount 250 --json
rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash ABCD... --json
rlusd xrpl payment receipt --chain xrpl-mainnet --hash ABCD... --json
```

Use the output to confirm:

- `symbol` is `RLUSD`
- `issuer` matches the RLUSD issuer account
- `currency` is `RLUSD`
- trust-line status and account reads use the same issuer-backed registry metadata
- trust-line and payment plans resolve against the same issuer-backed registry metadata
- execute commands submit the same reviewed XRPL transaction JSON only after
  explicit confirmation

# Common Warnings

- XRPL RLUSD is an issued token, not an ERC-20 balance entry.
- Missing trust lines should block payment planning instead of being treated as
  a recoverable transfer error.
- If a network or issuer value is absent from the registry, extend the registry
  rather than guessing live XRPL metadata.
- Treat `prepare` output as a review artifact. Do not skip directly to execution
  logic.
- Use `xrpl tx wait` and `xrpl payment receipt` after submission instead of
  assuming ledger validation or delivery details.

# Examples

- "What issuer account backs RLUSD on XRPL?" -> run `resolve asset`
- "Can this XRPL account receive RLUSD?" -> run `trustline status`
- "Does this XRPL address exist and what is its sequence?" -> run `account info`
- "Prepare an RLUSD trust line for review." -> run `trustline prepare`
- "Prepare an RLUSD payment for review." -> run `payment prepare`
- "Submit the reviewed RLUSD trust line change." -> run `trustline execute`
- "Submit the reviewed RLUSD payment." -> run `payment execute`
- "Wait for XRPL transaction validation." -> run `tx wait`
- "Inspect the submitted RLUSD payment receipt." -> run `payment receipt`

# References

- `./references/trustlines.md`
- `./references/issuer-settings.md`
- `./references/payments.md`
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl
- https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-xrpl-settings.md
