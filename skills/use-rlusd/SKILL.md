---
name: use-rlusd
description: Route RLUSD requests to the correct chain workflow and keep side effects behind explicit planning.
user-invocable: true
---

# Purpose

Use this skill when a request involves RLUSD and you need to decide whether the
task belongs to Ethereum, XRPL, DeFi, x402, fiat guidance, or cross-chain bridge
workflows.

# When To Use This Skill

- The user mentions RLUSD without clearly naming a chain.
- The task involves balances, transfers, trust lines, approvals, or issuer
  metadata.
- The task involves RLUSD bridge, cross-chain, Wormhole, or NTT routing.
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
- Route to `rlusd-bridge` for bridge, cross-chain, Wormhole, NTT, Base,
  Optimism, Ink, or Unichain bridge requests.
- Route to `use-rlusd-xrpl` for `r...` addresses, `trust line`, `TrustSet`,
  `destination tag`, or issuer-model questions.
- Route to `buy-redeem-rlusd` for onboarding, provider/rail guidance, bank
  account questions, or direct fiat buy/redeem guidance.
- Route to `rlusd-transfer` for explicit reviewed RLUSD transfer/payment action
  flows.
- Route to `rlusd-trustline` for explicit reviewed XRPL trust-line creation or
  updates.
- Route to `rlusd-defi-action` for explicit reviewed RLUSD DeFi action flows.
- Route to `rlusd-wallets` when the user says "my wallet" or a planned command
  needs `--from-wallet`, `--owner-wallet`, or `--wallet`.
- Route to `rlusd-x402` for x402, paid API access, or HTTP payment negotiation
  requests on XRPL.
- If the request is broad or ambiguous, start with
  `rlusd resolve asset --chain ethereum-mainnet --json` to anchor the chain and
  asset metadata before routing further.
- If the user already said DeFi, start with
  `rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json`
  to orient the venue matrix before choosing a child skill.
- Before any wallet-backed action flow, load `rlusd-wallets` to confirm or
  provision the local wallet alias with explicit user approval.
- Keep all write actions on a `prepare -> review -> execute` path.
- Ethereum and XRPL both support `prepare` and `execute`.
- Use chain-specific wait and receipt commands after execution instead of
  inferring transaction finality.

# Current Command Sequence

1. If the request is broad or ambiguous, start with `rlusd resolve asset --chain ethereum-mainnet --json`.
2. If the user already said DeFi, start with `rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json`.
3. For Ethereum DeFi discovery, live swap quotes, and preview flows, use the
   `defi` namespace.
4. For bridge, cross-chain, Wormhole, or NTT requests, start with
   `rlusd bridge routes --json` or
   `rlusd bridge estimate --from ethereum --to base --amount 500 --json`.
5. For Ethereum reads, use top-level `balance` for RLUSD balances and
   `eth allowance` for wallet-backed allowance reads.
6. Before any wallet-backed Ethereum, XRPL, or bridge action, load `rlusd-wallets` if
   the flow depends on a local wallet alias.
7. For Ethereum planning, use the `prepare` commands first and only call `execute`
   with an explicit confirmation that matches the prepared plan id.
8. For chain-specific post-submit status, use `evm tx ...` or `xrpl tx ...`
   commands plus chain-specific receipt commands.
9. For bridge post-submit status, use `bridge status <id>` or `bridge history`.
10. For fiat onboarding, direct buy, and redeem guidance, use the `fiat`
   namespace.
11. For XRPL reads, planning, execution, and receipts, use the `xrpl` namespace.
12. Load the matching child skill before attempting chain-specific reasoning.

