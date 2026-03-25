# RLUSD Skills RLUSD CLI Cutover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `rlusd-skills` so the repo becomes skills-and-docs only, with markdown and examples targeting the new `rlusd-cli` backend instead of the embedded `cli/rlusd` package.

**Architecture:** Treat `rlusd-cli` as the canonical runtime and this repo as the canonical skill layer. Update every skill and doc to the new command surface, explicit local-wallet flags, and live quote semantics, then remove the embedded CLI package and workspace wiring.

**Tech Stack:** Markdown skills, pnpm workspace, Claude plugin metadata, repo docs

---

## Branch And Sequencing

**Branch:** `feat/rlusd-cli-cutover`

**Merge dependency:** Start this branch only after `rlusd-cli` branch `feat/skills-backend-migration` is pushed and testable locally.

**Push rule:** Push after every checkpoint commit so docs review and plugin QA can happen incrementally.

---

### Task 1: Update the routing skill to the new CLI contract

**Files:**
- Modify: `plugins/ripple/skills/use-rlusd/SKILL.md`
- Modify: `plugins/ripple/skills/use-rlusd-ethereum/SKILL.md`
- Modify: `plugins/ripple/skills/use-rlusd-xrpl/SKILL.md`
- Modify: `plugins/ripple/skills/use-rlusd-evm-defi/SKILL.md`
- Modify: `plugins/ripple/skills/buy-redeem-rlusd/SKILL.md`
- Modify: `plugins/ripple/README.md`

**Step 1: Rewrite the command sequences**

Update every routing/reference skill to:
- use the external `rlusd-cli` command surface
- describe explicit wallet flags instead of `wallet:ops`
- keep all write actions on `prepare -> review -> execute`

**Step 2: Rewrite DeFi quote language**

Change `defi quote swap` from static preview wording to live-quote wording with expiry/staleness caveats.

**Step 3: Validate command references manually**

Check that every command named in the markdown exists on the `rlusd-cli` migration branch.

**Step 4: Commit and push**

```bash
git checkout -b feat/rlusd-cli-cutover
git add plugins/ripple/skills/use-rlusd/SKILL.md plugins/ripple/skills/use-rlusd-ethereum/SKILL.md plugins/ripple/skills/use-rlusd-xrpl/SKILL.md plugins/ripple/skills/use-rlusd-evm-defi/SKILL.md plugins/ripple/skills/buy-redeem-rlusd/SKILL.md plugins/ripple/README.md
git commit -m "docs: retarget routing skills to rlusd-cli"
git push -u origin feat/rlusd-cli-cutover
```

---

### Task 2: Update the action skills to explicit local-wallet flows

**Files:**
- Modify: `plugins/ripple/skills/rlusd-transfer/SKILL.md`
- Modify: `plugins/ripple/skills/rlusd-trustline/SKILL.md`
- Modify: `plugins/ripple/skills/rlusd-defi-action/SKILL.md`
- Modify: `plugins/ripple/skills/use-rlusd-ethereum/references/transfers.md`
- Modify: `plugins/ripple/skills/use-rlusd-ethereum/references/permit.md`
- Modify: `plugins/ripple/skills/use-rlusd-xrpl/references/trustlines.md`
- Modify: `plugins/ripple/skills/use-rlusd-xrpl/references/payments.md`
- Modify: `plugins/ripple/skills/use-rlusd-evm-defi/references/routing.md`
- Modify: `plugins/ripple/skills/use-rlusd-evm-defi/references/risk-model.md`
- Modify: `plugins/ripple/skills/use-rlusd-evm-defi/references/venues.md`

**Step 1: Replace old execution examples**

Move examples from:
- alias-style sender references like `wallet:ops`
- old embedded CLI wording

To:
- `--wallet`, `--from-wallet`, `--owner-wallet`
- explicit review of returned `plan_id` and `plan_path`

**Step 2: Update warnings and examples**

Ensure:
- DeFi quotes are described as live and expiring
- supply execution remains Aave-only if that is still true on the CLI branch
- examples never jump directly from intent to execution

**Step 3: Commit and push**

```bash
git add plugins/ripple/skills/rlusd-transfer/SKILL.md plugins/ripple/skills/rlusd-trustline/SKILL.md plugins/ripple/skills/rlusd-defi-action/SKILL.md plugins/ripple/skills/use-rlusd-ethereum/references/transfers.md plugins/ripple/skills/use-rlusd-ethereum/references/permit.md plugins/ripple/skills/use-rlusd-xrpl/references/trustlines.md plugins/ripple/skills/use-rlusd-xrpl/references/payments.md plugins/ripple/skills/use-rlusd-evm-defi/references/routing.md plugins/ripple/skills/use-rlusd-evm-defi/references/risk-model.md plugins/ripple/skills/use-rlusd-evm-defi/references/venues.md
git commit -m "docs: update action skills for local wallet prepare flows"
git push
```

