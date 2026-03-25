---
name: rlusd-transfer
description: Execute an explicit RLUSD transfer or payment workflow using the external rlusd-cli runtime with prepare, review, execute, and receipt steps.
---

# Purpose

Use this skill when the user explicitly wants to move RLUSD and is ready to go
through the action workflow rather than just inspect metadata or balances.

# When To Use This Skill

- The user says to send, transfer, pay, or move RLUSD.
- The user wants to prepare or execute an Ethereum RLUSD transfer or approval.
- The user wants to prepare or execute an XRPL RLUSD payment.

# Do Not Use This Skill When

- The task is only about balances, allowances, trust-line status, or other
  read-only checks.
- The task is specifically about XRPL trust-line creation or updates; use
  `rlusd-trustline`.
- The task is specifically about DeFi venue discovery, previews, or Aave supply;
  use `rlusd-defi-action`.

# Decision Guide

- On Ethereum, use `evm transfer ...` for token transfers and `evm approve ...`
- On XRPL, use `xrpl payment ...`
- Always start with `prepare`, review the resulting `plan_id` and `plan_path`,
  then call `execute` with a matching `--confirm-plan-id`.
- After submit, use the chain-specific wait or receipt commands instead of
  guessing whether the action finalized.

# Current Command Sequence

```bash
rlusd evm transfer prepare --chain ethereum-mainnet --from-wallet ops --to 0x... --amount 25.5 --json
rlusd evm transfer execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd evm tx wait --chain ethereum-mainnet --hash 0x... --json

rlusd evm approve prepare --chain ethereum-mainnet --owner-wallet ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd evm tx receipt --chain ethereum-mainnet --hash 0x... --json

rlusd xrpl payment prepare --chain xrpl-mainnet --from-wallet treasury-xrpl --to r... --amount 250 --json
rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash ABCD... --json
rlusd xrpl payment receipt --chain xrpl-mainnet --hash ABCD... --json
```

# Common Warnings

- Use the exact `plan_path` and `plan_id` returned by `prepare`.
- Ethereum and XRPL mainnet execution requires explicit confirmation.
- XRPL payment execution depends on the destination account already having a
  trust line when RLUSD is required there.
- Follow wait/receipt commands after execution instead of assuming submission
  equals success.

# Examples

- "Send 25.5 RLUSD on Ethereum." -> run `evm transfer prepare`
- "Approve RLUSD for this spender." -> run `evm approve prepare`
- "Pay 250 RLUSD on XRPL." -> run `xrpl payment prepare`
