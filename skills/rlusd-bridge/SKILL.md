---
name: rlusd-bridge
description: Use when a user wants to inspect or execute RLUSD Wormhole NTT bridge routes, estimates, prepared bridge plans, execution, or status/history across supported EVM chains.
user-invocable: true
---

# Purpose

Use this skill when the user wants RLUSD cross-chain bridge guidance through the
external `rlusd-cli` Wormhole NTT bridge surface.

# When To Use This Skill

- The user asks about RLUSD bridge, cross-chain, Wormhole, or NTT routes.
- The user wants to bridge RLUSD between Ethereum, Base, Optimism, Ink, or
  Unichain.
- The user wants route metadata, estimates, prepared bridge calldata, bridge
  execution, status, or history.

# Do Not Use This Skill When

- The task is a direct Ethereum transfer or approval; use `rlusd-transfer`.
- The task is an XRPL payment or trust-line workflow.
- The task is only DeFi venue discovery, quotes, LP, or supply.

# Decision Guide

- Start read-only with `bridge routes`, `bridge metadata`, or
  `bridge estimate`.
- Use `--live` on routes, metadata, estimate, or prepare when the user needs
  current Wormholescan metadata instead of bundled static metadata.
- For XRPL L1 bridge requests, use this skill to explain unsupported status and
  alternatives; do not prepare or execute an XRPL bridge plan.
- Use `bridge prepare` before any bridge execution. It is non-destructive
  on-chain and creates an auditable plan, but it needs a source-chain RPC for
  `quoteDeliveryPrice` and writes a local plan file.
- Review the returned `plan_id`, `plan_path`, `approval_data`,
  `transfer_data`, and `required_native_value_wei` before execution.
- Before `bridge execute`, load `rlusd-wallets` to confirm the local EVM wallet
  alias.
- After execution, use `bridge status <id>` or `bridge history` for Wormholescan
  status data.

# Current Command Sequence

```bash
rlusd bridge routes --json
rlusd bridge routes --live --json
rlusd bridge metadata --json
rlusd bridge metadata --live --json
rlusd bridge estimate --from ethereum --to base --amount 500 --json
rlusd bridge estimate --from ethereum --to base --amount 500 --live --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --live --json
rlusd bridge prepare --from ethereum --to base --amount 500 --recipient 0x... --refund-address 0x... --queue --json
rlusd bridge execute --plan <plan_path_from_prepare> --from-wallet ops --confirm-plan-id <plan_id_from_prepare> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd bridge status <id> --json
rlusd bridge history --limit 20 --json
rlusd bridge history --address 0x... --limit 20 --json
```

# Common Warnings

- Supported NTT chains are `ethereum`, `base`, `optimism`, `ink`, and
  `unichain`.
- Bridge chain names use Wormhole NTT family labels, not registry labels such as
  `ethereum-mainnet`.
- XRPL L1 to EVM bridging is not supported by Wormhole NTT.
- The L2 RLUSD token address surfaced by the current CLI metadata is
  `0x8d58C0C60B8D6b88Fa98B291a646dB34d0F98258`.
- `bridge prepare` is non-destructive on-chain, but it needs source-chain RPC
  access for `quoteDeliveryPrice` and writes a local plan file under
  `~/.config/rlusd-cli/plans`.
- `bridge execute` submits approval and NTT transfer transactions from a local
  EVM wallet.
- Routine verification must not run `bridge execute`; execution examples are
  documentation only unless the user intentionally provides a funded wallet.
- Use isolated low-value wallets for initial live bridge execution.
- `bridge status <id>` accepts operation id, Wormhole sequence, source tx hash, or target tx hash.
- `bridge history --limit` accepts values from 1 through 100 and can filter by
  `--address`.

# Examples

- "Show supported RLUSD bridge routes." -> run `bridge routes`
- "Estimate bridging 500 RLUSD from Ethereum to Base." -> run `bridge estimate`
- "Prepare bridging RLUSD from Ethereum to Base." -> use `rlusd-wallets` if a
  wallet alias is needed, then run `bridge prepare`
- "Execute the reviewed bridge plan." -> use `rlusd-wallets`, then run
  `bridge execute` with the reviewed `plan_id`
- "Check this bridge transfer." -> run `bridge status <id>`
