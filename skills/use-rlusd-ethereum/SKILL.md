---
name: use-rlusd-ethereum
description: RLUSD on Ethereum. Use for proxy address resolution, ERC-20 semantics, read commands, prepare workflows, controlled execution, and transaction status checks.
user-invocable: true
---

# Purpose

Use this skill for RLUSD tasks on Ethereum, especially when the user needs the
current contract metadata or when the workflow depends on ERC-20 behavior.

# When To Use This Skill

- The prompt mentions Ethereum, Mainnet, Sepolia, or an `0x...` address.
- The task involves `approve`, `allowance`, `permit`, `transfer`, or proxy
  contract reasoning.
- You need authoritative RLUSD token metadata before building another action.

# Do Not Use This Skill When

- The task is about XRPL trust lines or destination tags.
- The request is about Ripple bank-wire or onboarding flows.
- The task is specifically about DeFi venue discovery or swap previews; use
  `use-rlusd-evm-defi` instead.

# Decision Guide

- Start with registry resolution before any balance or transfer logic.
- Use top-level `balance` for RLUSD balance reads on Ethereum.
- Use `eth allowance` for wallet-backed allowance checks; the current CLI does
  not expose a raw `--owner <address>` pair under `evm`.
- Treat the proxy address as the canonical integration address.
- Treat issuer-admin features such as freeze, clawback, and upgrades as risk
  constraints, not end-user actions.
- Before transfer or approval flows that use `--from-wallet` or
  `--owner-wallet`, load `rlusd-wallets` to confirm the local wallet alias or
  provision one with explicit user approval.
- For explicit transfer or approval action flows after the chain is known, use
  `rlusd-transfer`.

# Current Command Sequence

```bash
rlusd resolve asset --chain ethereum-mainnet --json
rlusd balance --chain ethereum --address 0x... --json
rlusd eth allowance --chain ethereum --owner-wallet ops --spender 0x... --json
rlusd evm transfer prepare --chain ethereum-mainnet --from-wallet ops --to 0x... --amount 25.5 --json
rlusd evm transfer execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd evm tx wait --chain ethereum-mainnet --hash 0x... --json
rlusd evm tx receipt --chain ethereum-mainnet --hash 0x... --json
rlusd evm approve prepare --chain ethereum-mainnet --owner-wallet ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
```

Use the output to confirm:

- `symbol` is `RLUSD`
- `address_type` is `proxy`
- `decimals` is `18`
- balance reads and wallet-backed allowance checks resolve against the same
  proxy-backed asset metadata
- transfer and approval plans resolve against the same proxy-backed asset metadata
- execute commands submit the same encoded intent only after explicit confirmation
- transaction wait and receipt commands inspect the submitted on-chain hash directly

# Common Warnings

- Never use the implementation contract when the proxy address is available.
- Do not hardcode addresses into prompts or scripts when the CLI can resolve
  them.
- Do not use legacy `rlusd evm balance` or `rlusd evm allowance` examples with
  the current CLI surface.
- Do not assume the example wallet alias `ops` already exists locally; check it
  with `rlusd-wallets` before any wallet-backed action.
- If the user asks for Sepolia and the registry does not have it yet, stop and
  add the registry entry rather than guessing the deployment.
- Treat `prepare` output as a review artifact. Do not skip directly to execution
  logic.
- Mainnet execute commands should require a confirmation that matches the
  prepared `plan_id`.
- Use `evm tx wait` or `evm tx receipt` after submission instead of assuming
  the transaction finalized successfully.

# Examples

- "What is the RLUSD contract on Ethereum?" -> run `resolve asset`
- "Is this the proxy or implementation address?" -> inspect `address_type`
- "What is the RLUSD balance for this wallet?" -> run `balance`
- "Has this spender been approved for RLUSD?" -> run `eth allowance`
- "Prepare an RLUSD transfer from my wallet for review." -> use `rlusd-wallets`, then run `evm transfer prepare`
- "Prepare an RLUSD transfer for review." -> run `evm transfer prepare`
- "Prepare an RLUSD approval for review." -> run `evm approve prepare`
- "Submit the reviewed RLUSD transfer." -> run `evm transfer execute`
- "Submit the reviewed RLUSD approval." -> run `evm approve execute`
- "Wait for the submitted RLUSD transaction." -> run `evm tx wait`
- "Inspect the mined RLUSD transaction receipt." -> run `evm tx receipt`

# References

- `./references/contracts.md`
- `./references/permit.md`
- `./references/transfers.md`
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
- https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-ethereum-design.md
