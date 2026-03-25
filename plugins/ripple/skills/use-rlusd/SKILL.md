---
name: use-rlusd
description: Route RLUSD requests to the correct chain workflow and keep side effects behind explicit planning.
user-invocable: false
---

# Purpose

Use this skill when a request involves RLUSD and you need to decide whether the
task belongs to Ethereum or XRPL.

# When To Use This Skill

- The user mentions RLUSD without clearly naming a chain.
- The task involves balances, transfers, trust lines, approvals, or issuer
  metadata.
- You need to route a prompt to a more specific RLUSD skill.

# Do Not Use This Skill When

- The request is not about RLUSD.
- The request is about Ripple onboarding, bank accounts, or wire instructions.
- The task is already clearly chain-specific and a child skill applies.

# Decision Guide

- Route to `use-rlusd-ethereum` for `0x...` addresses, `approve`, `permit`,
  `allowance`, `ERC-20`, or proxy-contract questions.
- Route to `use-rlusd-evm-defi` for swap previews, venue discovery, lending,
  LP, vault, or broader DeFi routing questions on EVM chains.
- Route to `use-rlusd-xrpl` for `r...` addresses, `trust line`, `TrustSet`,
  `destination tag`, or issuer-model questions.
- Route to `buy-redeem-rlusd` for onboarding, bank accounts, wire references,
  or direct institutional buy/redeem questions.
- Route to `rlusd-transfer` for explicit reviewed RLUSD transfer/payment action
  flows.
- Route to `rlusd-trustline` for explicit reviewed XRPL trust-line creation or
  updates.
- Route to `rlusd-defi-action` for explicit reviewed RLUSD DeFi action flows.
- Keep all write actions on a `prepare -> review -> execute` path.
- Ethereum and XRPL both support `prepare` and `execute`.
- Use chain-specific wait and receipt commands after execution instead of
  inferring transaction finality.

# Current Command Sequence

1. Resolve RLUSD metadata for the intended chain.
2. For Ethereum DeFi discovery, live swap quotes, and Aave supply preview/prepare/execute,
   use the `defi` namespace.
3. For Ethereum reads, use the `evm` namespace.
4. For Ethereum planning, use the `prepare` commands first and only call `execute`
   with an explicit confirmation that matches the prepared plan id.
5. For chain-specific post-submit status, use `evm tx ...` or `xrpl tx ...`
   commands plus chain-specific receipt commands.
6. For institutional onboarding, direct buy, and redeem guidance, use the `fiat`
   namespace.
7. For XRPL reads, planning, execution, and receipts, use the `xrpl` namespace.
8. Load the matching child skill before attempting chain-specific reasoning.

```bash
rlusd resolve asset --chain ethereum-mainnet --json
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from-wallet ops --amount 5000 --json
rlusd defi supply execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd evm balance --chain ethereum-mainnet --address 0x... --json
rlusd evm allowance --chain ethereum-mainnet --owner 0x... --spender 0x... --json
rlusd evm transfer prepare --chain ethereum-mainnet --from-wallet ops --to 0x... --amount 25.5 --json
rlusd evm transfer execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd evm tx wait --chain ethereum-mainnet --hash 0x... --json
rlusd evm tx receipt --chain ethereum-mainnet --hash 0x... --json
rlusd evm approve prepare --chain ethereum-mainnet --owner-wallet ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --json
rlusd resolve asset --chain xrpl-mainnet --json
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
rlusd xrpl account info --chain xrpl-mainnet --address r... --json
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --json
rlusd xrpl payment prepare --chain xrpl-mainnet --from-wallet treasury-xrpl --to r... --amount 250 --json
rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash ABCD... --json
rlusd xrpl payment receipt --chain xrpl-mainnet --hash ABCD... --json
rlusd fiat onboarding checklist --json
rlusd fiat buy instructions --json
rlusd fiat redeem instructions --json
```

# Common Warnings

- Do not infer RLUSD addresses from memory. Use the CLI registry output.
- Ethereum RLUSD must use the proxy contract, not the implementation contract.
- XRPL flows depend on issuer and trust-line semantics and should not be treated
  like ERC-20 transfers.
- `defi quote swap` is live quote data and should be described with quote
  freshness metadata such as `quoted_at`, `ttl_seconds`, and `expires_at`.
- If a requested chain is missing from the registry, fail clearly and extend the
  registry instead of inventing runtime values.

# Examples

- "Check RLUSD metadata on Ethereum." -> use `use-rlusd-ethereum`
- "Where can RLUSD be used in DeFi?" -> use `use-rlusd-evm-defi`
- "Can this XRPL wallet receive RLUSD?" -> use `use-rlusd-xrpl`
- "How do I buy or redeem RLUSD directly with Ripple?" -> use `buy-redeem-rlusd`

# References

- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl
