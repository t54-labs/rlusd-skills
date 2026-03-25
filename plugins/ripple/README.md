# Ripple RLUSD Skills

This plugin packages RLUSD-focused routing skills that target the external
`rlusd-cli` runtime for AI-agent-driven workflows.

The first implementation slice includes:

- background routing via `use-rlusd`,
- Ethereum-specific RLUSD guidance,
- XRPL-specific RLUSD guidance,
- EVM DeFi venue and live swap-quote guidance,
- institutional buy/redeem guidance,
- explicit action skills for transfer, trust-line, and DeFi workflows,
- the external `rlusd resolve asset --json` command,
- `rlusd defi venues` and `rlusd defi quote swap`,
- `rlusd defi supply preview` and `rlusd defi supply prepare`,
- `rlusd defi supply execute`,
- `rlusd-transfer`, `rlusd-trustline`, and `rlusd-defi-action` skills,
- `rlusd evm balance` and `rlusd evm allowance`,
- `rlusd evm transfer prepare` and `rlusd evm approve prepare`,
- `rlusd evm transfer execute` and `rlusd evm approve execute`,
- `rlusd evm tx wait` and `rlusd evm tx receipt`,
- `rlusd xrpl trustline status` and `rlusd xrpl account info`,
- `rlusd xrpl trustline prepare` and `rlusd xrpl payment prepare`,
- `rlusd xrpl trustline execute` and `rlusd xrpl payment execute`,
- `rlusd xrpl tx wait` plus `rlusd xrpl payment receipt`,
- and `rlusd fiat onboarding checklist`, `rlusd fiat buy instructions`, and
  `rlusd fiat redeem instructions`.

The skills now assume `rlusd-cli` is installed separately and pinned to commit
`374a1b1` on `feat/skills-backend-migration` unless the rollout plan explicitly
updates that checkpoint.
