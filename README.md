# RLUSD Skills

`rlusd-skills` packages RLUSD-focused agent skills and docs. The canonical
runtime is now the external `rlusd-cli` branch
`feat/skills-backend-migration`, currently pinned for cutover at `374a1b1`.

## What Is Implemented

- RLUSD routing skills for Ethereum, XRPL, DeFi, and institutional guidance
- an external `rlusd-cli` runtime with JSON output for every command
- registry-backed RLUSD metadata for Ethereum Mainnet and XRPL Mainnet
- deterministic prepared-plan files stored under `~/.config/rlusd-cli/plans`
- EVM read, prepare, execute, wait, and receipt commands
- XRPL trust-line, payment, wait, and receipt commands
- DeFi venue discovery, live swap quotes, and Aave supply prepare/execute
- fiat onboarding, buy, and redeem guidance commands

## Current Constraints

- live Sepolia and XRPL Testnet verification is still pending
- the registry currently ships Ethereum Mainnet and XRPL Mainnet entries only
- DeFi swap quotes are live and expire on a short TTL
- DeFi supply preview remains preview-only guidance
- DeFi supply execution is `aave`-only
- fiat commands are guidance-only and do not automate Ripple onboarding or wires

## Installation

In Claude Code:

```
/plugin marketplace add t54-labs/rlusd-skills
/plugin install ripple@rlusd-agent-skills
```

Alternative: install from a local clone

```
git clone https://github.com/t54-labs/rlusd-skills.git
/plugin marketplace add ./rlusd-skills
/plugin install ripple@rlusd-agent-skills
```

Or test locally during development:

```bash
claude --plugin-dir ./rlusd-skills
```

## Repository Layout

```text
.claude-plugin/          Plugin manifest and marketplace metadata
skills/                  Agent skill definitions (SKILL.md files)
docs/                    Architecture, examples, reference, and status docs
```

## Prerequisites

Install the external CLI separately:

```bash
git clone https://github.com/t54-labs/rlusd-cli.git
cd rlusd-cli
git checkout feat/skills-backend-migration
git rev-parse HEAD   # should match 374a1b1 unless the cutover plan explicitly updates the pin
npm install
npm run build
```

Runtime behavior is verified in the external `rlusd-cli` repository.

## Wallet Configuration

Prepared plans, wallet files, and runtime configuration now live under
`rlusd-cli`:

- plans: `~/.config/rlusd-cli/plans`
- wallets: `~/.config/rlusd-cli/wallets`
- config: `~/.config/rlusd-cli/config.yml`

For write flows, prefer explicit wallet flags such as `--from-wallet`,
`--owner-wallet`, and `--wallet`, plus `RLUSD_WALLET_PASSWORD` for local wallet
decryption.

## Common Flows

Resolve RLUSD metadata with the external CLI:

```bash
rlusd resolve asset --chain ethereum-mainnet --symbol RLUSD --json
rlusd resolve asset --chain xrpl-mainnet --symbol RLUSD --json
```

Prepare an EVM transfer:

```bash
rlusd evm transfer prepare \
  --chain ethereum-mainnet \
  --from-wallet ops \
  --to 0x1234567890123456789012345678901234567890 \
  --amount 25.5 \
  --json
```

Prepare an XRPL payment:

```bash
rlusd xrpl payment prepare \
  --chain xrpl-mainnet \
  --from-wallet treasury-xrpl \
  --to rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe \
  --amount 250 \
  --json
```

Preview and prepare an Aave supply flow:

```bash
rlusd defi supply preview \
  --chain ethereum-mainnet \
  --venue aave \
  --amount 5000 \
  --json

rlusd defi quote swap \
  --chain ethereum-mainnet \
  --from RLUSD \
  --to USDC \
  --amount 1000 \
  --json

rlusd defi supply prepare \
  --chain ethereum-mainnet \
  --venue aave \
  --from-wallet ops \
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

## Skills

| Skill | Command | When to use |
| :--- | :--- | :--- |
| **use-rlusd** | (auto-routed) | Route RLUSD requests to the correct chain workflow |
| **use-rlusd-ethereum** | `/ripple:use-rlusd-ethereum` | Ethereum-specific RLUSD guidance |
| **use-rlusd-xrpl** | `/ripple:use-rlusd-xrpl` | XRPL-specific RLUSD guidance |
| **use-rlusd-evm-defi** | `/ripple:use-rlusd-evm-defi` | EVM DeFi venue discovery and swap quotes |
| **buy-redeem-rlusd** | `/ripple:buy-redeem-rlusd` | Institutional buy/redeem guidance |
| **rlusd-transfer** | `/ripple:rlusd-transfer` | Execute RLUSD transfers and payments |
| **rlusd-trustline** | `/ripple:rlusd-trustline` | XRPL trust-line creation and updates |
| **rlusd-defi-action** | `/ripple:rlusd-defi-action` | Execute RLUSD DeFi supply flows |

Each action flow follows the same rule: `prepare` first, review the generated
plan, then `execute` with an explicit matching `--confirm-plan-id` when
confirmation is required. For live swap quotes, treat `quoted_at`,
`ttl_seconds`, and `expires_at` as the source of truth for quote freshness.
