# RLUSD Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-rlusd--cli-6f42c1.svg)](https://github.com/t54-labs/rlusd-cli)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#development)

`rlusd-skills` is the open source skill and documentation repository for RLUSD
agent workflows. It packages the plugin metadata, skill definitions, reference
docs, and verification tests that route prompts into the external
[`rlusd-cli`](https://github.com/t54-labs/rlusd-cli) runtime.

If you want the executable runtime, use `rlusd-cli`. If you want the
agent-facing prompts, routing rules, packaging metadata, and docs that sit on
top of that runtime, use this repo.

## What This Repo Includes

- 11 packaged RLUSD skills for routing, wallet preflight, payments, DeFi,
  fiat guidance, and x402
- docs that describe the current skill-facing CLI contract
- examples, security notes, and troubleshooting guides
- tests that keep the docs and skill text aligned with the external CLI

## Current Coverage

- Ethereum reads plus prepared `evm transfer` and `evm approve` flows
- XRPL trust-line status, account info, trust-line prepare/execute, and payment
  prepare/execute flows
- DeFi venue discovery, live swap quotes, prepared swap flows, Curve LP
  preview/prepare/execute, and Aave supply preview/prepare/execute
- Wormhole NTT bridge routes, metadata, estimates, prepare/execute, status, and
  history across supported EVM chains
- fiat onboarding, buy, and redeem guidance
- x402 buyer-side fetch flows with XRPL wallets
- supporting CLI docs for helper surfaces such as `wallet keychain`,
  `wallet export-seed`, `send`, `price`, `market`, `tx`, `xrpl dex`,
  `xrpl amm`, and `faucet`

## Current Constraints

- this repo is skills/docs-only; runtime execution and changing metadata live
  in `rlusd-cli`
- bundled examples and registry-backed flows currently focus on
  `ethereum-mainnet` and `xrpl-mainnet`
- DeFi supply execution is `aave`-only
- Curve swap and LP flows are limited to the RLUSD/USDC pool on
  `ethereum-mainnet`
- Wormhole NTT bridge support uses `ethereum`, `base`, `optimism`, `ink`, and
  `unichain`; XRPL L1 to EVM bridging is not supported by Wormhole NTT
- fiat commands are guidance-only and do not automate provider onboarding or
  redemption submission
- there is no multisig or external signer backend yet

## Installation

### Claude Code

```bash
/plugin marketplace add t54-labs/rlusd-skills
/plugin install ripple@rlusd-agent-skills
```

### Local clone

```bash
git clone https://github.com/t54-labs/rlusd-skills.git
cd rlusd-skills
/plugin marketplace add .
/plugin install ripple@rlusd-agent-skills
```

### Runtime prerequisite

This repo depends on the external `rlusd-cli` runtime. For development and
verification, keep a fresh clone of `rlusd-cli` on `main`:

```bash
git clone https://github.com/t54-labs/rlusd-cli.git
cd rlusd-cli
git checkout main
npm install
npm run build
```

You can also dogfood the plugin from a local checkout:

```bash
claude --plugin-dir .
```

## Wallet Configuration

Prepared plans, wallet files, and runtime configuration live under
`rlusd-cli`:

- plans: `~/.config/rlusd-cli/plans`
- wallets: `~/.config/rlusd-cli/wallets`
- config: `~/.config/rlusd-cli/config.yml`

For write flows, prefer explicit wallet flags such as `--from-wallet`,
`--owner-wallet`, and `--wallet`, plus `RLUSD_WALLET_PASSWORD` for local wallet
decryption.

## Common Flows

```bash
# Resolve RLUSD metadata
rlusd resolve asset --chain ethereum-mainnet --symbol RLUSD --json
rlusd resolve asset --chain xrpl-mainnet --symbol RLUSD --json

# Prepare an EVM transfer
rlusd evm transfer prepare \
  --chain ethereum-mainnet \
  --from-wallet ops \
  --to 0x1234567890123456789012345678901234567890 \
  --amount 25.5 \
  --json

# Prepare an XRPL payment
rlusd xrpl payment prepare \
  --chain xrpl-mainnet \
  --from-wallet treasury-xrpl \
  --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --amount 250 \
  --json

# Get a live swap quote
rlusd defi quote swap \
  --chain ethereum-mainnet \
  --venue uniswap \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --json

# Estimate an RLUSD Wormhole NTT bridge route
rlusd bridge estimate \
  --from ethereum \
  --to base \
  --amount 500 \
  --json

# Prepare a bridge plan for review
rlusd bridge prepare \
  --from ethereum \
  --to base \
  --amount 500 \
  --recipient 0x1234567890123456789012345678901234567890 \
  --json

# Fetch an x402-protected resource
rlusd x402 fetch \
  https://api.example.com/premium-feed \
  --wallet treasury-xrpl \
  --max-value 1 \
  --json
```

Most write paths follow `prepare -> review -> execute`, then `wait`, `receipt`,
or bridge status/history commands for confirmation. `rlusd-x402` is the
exception: it is a capped direct-execution flow bounded by `--max-value`.

The examples in this repo pass explicit `--chain` and `--venue` for
predictability. At runtime, top-level DeFi commands can also inherit `--chain`
from the global flag or `default_chain` config, while execute commands load the
venue from the stored plan. Use `--venue uniswap` when fee-tier selection
matters, and `--venue curve` for the fixed Ethereum mainnet RLUSD/USDC pool.
Top-level read and wallet commands may also use family aliases such as
`ethereum` and `xrpl`, while network-scoped action flows use
`ethereum-mainnet` and `xrpl-mainnet`. Bridge commands use Wormhole NTT labels:
`ethereum`, `base`, `optimism`, `ink`, and `unichain`.

## Repository Layout

```text
.claude-plugin/         Plugin manifest and marketplace metadata
skills/                 Agent skill definitions and chain-specific references
docs/                   Architecture, command reference, examples, security, troubleshooting
tests/                  Alignment tests for docs and skills
```

## Documentation

| Path | Purpose |
| :--- | :--- |
| `docs/command-reference.md` | Current skill-facing and supporting CLI command surface |
| `docs/examples/ethereum.md` | Ethereum reads plus prepare/execute examples |
| `docs/examples/xrpl.md` | XRPL trust-line and payment examples |
| `docs/examples/defi.md` | DeFi venue, quote, swap, LP, and supply examples |
| `docs/examples/bridge.md` | Wormhole NTT bridge route, prepare, execute, status, and history examples |
| `docs/architecture.md` | How the skill layer routes into the external runtime |
| `docs/security.md` | Plan integrity, wallet handling, and operational safety notes |
| `docs/troubleshooting.md` | Structured error guidance and recovery steps |

## Skills

| Skill | Command | When to use |
| :--- | :--- | :--- |
| **use-rlusd** | (auto-routed) | Route RLUSD requests to the correct chain or product workflow |
| **rlusd-wallets** | `/ripple:rlusd-wallets` | Inspect or set up local RLUSD wallet aliases before wallet-backed flows |
| **use-rlusd-ethereum** | `/ripple:use-rlusd-ethereum` | Ethereum-specific RLUSD guidance |
| **use-rlusd-xrpl** | `/ripple:use-rlusd-xrpl` | XRPL-specific RLUSD guidance |
| **use-rlusd-evm-defi** | `/ripple:use-rlusd-evm-defi` | DeFi venue discovery, quote lookup, and preview guidance |
| **rlusd-bridge** | `/ripple:rlusd-bridge` | Inspect or execute RLUSD Wormhole NTT bridge workflows |
| **buy-redeem-rlusd** | `/ripple:buy-redeem-rlusd` | Fiat onboarding plus buy and redeem guidance |
| **rlusd-transfer** | `/ripple:rlusd-transfer` | Execute prepared RLUSD transfers and XRPL payments |
| **rlusd-trustline** | `/ripple:rlusd-trustline` | Create or update XRPL trust lines |
| **rlusd-defi-action** | `/ripple:rlusd-defi-action` | Execute prepared DeFi swap, LP, and supply flows |
| **rlusd-x402** | `/ripple:rlusd-x402` | Fetch an x402-protected resource with an XRPL wallet |

Each action flow follows the same rule: `prepare` first, review the generated
plan, then `execute` with a matching `--confirm-plan-id` when confirmation is
required. For live quotes, treat `quoted_at`, `ttl_seconds`, and `expires_at`
as the source of truth for freshness.

## Development

Clone both repos into the same parent directory if you want the full
docs-against-runtime verification path:

```bash
git clone https://github.com/t54-labs/rlusd-skills.git
git clone https://github.com/t54-labs/rlusd-cli.git

cd rlusd-cli
git checkout main
npm install
npm run build

cd ../rlusd-skills
pnpm test
pnpm build
pnpm typecheck
```

Notes:

- `pnpm test` is the main verification gate for this repo
- the test suite expects `rlusd-cli` to exist at `../rlusd-cli`
- root `pnpm build` and `pnpm typecheck` are intentional smoke checks because
  `rlusd-skills` is a skills/docs-only package
- issues and pull requests are welcome

## License

MIT. See `LICENSE`.
