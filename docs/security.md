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

Execution now depends on `rlusd-cli` local wallet storage plus
`RLUSD_WALLET_PASSWORD`.

- wallet files live under `~/.config/rlusd-cli/wallets`
- plan files live under `~/.config/rlusd-cli/plans`
- signer material is not stored in prepared plans
- explicit wallet flags should be preferred over implicit defaults

This means a malformed alias or mismatched signer secret fails before
submission.

## Ethereum-Specific Rules

- RLUSD integrations must use the registry-resolved proxy address, not the
  implementation address
- EVM plan builders encode standard ERC-20 `transfer` and `approve` calls only
- transport configuration comes from `rlusd-cli` local config
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

- `defi quote swap` is live quote data with expiry metadata
- DeFi supply execution is multi-step and submits stored `approve` then `supply`
  calls
- the current supply implementation is `aave`-only
- preview warnings should be treated as risk disclosures, not cosmetic text

Warnings that commonly matter in DeFi flows:

- `quote_expires`
- `preview_only`
- `collateral_unsupported`

## Bridge-Specific Rules

- `bridge prepare` is non-destructive on-chain, but it queries source-chain RPC
  for the Wormhole NTT delivery quote and writes a local plan file
- review the route, `approval_data`, `transfer_data`,
  `required_native_value_wei`, and stored plan `intent.steps` before execute
- `bridge execute` submits the stored approval transaction before the stored NTT
  transfer transaction
- use a local EVM wallet alias and `RLUSD_WALLET_PASSWORD` for execution
- use isolated low-value wallets for initial live bridge execution
- do not run `bridge execute` during docs or skill verification
- do not assume XRPL L1 to EVM bridging is supported by Wormhole NTT

## Operational Recommendations

- keep `~/.config/rlusd-cli` wallet and config files out of version control when
  they contain real wallet names or production-specific conventions
- use dedicated low-value wallets for any initial live usage
- review `human_summary`, `params`, and low-level `intent` data before any
  execute command
- follow wait/receipt commands for EVM and XRPL flows, or bridge status/history
  commands for Wormhole NTT bridge flows, after execute steps
- extend the registry explicitly instead of inventing chain or venue metadata in
  prompts

## Known Gaps

- there is no multisig or external signer adapter yet
- there is no dry-run simulator for multi-step DeFi actions yet
