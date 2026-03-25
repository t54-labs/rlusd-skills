# Security

## Safety Model

The current RLUSD toolkit is designed around explicit review before side effects.

- read commands never create on-chain changes
- `prepare` commands create deterministic local plan artifacts only
- `execute` commands require a stored plan and may require a matching
  `--confirm-plan-id`
- transaction success is confirmed with explicit wait/receipt commands

## Plan Integrity

Prepared plans are hashed into deterministic `plan_id` values. Before execution,
the CLI reloads the plan and recomputes the expected ID from:

- command
- chain
- action
- confirmation requirement
- asset metadata
- params
- intent payload
- warnings

If any of those fields change, execution fails with
`PLAN_INTEGRITY_MISMATCH` or `PLAN_LOAD_FAILED`.

## Wallet and Signer Controls

Execution depends on `.rlusd/config.json` plus environment-backed signer secrets.

- EVM signing currently supports local private keys via `env:<VAR_NAME>`
- XRPL signing currently supports local seeds via `env:<VAR_NAME>`
- signer material is not stored in prepared plans
- configured wallet addresses must match the derived signer address exactly

This means a malformed alias or mismatched signer secret fails before
submission.

## Ethereum-Specific Rules

- RLUSD integrations must use the registry-resolved proxy address, not the
  implementation address
- EVM plan builders encode standard ERC-20 `transfer` and `approve` calls only
- transport configuration comes from the registry's `rpc_url_env`
- execute flows validate that the loaded plan action matches the command invoked

## XRPL-Specific Rules

- RLUSD is modeled as an issued token, not an ERC-20
- XRPL plans depend on issuer and currency metadata from the registry
- payment planning checks destination trust-line status before producing a plan
- payment planning fails with `TRUSTLINE_MISSING` when the destination cannot
  currently receive RLUSD
- payment planning fails with `DESTINATION_ACCOUNT_MISSING` when the destination
  XRPL account is not activated

## DeFi-Specific Rules

- DeFi quotes are static registry-backed previews, not live market reads
- DeFi supply execution is multi-step and submits stored `approve` then `supply`
  calls
- the current supply implementation is `aave`-only
- preview warnings should be treated as risk disclosures, not cosmetic text

Warnings that commonly matter in DeFi flows:

- `not_live_market_data`
- `preview_only`
- `collateral_unsupported`

## Operational Recommendations

- keep `.rlusd/config.json` out of version control when it contains real wallet
  addresses and env naming conventions tied to production systems
- use dedicated low-value wallets for any initial live usage
- review `human_summary`, `params`, and low-level `intent` data before any
  execute command
- follow `wait` and `receipt` commands after every execute step
- extend the registry explicitly instead of inventing chain or venue metadata in
  prompts

## Known Gaps

- there is no multisig or external signer adapter yet
- there is no dry-run simulator for multi-step DeFi actions yet
