# RLUSD Skills for AI Agent CLI — Product Requirements Document

- **Status:** Draft v1.0
- **Owner:** Product / Engineering
- **Last updated:** 2026-03-24
- **Historical cleanup:** 2026-03-26 — this PRD predates the final repo flattening to `skills/` and the addition of `rlusd-wallets`; scope and structure notes below are normalized where doing so avoids confusion.

## 1. Executive Summary

Build an open-source **RLUSD skills toolkit** that mirrors the useful parts of Circle's skills repository, but is focused on Ripple USD (RLUSD) and optimized for **AI-agent-driven usage with an external `rlusd-cli` runtime** rather than MCP. The product should give an AI coding agent two things:

1. **Decision guidance** via Claude-style skills (`SKILL.md` files) for when to use RLUSD on Ethereum, XRPL, or in EVM DeFi workflows.
2. **Deterministic execution** via the external `rlusd-cli` that provides structured, machine-readable commands for read actions, transaction planning, execution, and receipts.

The first release should cover:

- skill routing and reference guidance,
- RLUSD on Ethereum,
- RLUSD on XRPL,
- RLUSD on EVM DeFi,
- a registry-driven CLI with JSON output,
- explicit safety controls for side-effecting actions.

The initial product will **not** implement MCP integration. It will also **not** attempt to automate Ripple's institutional onboarding or fiat wire operations end-to-end; those flows will be represented as guidance, status surfaces, and operator checklists because the public RLUSD flow is currently UI- and bank-wire-based.[1][2][3]

## 2. Background and Context

Circle's public skills repository packages reusable development guidance as plugin-hosted skills under `plugins/<vendor>/skills/*`, combining stable decision logic with references and optional scripts.[4] Claude Code's skills model explicitly supports:

- plugin-scoped skills,
- user-invocable skills,
- automatically loaded routing/reference skills, and
- hidden background skills where appropriate.[5]

RLUSD is currently documented by Ripple as a stablecoin available on **Ethereum** and the **XRP Ledger (XRPL)**.[6] On Ethereum, RLUSD is an **ERC-20** token that uses a **proxy upgrade pattern** and should be integrated through the **proxy contract address**, with **18 decimals** on documented Ethereum deployments; the current product scope only requires Mainnet recognition.[7] On XRPL, RLUSD uses the ledger's native **Issued Tokens** model and requires a **trust line** for holders to receive, hold, and transfer the asset.[8][9]

These properties make RLUSD a good fit for a two-layer architecture:

- **skills** for stable rules and workflow selection,
- **CLI** for current addresses, read operations, planning, and transaction execution.

## 3. Problem Statement

AI agents can generate plausible blockchain workflows, but RLUSD integration has domain-specific constraints that are easy to miss:

- Ethereum integrations must use the **proxy contract**, not the implementation contract.[7]
- XRPL transfers depend on **trust line state** and issuer configuration.[8][9]
- RLUSD has issuer-controlled capabilities such as **freeze**, **clawback**, **role-based mint/burn**, and **upgrades**, which materially affect risk modeling and protocol integration.[10]
- Ripple's fiat buy/redeem flow depends on **onboarding**, **approved bank accounts**, and **wallet IDs / wire references**, which are not equivalent to a public mint API.[1][2][3]

Without a productized guidance layer and deterministic CLI, an AI agent will tend to:

- infer the wrong chain workflow,
- hardcode stale addresses or assumptions,
- treat administrative issuer features as public developer actions,
- perform unsafe side effects without an explicit planning step,
- and produce brittle, non-auditable chain operations.

## 4. Product Vision

Create the **best agent-facing RLUSD developer toolkit** for external
`rlusd-cli` workflows:

- **easy to install**,
- **safe by default**,
- **predictable for agents**,
- **split into stable knowledge vs changing runtime truth**,
- and **extensible** to more EVM chains and venues over time.

## 5. Goals

### 5.1 Primary Goals

1. Ship a repository that feels structurally familiar to Circle Skills, but tailored to RLUSD.[4]
2. Let an AI agent reliably route among Ethereum, XRPL, DeFi, and institutional/reference flows.
3. Expose a CLI whose outputs are unambiguous and machine-readable.
4. Make all side-effecting operations follow a strict `prepare -> review -> execute -> receipt` lifecycle.
5. Keep protocol facts that change over time out of skill prose and inside a versioned runtime registry.

