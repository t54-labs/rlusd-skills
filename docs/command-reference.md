# Command Reference

## Global Notes

- All commands support `--json`
- Successful commands write JSON to stdout
- Command-level failures write structured JSON to stderr
- Unexpected CLI failures write structured JSON to stderr when `--json` is present
- Prepared plans are stored under `.rlusd/plans`
- Execute commands may require `--confirm-plan-id <plan_id>`

## `resolve`

### `resolve asset`

Resolve RLUSD metadata for a configured chain.

```bash
rlusd resolve asset --chain <chain> [--symbol RLUSD] --json
```

Options:

- `--chain <chain>`: registry chain key
- `--symbol <symbol>`: asset symbol, defaults to `RLUSD`

## `evm`

### `evm balance`

Read the RLUSD token balance for an EVM address.

```bash
rlusd evm balance --chain <chain> --address <address> --json
```

Options:

- `--chain <chain>`: currently `ethereum-mainnet`
- `--address <address>`: EVM account to inspect

### `evm allowance`

Read RLUSD allowance for an owner/spender pair.

```bash
rlusd evm allowance --chain <chain> --owner <address> --spender <address> --json
```

### `evm transfer prepare`

Create a deterministic RLUSD transfer plan.

```bash
rlusd evm transfer prepare --chain <chain> --from <wallet-or-address> --to <address> --amount <amount> --json
```

Returned plan data includes:

- `plan_id`
- `plan_path`
- `human_summary`
- `intent.to`
- encoded ERC-20 transfer `data`

### `evm transfer execute`

Execute a prepared RLUSD transfer.

```bash
rlusd evm transfer execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

Notes:

- loads and validates the stored plan
- resolves the sender signer from `.rlusd/config.json`
- returns the submitted `tx_hash`

### `evm approve prepare`

Create a deterministic RLUSD approval plan.

```bash
rlusd evm approve prepare --chain <chain> --owner <wallet-or-address> --spender <address> --amount <amount> --json
```

### `evm approve execute`

Execute a prepared RLUSD approval.

```bash
rlusd evm approve execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

### `evm tx wait`

Wait for an EVM transaction to be mined.

```bash
rlusd evm tx wait --chain <chain> --hash <tx_hash> --json
```

Returns:

- `transaction_hash`
- `status`
- `block_number`
- `confirmations`

### `evm tx receipt`

Read a mined EVM transaction receipt summary.

```bash
rlusd evm tx receipt --chain <chain> --hash <tx_hash> --json
```

## `xrpl`

### `xrpl trustline status`

Read RLUSD trust-line state for an XRPL account.

```bash
rlusd xrpl trustline status --chain <chain> --address <r-address> --json
```

### `xrpl trustline prepare`

Create a deterministic RLUSD `TrustSet` plan.

```bash
rlusd xrpl trustline prepare --chain <chain> --address <r-address> --limit <limit> --json
```

Returned plan data includes:

- `plan_id`
- `plan_path`
- `human_summary`
- `intent.tx_json.TransactionType = TrustSet`

### `xrpl trustline execute`

Execute a prepared RLUSD trust-line plan.

```bash
rlusd xrpl trustline execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

### `xrpl account info`

Read XRPL account metadata for a given address.

```bash
rlusd xrpl account info --chain <chain> --address <r-address> --json
```

### `xrpl payment prepare`

Create a deterministic RLUSD payment plan.

```bash
rlusd xrpl payment prepare --chain <chain> --from <wallet-or-address> --to <r-address> --amount <amount> --json
```

Notes:

- resolves the sender address first
- checks destination trust-line state before writing the plan
- returns structured errors when the destination account is missing or cannot
  receive RLUSD

### `xrpl payment execute`

Execute a prepared RLUSD payment plan.

```bash
rlusd xrpl payment execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

### `xrpl tx wait`

Wait for an XRPL transaction to validate.

```bash
rlusd xrpl tx wait --chain <chain> --hash <tx_hash> --json
```

Returns:

- `transaction_hash`
- `validated`
- `result`
- `ledger_index`

### `xrpl payment receipt`

Read a submitted XRPL payment receipt summary.

```bash
rlusd xrpl payment receipt --chain <chain> --hash <tx_hash> --json
```

Returns the XRPL status plus `destination` and delivered `amount` fields.

## `defi`

### `defi venues`

List configured RLUSD DeFi venues for a chain.

```bash
rlusd defi venues --chain <chain> [--capability swap,lend,lp] --json
```

Notes:

- the capability filter is comma-separated
- matching is inclusive: a venue is returned when it supports any requested
  capability

### `defi quote swap`

Preview a registry-backed RLUSD swap quote.

```bash
rlusd defi quote swap --chain <chain> --from RLUSD --to USDC --amount <amount> --json
```

Returns:

- selected `route.venue`
- `pricing_source = reference_preview`
- `rate`
- `amount_out`
- `fee_bps`
- `considered_venues`

Warnings:

- `not_live_market_data`
- `preview_only`

### `defi supply preview`

Preview a supply route for a configured lending venue.

```bash
rlusd defi supply preview --chain <chain> --venue <venue> --amount <amount> --json
```

Warnings may include `collateral_unsupported`.

### `defi supply prepare`

Create a deterministic DeFi supply plan.

```bash
rlusd defi supply prepare --chain <chain> --venue <venue> --from <wallet-or-address> --amount <amount> --json
```

Current behavior:

- validates the venue exists and supports `lend`
- loads preview data from the registry
- resolves the sender address
- stores a multi-step plan with `approve` then `supply`

### `defi supply execute`

Execute a prepared multi-step DeFi supply plan.

```bash
rlusd defi supply execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

Returns submitted step hashes for each stored step.

## `fiat`

### `fiat onboarding checklist`

Print the high-level Ripple onboarding checklist.

```bash
rlusd fiat onboarding checklist --json
```

### `fiat buy instructions`

Print parameterized buy instructions for a Ripple wallet ID and chain.

```bash
rlusd fiat buy instructions --wallet-id <wallet_id> --chain <chain> --json
```

Notes:

- XRPL flows add a trust-line prerequisite warning
- the command is guidance-only and does not submit anything

### `fiat redeem instructions`

Print parameterized redemption guidance.

```bash
rlusd fiat redeem instructions --wallet-id <wallet_id> --amount <amount> --json
```

## Current Supported Chain Keys

Bundled registry entries:

- `ethereum-mainnet`
- `xrpl-mainnet`

## Important Error Codes

Common structured error codes include:

- `UNSUPPORTED_CHAIN`
- `QUOTE_UNAVAILABLE`
- `VENUE_UNAVAILABLE`
- `CAPABILITY_UNSUPPORTED`
- `PREVIEW_UNAVAILABLE`
- `TRUSTLINE_MISSING`
- `DESTINATION_ACCOUNT_MISSING`
- `CONFIRMATION_REQUIRED`
- `PLAN_LOAD_FAILED`
- `PLAN_INTEGRITY_MISMATCH`
- `EXECUTION_FAILED`
