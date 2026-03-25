# Ripple RLUSD Skills

This plugin packages RLUSD-focused routing skills and a local `rlusd` CLI for
AI-agent-driven workflows.

The first implementation slice includes:

- background routing via `use-rlusd`,
- Ethereum-specific RLUSD guidance,
- XRPL-specific RLUSD guidance,
- EVM DeFi venue and swap-preview guidance,
- institutional buy/redeem guidance,
- explicit action skills for transfer, trust-line, and DeFi workflows,
- the registry-backed `rlusd resolve asset --json` command,
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

The CLI and skill surface will expand in later phases to cover deeper
production hardening.