### 5.2 Secondary Goals

1. Provide strong operator ergonomics for local development and scripted automation.
2. Make the toolkit easy to extend with additional venues, chains, and wallet backends.
3. Make the repository suitable as a reference implementation for future Ripple-adjacent skills.

## 6. Non-Goals

The v1 product will not:

1. implement MCP;
2. expose mint, burn, freeze, clawback, pause, or upgrade as normal end-user CLI commands, because those are issuer/admin powers in RLUSD's design;[10]
3. automate bank wires or Ripple onboarding submission flows end-to-end;
4. ship protocol-specific skills for every DeFi venue on day one;
5. support arbitrary blockchains beyond Ethereum and XRPL in the first release;
6. include a UI.

## 7. Target Users

### 7.1 Primary User

**AI-agent-assisted developer/operator**

A developer who wants Claude Code or a similar AI agent to inspect balances, plan transfers, validate trust lines, prepare RLUSD transactions, and reason about DeFi integrations from a local repo and terminal.

### 7.2 Secondary Users

- Protocol engineers integrating RLUSD into EVM applications.
- XRPL integrators implementing trust line and payment flows.
- Developer tooling teams that want a reusable pattern for skill + CLI co-design.

## 8. Product Principles

1. **Rules in skills, truth in CLI.**
   Skills describe stable workflow logic; CLI resolves live addresses, capabilities, and current configuration.

2. **No hidden writes.**
   Any side effect must be prepared explicitly before execution.

3. **One command, one machine-readable contract.**
   Agents should consume JSON, not parse prose.

4. **Chain-specific correctness beats abstraction purity.**
   XRPL trust line behavior and EVM approval/permit behavior should not be flattened into a misleading generic model.

5. **Compliance-aware design.**
   RLUSD is not a permissionless meme token; its issuer/admin controls must shape integration guidance.[10]

## 9. Scope

### 9.1 In Scope for v1

#### Skills

1. `use-rlusd`
   - top-level router skill
   - decides Ethereum vs XRPL vs DeFi vs institutional/reference flow

2. `use-rlusd-ethereum`
   - ERC-20, proxy, decimals, allowance, permit, transfer planning

3. `use-rlusd-xrpl`
   - issuer model, trust line checks, TrustSet, Payment, destination-tag awareness

4. `use-rlusd-evm-defi`
   - live swap quotes, prepared swap flows, Aave supply flows, Curve LP routing patterns, risk checks, venue abstraction

5. `rlusd-wallets`
   - wallet preflight for local aliases, default wallet inspection, and setup guidance

6. prepare-first task skills for side effects
   - `rlusd-transfer`
   - `rlusd-trustline`
   - `rlusd-defi-action`

7. `buy-redeem-rlusd`
   - reference skill documenting onboarding, bank-account, wallet-ID, and wire-flow requirements
   - guidance only in v1, not full execution automation

#### CLI

An external `rlusd-cli` runtime supporting:

- `resolve`
- `balance` and `eth allowance`
- XRPL trust-line/account read commands
- DeFi quote and preview commands
- `prepare`
- `execute`
- `wait`/`receipt`
- `wallet` and `config`

#### Registry / Runtime Truth

- supported chains
- RLUSD proxy/implementation addresses on Ethereum
- XRPL issuer accounts and network metadata
- DeFi venue metadata and capability flags
- policy and safety thresholds

### 9.2 Out of Scope for v1

- full fiat ops automation,
- automated exchange/CEX workflows,
- protocol-specific yield strategy logic,
- cross-chain bridge abstractions,
- policy engines beyond basic local safety config.

## 10. Key User Journeys

### 10.1 EVM Balance and Transfer

1. User asks the agent to check an RLUSD balance or send RLUSD on Ethereum.
2. `use-rlusd` routes to `use-rlusd-ethereum`.
3. Agent resolves the current asset metadata from the CLI.
4. Agent either reads balance directly or prepares a transfer plan.
5. User/operator reviews the plan.
6. Agent executes and waits for receipt.

### 10.2 XRPL Receive and Pay

