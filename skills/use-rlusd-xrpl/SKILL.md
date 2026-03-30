---
name: use-rlusd-xrpl
description: RLUSD on XRPL. Use for issuer resolution, trust-line semantics, read commands, prepare workflows, controlled execution, and transaction status checks.
user-invocable: true
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
- Before wallet-backed XRPL payment or trust-line execution flows, load
  `rlusd-wallets` to distinguish the on-ledger `r...` address from the local
  signer alias used by `--wallet` or `--from-wallet`.
- For explicit trust-line creation/update flows, use `rlusd-trustline`.
- For explicit XRPL payment flows, use `rlusd-transfer`.
- XRPL DEX for native XRP/RLUSD limit orders (`buy`, `sell`, `cancel`,
  `orderbook`).
- XRPL AMM for XRP/RLUSD pool operations (`info`, `deposit`, `withdraw`,
  `vote`, `swap`).
- Pathfind for cross-currency RLUSD payment routing (read-only, no signing).
- Note: DEX, AMM, and pathfind are direct execution commands with no
  `prepare`/`execute` pattern.

# Current Command Sequence

```bash
rlusd resolve asset --chain xrpl-mainnet --json
rlusd xrpl trustline status --chain xrpl-mainnet --address r... --json
rlusd xrpl account info --chain xrpl-mainnet --address r... --json
rlusd xrpl trustline prepare --chain xrpl-mainnet --address r... --limit 100000 --json
rlusd xrpl trustline execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl payment prepare --chain xrpl-mainnet --from-wallet treasury-xrpl --to r... --amount 250 --json
rlusd xrpl payment execute --plan <plan_path_from_prepare> --confirm-plan-id <plan_id_from_prepare> --wallet treasury-xrpl --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl tx wait --chain xrpl-mainnet --hash ABCD... --json
rlusd xrpl payment receipt --chain xrpl-mainnet --hash ABCD... --json

# XRPL DEX — native XRP/RLUSD limit orders (direct execution)
rlusd xrpl dex orderbook --json
rlusd xrpl dex buy --amount 100 --price 0.5 --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl dex sell --amount 100 --price 2.0 --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl dex cancel --sequence 12345 --password "$RLUSD_WALLET_PASSWORD" --json

# XRPL AMM — XRP/RLUSD pool (direct execution)
rlusd xrpl amm info --json
rlusd xrpl amm deposit --xrp 100 --rlusd 200 --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl amm withdraw --lp-tokens 50 --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl amm vote --fee 500 --password "$RLUSD_WALLET_PASSWORD" --json
rlusd xrpl amm swap --sell-xrp 10 --password "$RLUSD_WALLET_PASSWORD" --json

# XRPL path finding (read-only)
rlusd xrpl pathfind --to r... --amount 100 --json
```

Use the output to confirm:

- `symbol` is `RLUSD`
- `issuer` matches the RLUSD issuer account
- use `symbol` as the human-readable RLUSD identity check; XRPL `currency`
  output may be encoded rather than the literal string `RLUSD`
- trust-line status returns structured `account_exists` and `has_trustline`
  fields, even when no trust line exists yet
- trust-line status and account reads use the same issuer-backed registry metadata
- trust-line and payment plans resolve against the same issuer-backed registry metadata
- execute commands submit the same reviewed XRPL transaction JSON only after
  explicit confirmation

# Common Warnings

- XRPL RLUSD is an issued token, not an ERC-20 balance entry.
- Missing trust lines should block payment planning instead of being treated as
  a recoverable transfer error.
- Do not assume the XRPL account address is the same thing as the local signer
  wallet alias; use `rlusd-wallets` before wallet-backed action steps.
- Execute examples pass `--password "$RLUSD_WALLET_PASSWORD"` explicitly for
  predictability; the CLI can also read `RLUSD_WALLET_PASSWORD` from the
  environment.
- Examples pass `--chain xrpl-mainnet` for predictability. On the current CLI
  surface, some help output may only list `--address`, but `--chain` is still
  accepted via the global flag.
- If a network or issuer value is absent from the registry, extend the registry
  rather than guessing live XRPL metadata.
- Treat `prepare` output as a review artifact. Do not skip directly to execution
  logic.
- Use `xrpl tx wait` and `xrpl payment receipt` after submission instead of
  assuming ledger validation or delivery details.
- DEX, AMM, and pathfind commands execute directly — there is no
  `prepare`/`execute` review gate.
- AMM deposit requires both `--xrp` and `--rlusd`.
- DEX cancel needs the offer sequence number from the original order.
- AMM vote fee range is 0-1000 (in units of 1/100,000; 1000 = 1%).
- Pathfind is read-only (no password needed).

# Examples

- "What issuer account backs RLUSD on XRPL?" -> run `resolve asset`
- "Can this XRPL account receive RLUSD?" -> run `trustline status`
- "Does this XRPL address exist and what is its sequence?" -> run `account info`
- "Prepare an RLUSD payment from my XRPL wallet for review." -> use `rlusd-wallets`, then run `payment prepare`
- "Prepare an RLUSD trust line for review." -> run `trustline prepare`
- "Prepare an RLUSD payment for review." -> run `payment prepare`
- "Submit the reviewed RLUSD trust line change." -> run `trustline execute`
- "Submit the reviewed RLUSD payment." -> run `payment execute`
- "Wait for XRPL transaction validation." -> run `tx wait`
- "Inspect the submitted RLUSD payment receipt." -> run `payment receipt`
- "View the XRP/RLUSD order book." -> run `xrpl dex orderbook`
- "Add liquidity to the XRP/RLUSD AMM." -> run `xrpl amm info`, then `xrpl amm deposit`
- "Find a cross-currency path for RLUSD." -> run `xrpl pathfind`

# References

- `./references/trustlines.md`
- `./references/issuer-settings.md`
- `./references/payments.md`
- https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl
- https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-xrpl-settings.md
