# RLUSD Skills

`rlusd-skills` packages RLUSD-focused agent skills plus a local TypeScript CLI for
deterministic read, prepare, execute, and receipt workflows across Ethereum and
XRPL.

## What Is Implemented

- RLUSD routing skills for Ethereum, XRPL, DeFi, and institutional guidance
- a local `rlusd` CLI with JSON output for every command
- registry-backed RLUSD metadata for Ethereum Mainnet and XRPL Mainnet
- deterministic prepared-plan files stored under `.rlusd/plans`
- EVM read, prepare, execute, wait, and receipt commands
- XRPL trust-line, payment, wait, and receipt commands
- DeFi venue discovery, preview quotes, and Aave supply prepare/execute
- fiat onboarding, buy, and redeem guidance commands

## Current Constraints

- live Sepolia and XRPL Testnet verification is still pending
- the registry currently ships Ethereum Mainnet and XRPL Mainnet entries only
- DeFi swap quotes are static preview data, not live market quotes
- DeFi supply execution is `aave`-only
- fiat commands are guidance-only and do not automate Ripple onboarding or wires

## Repository Layout

```text
.claude-plugin/          Plugin marketplace metadata
cli/rlusd/               TypeScript CLI package
docs/                    Architecture, examples, reference, and status docs
plugins/ripple/          Skill files and plugin README
```

## Quick Start

Install workspace dependencies:

```bash
pnpm install
```

Run the CLI from source:

```bash
pnpm --filter rlusd build
node cli/rlusd/dist/index.js --help
```

Run the current checks:

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Wallet Configuration

Prepared plans are written to `.rlusd/plans`. Execution commands resolve wallet
aliases from `.rlusd/config.json`.

Example config:

```json
{
  "wallets": {
    "ops": {
      "chain": "ethereum-mainnet",
      "address": "0x1234567890123456789012345678901234567890",
      "signer": "env:OPS_PRIVATE_KEY"
    },
    "treasury-xrpl": {
      "chain": "xrpl-mainnet",
      "address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
      "signer": "env:XRPL_MAINNET_SEED"
    }
  }
}
```

Execution also requires the chain transport environment variables configured by
the registry, such as `ETHEREUM_MAINNET_RPC_URL`.

## Common Flows

Resolve RLUSD metadata:

```bash
node cli/rlusd/dist/index.js resolve asset --chain ethereum-mainnet --json
node cli/rlusd/dist/index.js resolve asset --chain xrpl-mainnet --json
```

Prepare an EVM transfer:

```bash
node cli/rlusd/dist/index.js evm transfer prepare \
  --chain ethereum-mainnet \
  --from wallet:ops \
  --to 0x1234567890123456789012345678901234567890 \
  --amount 25.5 \
  --json
```

Prepare an XRPL payment:

```bash
node cli/rlusd/dist/index.js xrpl payment prepare \
  --chain xrpl-mainnet \
  --from wallet:treasury-xrpl \
  --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --amount 250 \
  --json
```

Preview and prepare an Aave supply flow:

```bash
node cli/rlusd/dist/index.js defi supply preview \
  --chain ethereum-mainnet \
  --venue aave \
  --amount 5000 \
  --json

node cli/rlusd/dist/index.js defi supply prepare \
  --chain ethereum-mainnet \
  --venue aave \
  --from wallet:ops \
  --amount 5000 \
  --json
```

## Documentation

- `docs/architecture.md`
- `docs/command-reference.md`
- `docs/examples/ethereum.md`
- `docs/examples/xrpl.md`
- `docs/examples/defi.md`
- `docs/security.md`
- `docs/troubleshooting.md`
- `docs/IMPLEMENTATION-STATUS.md`

## Plugin Surface

The packaged skills live under `plugins/ripple/skills`:

- `use-rlusd`
- `use-rlusd-ethereum`
- `use-rlusd-xrpl`
- `use-rlusd-evm-defi`
- `buy-redeem-rlusd`
- `rlusd-transfer`
- `rlusd-trustline`
- `rlusd-defi-action`

Each action flow follows the same rule: `prepare` first, review the generated
plan, then `execute` with an explicit matching `--confirm-plan-id` when
confirmation is required.