1. User asks the agent to receive or send RLUSD on XRPL.
2. `use-rlusd` routes to `use-rlusd-xrpl`.
3. Agent checks trust line state first.
4. If absent, the CLI prepares a TrustSet transaction.
5. Only after trust line readiness does the agent prepare a payment.

### 10.3 DeFi Interaction

1. User asks whether RLUSD can be used in DeFi or wants a preview.
2. `use-rlusd` routes to `use-rlusd-evm-defi`.
3. Agent queries venues and previews a route.
4. Agent shows the action plan and warnings.
5. User approves execution.

### 10.4 Fiat Buy / Redeem Guidance

1. User asks how to buy or redeem RLUSD directly with Ripple.
2. Agent loads `buy-redeem-rlusd`.
3. Agent explains prerequisites: onboarding, bank accounts, wallet selection, wallet ID reference, and chain-specific needs such as XRPL trust lines.[1][2][3]
4. CLI may surface checklists or instruction generation, but does not place wires.

## 11. Functional Requirements

### 11.1 Repository Structure

The repo must support plugin-style skills consistent with the Circle-style layout and Claude Code plugin conventions.[4][5]

Minimum structure:

```text
.claude-plugin/
skills/
  use-rlusd/
  use-rlusd-ethereum/
  use-rlusd-xrpl/
  use-rlusd-evm-defi/
  rlusd-wallets/
  buy-redeem-rlusd/
  rlusd-transfer/
  rlusd-trustline/
  rlusd-defi-action/
docs/
  examples/
tests/
README.md
package.json
```

### 11.2 Skill Requirements

Each skill must:

- declare clear purpose and trigger terms;
- distinguish read-only guidance from side-effecting workflows;
- include chain-specific decision rules;
- point agents to CLI commands instead of embedding stale constants;
- keep side-effect safety in documented `prepare -> review -> execute` flows rather than frontmatter-only gating;
- use `user-invocable: true` for operator-facing skills and reserve `user-invocable: false` for intentionally hidden helpers only.[5]

### 11.3 CLI Contract Requirements

The CLI must:

- support `--json` on every command;
- never require interactive prompts;
- return stable exit codes;
- separate read and write flows;
- support `prepare` and `execute` as different commands;
- return structured warnings and next-step hints;
- support local config/registry overrides.

### 11.4 Ethereum Requirements

The toolkit must support current RLUSD Ethereum assumptions from Ripple docs:

- RLUSD is ERC-20 compliant;[7]
- developers should use the **proxy contract address**;[7]
- Ethereum Mainnet must be recognized in the current v1 scope;[7]
- decimals must be treated as **18**;[7]
- the CLI should support balance, allowance, transfer planning, approval, and permit-aware workflows;
- skill content must warn about issuer/admin controls including freeze, clawback, and upgrades as integration constraints, not end-user actions.[10]

### 11.5 XRPL Requirements

The toolkit must support current RLUSD XRPL assumptions from Ripple docs:

- RLUSD uses XRPL Issued Tokens;[8]
- holders need a trust line with the issuer to receive, hold, and transfer RLUSD;[8][9]
- XRPL Mainnet must be recognized in the current v1 scope;[8]
- the CLI should support trust line status, trust line planning, and payment planning;
- skill content must treat trust line verification as a prerequisite to receive/transfer flows.

### 11.6 DeFi Requirements

The product must support **pattern-based** DeFi workflows rather than protocol-per-skill sprawl:

- swap routing,
- live swap quotes plus prepared swap execution for supported venues,
- Aave supply preview/prepare/execute,
- Curve LP preview/prepare/execute on `ethereum-mainnet`,
- venue discovery,
- policy warnings about collateral eligibility, slippage, approvals, and unsupported venues.

The skill should rely on the general fact that RLUSD is an ERC-20 token designed for compatibility with wallets, exchanges, and DeFi platforms, while the CLI owns the changing venue matrix.[7]

### 11.7 Buy / Redeem Requirements

The product must document and support instruction generation around Ripple's current institutional flow:

- onboarding requires contact details, tax documents, crypto wallets, and bank accounts;[1]
- up to three bank accounts can be registered; only onboarded accounts are valid for funding and redemption;[2]
- buying RLUSD is wire-based and requires the wallet ID / memo reference;[3]
- XRPL purchases require a trust line first;[3]
- payment settlement depends on banking rails, not just blockchain finality.[3]