---

### Task 3: Rewrite core product docs around the external CLI

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/command-reference.md`
- Modify: `docs/security.md`
- Modify: `docs/troubleshooting.md`
- Modify: `docs/IMPLEMENTATION-STATUS.md`

**Step 1: Rewrite architecture**

Update the architecture docs so this repo no longer claims the CLI lives inside `cli/rlusd`. Replace that with a skills/docs-only architecture that points to `rlusd-cli` as the backend runtime.

**Step 2: Rewrite command reference**

Document the new command surface, especially:
- explicit wallet flags
- shared JSON output
- deterministic plan review
- live quote semantics

**Step 3: Rewrite security and troubleshooting**

Update paths and operational assumptions away from:
- `.rlusd/config.json`
- embedded CLI plan internals

And toward:
- local `rlusd-cli` wallet storage
- local password/env handling
- external CLI installation and version alignment

**Step 4: Commit and push**

```bash
git add README.md docs/architecture.md docs/command-reference.md docs/security.md docs/troubleshooting.md docs/IMPLEMENTATION-STATUS.md
git commit -m "docs: rewrite core docs for external rlusd-cli backend"
git push
```

---

### Task 4: Rewrite examples and implementation docs

**Files:**
- Modify: `docs/examples/ethereum.md`
- Modify: `docs/examples/xrpl.md`
- Modify: `docs/examples/defi.md`
- Modify: `docs/RLUSD-Skills-PRD.md`
- Modify: `docs/RLUSD-Skills-Implementation-Plan.md`

**Step 1: Update example commands**

Replace embedded CLI examples with copy-pasteable `rlusd-cli` examples.

**Step 2: Update product docs**

Align the PRD and implementation-plan language with the new architecture:
- `rlusd-cli` is the backend
- live quotes are supported for DeFi discovery
- local wallets are expected
- `rlusd-skills` is not a CLI monorepo long-term

**Step 3: Commit and push**

```bash
git add docs/examples/ethereum.md docs/examples/xrpl.md docs/examples/defi.md docs/RLUSD-Skills-PRD.md docs/RLUSD-Skills-Implementation-Plan.md
git commit -m "docs: align examples and planning docs with rlusd-cli"
git push
```

---

### Task 5: Remove embedded CLI package from the workspace

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `README.md`
- Remove: `cli/rlusd/package.json`
- Remove: `cli/rlusd/tsconfig.json`
- Remove: `cli/rlusd/tsconfig.build.json`
- Remove: `cli/rlusd/vitest.config.ts`
- Remove: `cli/rlusd/scripts/copy-registry.mjs`
- Remove: `cli/rlusd/src/**`
- Remove: `cli/rlusd/test/**`

**Step 1: Update workspace scripts**

Remove scripts that build, typecheck, or test the embedded CLI package.

**Step 2: Remove the embedded package**

Delete `cli/rlusd` once the docs no longer reference it and the external backend is verified.

**Step 3: Update install/setup docs**

Make the top-level README explain that developers install and run `rlusd-cli` separately while this repo packages skills and docs.

**Step 4: Commit and push**

```bash
git add package.json pnpm-workspace.yaml README.md
git rm -r cli/rlusd
git commit -m "chore: remove embedded cli package after cutover"
git push
```

---

### Task 6: Final QA pass for skill integrity

**Files:**
- Modify as needed: any skill or doc files touched above

**Step 1: Run documentation QA**

Verify:
- every referenced command exists in `rlusd-cli`
- every write flow starts with `prepare`
- no docs still call the removed embedded package
- no docs still describe `defi quote swap` as static preview data

**Step 2: Run repo checks**

Run:
- `pnpm install`
- `pnpm test`
- `pnpm typecheck`

Expected: PASS with the workspace reduced to skills/docs concerns only.

**Step 3: Commit and push**

```bash
git add .
git commit -m "docs: finalize rlusd-cli cutover validation"
git push
```

---

## Cross-Repo Cutover Checklist

Before merging this branch, confirm:
- `rlusd-cli` branch `feat/skills-backend-migration` is merged or pinned for testing
- all skill markdown examples were manually smoke-checked against the new CLI
- docs no longer mention `cli/rlusd/dist/index.js`
- skill examples use explicit local-wallet flags
- live quote warnings are documented consistently across DeFi skill files
