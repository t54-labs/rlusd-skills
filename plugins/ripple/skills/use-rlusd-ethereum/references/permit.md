# Permit Notes

## Current Scope

The current CLI batch does not implement a dedicated RLUSD permit build or
execute flow. Use explicit approvals instead.

Current supported approval path:

```bash
rlusd evm approve prepare --chain ethereum-mainnet --owner-wallet ops --spender 0x... --amount 1000 --json
rlusd evm approve execute --plan <plan_path> --confirm-plan-id <plan_id> --json
```

## Why The Skill Still Mentions Permit

Permit is part of the Ethereum RLUSD decision space because users often ask
about approval alternatives, wallet UX, or DeFi integrations that can support
signature-based approvals.

In this repo today:

- `approve` is implemented
- `permit` is informational only
- no EIP-2612 payload builder is exposed by the CLI

## Guidance

- if the task is executable today, route to `approve`
- if the user asks specifically for permit support, explain that it is not yet
  implemented in the external `rlusd-cli` runtime
- do not imply that a preview quote or DeFi venue automatically supports a live
  permit path