### 11.8 Safety and Auditability

The CLI must expose:

- `requires_confirmation`,
- `warnings`,
- normalized transaction intent,
- resolved chain/asset metadata,
- plan IDs,
- and receipts.

It should log enough metadata for an operator to reconstruct what an AI agent planned and executed.

## 12. Non-Functional Requirements

1. **Determinism** — repeatable command semantics and response schema.
2. **Composability** — skill content can call into the same CLI from scripts and CI.
3. **Extensibility** — new chains or venues can be added via adapters and registry entries.
4. **Low surprise** — no hidden writes, no silent fallback to a different chain or venue.
5. **Performance** — read commands should be fast enough for iterative agent workflows.
6. **Maintainability** — changing addresses or venues should not require rewriting core skill prose.

## 13. Success Metrics

### 13.1 Product Metrics

- an agent can complete the happy-path read flow on both Ethereum and XRPL using only the skills and CLI;
- an agent can prepare, but not accidentally execute, a transfer on both chains;
- DeFi preview flows work without protocol-specific prompt engineering;
- no core skill contains stale hardcoded mainnet addresses outside references/registry.

### 13.2 Engineering Metrics

- JSON schema stability across commands,
- high automated test coverage on command parsing and plan generation,
- reproducible dry-run fixtures for Ethereum and XRPL,
- successful dogfooding with at least one AI-agent coding workflow.

## 14. Risks and Constraints

1. **Documentation drift**
   Addresses, venue support, and ecosystem integrations can change. The registry layer mitigates this.

2. **Chain-specific edge cases**
   XRPL tags, trust-line state, and issuer settings can create non-obvious failures.[8][9]

3. **Compliance-sensitive behavior**
   RLUSD admin features may cause some venues or integrators to impose extra policy checks.[10]

4. **Institutional flow mismatch**
   Ripple's buy/redeem workflow is not a generic public on-chain mint flow.[1][2][3]

5. **Package supply-chain risk**
   Blockchain SDKs and wallet tooling require pinning, lockfiles, and security review.

## 15. Assumptions

1. The first implementation targets local development and operator-assisted execution.
2. Ethereum and XRPL are the only mandatory chains for v1 because those are Ripple's current documented RLUSD networks.[6][7][8]
3. DeFi support in v1 is venue-agnostic, with live quote reads and preview-first
   execution planning.
4. Skills are authored for Claude-style plugin loading but should remain readable in any markdown-aware agent environment.

## 16. Release Criteria

The v1 product is ready when:

1. the repository structure and plugin metadata are valid;
2. the router skill correctly dispatches common prompts to Ethereum, XRPL, DeFi, and buy/redeem guidance;
3. the CLI supports read + prepare + execute + receipt flows for Ethereum and XRPL;
4. all write flows are explicit and auditable;
5. documentation includes examples, warnings, and references;
6. command examples and automated coverage are sufficient for the current mainnet-only scope; no live testnet demo requirement is tracked in v1.

## 17. References

1. Ripple Docs — Connect your accounts: https://docs.ripple.com/products/stablecoin/user-interface/tutorials/connect-your-accounts
2. Ripple Docs — Bank accounts: https://docs.ripple.com/products/stablecoin/user-interface/settings/bank-accounts
3. Ripple Docs — Buy Ripple USD: https://docs.ripple.com/products/stablecoin/user-interface/tutorials/buy-rlusd
4. Circle Skills repository: https://github.com/circlefin/skills
5. Claude Code Docs — Skills: https://code.claude.com/docs/en/skills
6. Ripple Stablecoin docs overview: https://docs.ripple.com/products/stablecoin
7. Ripple Docs — RLUSD on the Ethereum network: https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-ethereum
8. Ripple Docs — RLUSD on the XRP Ledger: https://docs.ripple.com/products/stablecoin/developer-resources/rlusd-on-the-xrpl
9. Ripple RLUSD XRPL settings: https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-xrpl-settings.md
10. Ripple RLUSD Ethereum design: https://raw.githubusercontent.com/ripple/RLUSD-Implementation/main/doc/rlusd-ethereum-design.md