```bash
rlusd resolve asset --chain ethereum-mainnet --json
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
rlusd defi quote swap --chain ethereum-mainnet --venue curve --from RLUSD --to USDC --amount 1000 --json
rlusd defi quote swap --chain ethereum-mainnet --venue uniswap --from RLUSD --to USDC --amount 1000 --fee-tier 100 --json
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from-wallet ops --amount 5000 --json
rlusd defi supply execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd bridge routes --json
rlusd bridge estimate --from ethereum --to base --amount 500 --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --json
rlusd bridge execute --plan <plan_path_from_prepare> --from-wallet ops --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd balance --chain ethereum --address 0x... --json
rlusd eth allowance --chain ethereum --owner-wallet ops --spender 0x... --json
rlusd evm transfer prepare --chain ethereum-mainnet --from-wallet ops --to 0x... --amount 25.5 --json
rlusd evm transfer execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd evm tx wait --chain ethereum-mainnet --hash 0x... --json
rlusd evm tx receipt --chain ethereum-mainnet --hash 0x... --json
rlusd evm approve prepare --chain ethereum-mainnet --owner-wallet ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd resolve asset --chain xrpl-mainnet --json
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
rlusd xrpl account info --chain xrpl-mainnet --address r... --json
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl payment prepare --chain xrpl-mainnet --from-wallet treasury-xrpl --to r... --amount 250 --json
rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash ABCD... --json
rlusd xrpl payment receipt --chain xrpl-mainnet --hash ABCD... --json
rlusd fiat onboarding checklist --json
rlusd fiat buy instructions --json
rlusd fiat redeem instructions --json
rlusd x402 fetch <url> --wallet <name> --max-value <amount> --json
```

# Common Warnings

- Do not infer RLUSD addresses from memory. Use the CLI registry output.
- Ethereum RLUSD must use the proxy contract, not the implementation contract.
- XRPL flows depend on issuer and trust-line semantics and should not be treated
  like ERC-20 transfers.
- Top-level reads such as `balance`, `eth allowance`, and `wallet` commands use
  family aliases `ethereum` and `xrpl`, while network-scoped commands use
  `ethereum-mainnet` and `xrpl-mainnet`.
- Bridge commands use Wormhole NTT family labels: `ethereum`, `base`,
  `optimism`, `ink`, and `unichain`.
- XRPL L1 to EVM bridging is not supported by Wormhole NTT.
- Do not assume example wallet aliases like `ops` or `treasury-xrpl` already
  exist locally; use `rlusd-wallets` first when a flow depends on them.
- Execute examples in this repo pass `--password "$RLUSD_WALLET_PASSWORD"`
  explicitly for predictability, even though the CLI can also read the same
  secret from the environment.
- `defi quote swap` is live quote data and should be described with quote
  freshness metadata such as `quoted_at`, `ttl_seconds`, and `expires_at`.
- `defi quote swap` defaults to Uniswap fee tier `3000`; retry `100`, `500`,
  `3000`, and `10000` before concluding the pair is unavailable.
- `defi quote swap` currently requires explicit `--venue`; use `curve` for the
  bundled Ethereum mainnet `RLUSD <-> USDC` pool and `uniswap` when fee-tier
  selection matters.
- If a requested chain is missing from the registry, fail clearly and extend the
  registry instead of inventing runtime values.

# Examples

- "Check RLUSD metadata on Ethereum." -> use `use-rlusd-ethereum`
- "I want to use RLUSD but I'm not sure where to start." -> start with `rlusd resolve asset --chain ethereum-mainnet --json`
- "Where can RLUSD be used in DeFi?" -> use `use-rlusd-evm-defi`
- "I want to use RLUSD in DeFi." -> start with `rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json`
- "Bridge RLUSD from Ethereum to Base." -> use `rlusd-bridge`
- "Show RLUSD Wormhole routes." -> use `rlusd-bridge`
- "Can this XRPL wallet receive RLUSD?" -> use `use-rlusd-xrpl`
- "Check whether I have an RLUSD wallet configured." -> use `rlusd-wallets`
- "How do I buy or redeem RLUSD directly with Ripple?" -> use `buy-redeem-rlusd`
- "Access a paid API with RLUSD." -> use `rlusd-x402`
- "Fetch an x402-protected resource." -> use `rlusd-x402`

# References

- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl
