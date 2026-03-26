---
name: rlusd-trustline
description: Create or update an RLUSD XRPL trust line using the external rlusd-cli runtime with explicit prepare, review, execute, and wait steps.
user-invocable: true
---

# Purpose

Use this skill when the user explicitly wants to create or update an RLUSD trust
line on XRPL.

# When To Use This Skill

- The user wants to receive RLUSD on XRPL and needs the trust line created first.
- The user wants to update the RLUSD trust line limit.
- The user is responding to a trust-line prerequisite surfaced by another RLUSD
  flow.

# Do Not Use This Skill When

- The task is just checking whether a trust line exists.
- The task is an XRPL RLUSD payment after the trust line already exists; use
  `rlusd-transfer`.
- The task is about Ethereum approvals/transfers or DeFi actions.

# Decision Guide

- Start with `xrpl trustline status` when the current account state is not known.
- Before any step that depends on a local signer wallet alias, load
  `rlusd-wallets` to distinguish the on-ledger `r...` address from the local
  wallet used by `--wallet`.
- Use `xrpl trustline prepare` to create the reviewed plan artifact.
- Use `xrpl trustline execute` only with the exact `plan_id` returned by
  `prepare`.
- Use `xrpl tx wait` after submit to confirm ledger validation.

# Current Command Sequence

```bash
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash ABCD... --json
```

# Common Warnings

- Trust-line changes are on-chain state changes and should be reviewed before
  execution.
- Mainnet trust-line execution requires explicit confirmation.
- Execute examples pass `--password "$RLUSD_WALLET_PASSWORD"` explicitly for
  predictability; the CLI can also read `RLUSD_WALLET_PASSWORD` from the
  environment.
- Examples pass `--chain xrpl-mainnet` for predictability. On the current CLI
  surface, some help output may only list `--address`, but `--chain` is still
  accepted via the global flag.
- Do not assume an XRPL account address or the example alias `treasury-xrpl` is
  already configured as a local signer; use `rlusd-wallets` first.
- A trust line is distinct from an XRPL payment; it is a prerequisite, not the
  transfer itself.

# Examples

- "Create the RLUSD trust line on XRPL." -> run `xrpl trustline prepare`
- "Create the RLUSD trust line for my XRPL wallet." -> use `rlusd-wallets`, then run `xrpl trustline prepare`
- "Raise the RLUSD trust line limit to 100000." -> run `xrpl trustline prepare`
