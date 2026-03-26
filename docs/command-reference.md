# Command Reference

## Global Notes

- All commands support `--json`
- Successful commands write JSON to stdout
- Command-level failures write structured JSON to stderr
- Unexpected CLI failures write structured JSON to stderr when `--json` is present
- Prepared plans are stored under `~/.config/rlusd-cli/plans`
- Execute commands may require `--confirm-plan-id <plan_id>`
- Local wallet execution uses `rlusd-cli` wallet storage plus explicit wallet
  flags such as `--from-wallet`, `--owner-wallet`, and `--wallet`

## `resolve`

### `resolve asset`

Resolve RLUSD metadata for a configured chain.

```bash
rlusd resolve asset --chain <chain> [--symbol RLUSD] --json
```

Options:

- `--chain <chain>`: registry chain key
- `--symbol <symbol>`: asset symbol, defaults to `RLUSD`

## `balance`

### `balance`

Read the RLUSD token balance for a configured wallet or explicit address.

```bash
rlusd balance --chain <chain> --address <address> --json
```

Options:

- `--chain <chain>`: currently `ethereum` for EVM balance reads on the current CLI surface
- `--address <address>`: account to inspect; omit to use the configured default wallet
- `--all`: optional aggregated balance view across configured chains

## `eth`

### `eth allowance`

Read RLUSD allowance for a configured wallet owner and spender.

```bash
rlusd eth allowance --chain <chain> --owner-wallet <wallet_name> --spender <address> --json
```

Options:

- `--chain <chain>`: currently `ethereum`
- `--owner-wallet <wallet_name>`: local wallet alias to use as the RLUSD owner
- `--spender <address>`: EVM spender to inspect

## `evm`

Prepared EVM agent flows for transfer, approval, and transaction monitoring use
registry-backed labels such as `ethereum-mainnet`.

### `evm transfer prepare`

Create a deterministic RLUSD transfer plan.

```bash
rlusd evm transfer prepare --chain <chain> --from-wallet <wallet_name> --to <address> --amount <amount> --json
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
- resolves the sender wallet from `rlusd-cli` local wallet storage
- returns the submitted `tx_hash`

### `evm approve prepare`

Create a deterministic RLUSD approval plan.

```bash
rlusd evm approve prepare --chain <chain> --owner-wallet <wallet_name> --spender <address> --amount <amount> --json
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

Returns structured status data including:

- `address`
- `account_exists`
- `has_trustline`
- `balance`
- `limit`
- `frozen`

When no trust line exists, the response remains structured and sets
`has_trustline = false`.

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
rlusd xrpl payment prepare --chain <chain> --from-wallet <wallet_name> --to <r-address> --amount <amount> --json
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

Read a live RLUSD swap quote with expiry metadata.

```bash
rlusd defi quote swap --chain <chain> --venue <venue> --from RLUSD --to USDC --amount <amount> [--fee-tier <fee>] --json
```

Returns:

- selected `route.venue`
- `pricing_source = live_quote`
- `amount_out`
- `fee_bps` for Uniswap quotes
- `pool_name` and `pool_address` for Curve quotes
- `quoted_at`
- `ttl_seconds`
- `expires_at`

Warnings:

- `quote_expires`
- `defi quote swap` requires explicit `--venue`; examples should also pass
  explicit `--chain` for predictability, although the CLI can resolve `--chain`
  from the global flag or `default_chain` config
- the default `--fee-tier` is `3000`; retry `100`, `500`, `3000`, and `10000`
  before concluding a Uniswap pair is unsupported
- Uniswap `QUOTE_UNAVAILABLE` errors may be marked retryable with
  `error.details.retry_hint = retry_fee_tiers`
- `--fee-tier` is Uniswap-specific; Curve uses the fixed Ethereum mainnet
  RLUSD/USDC pool
- Curve swap quotes are limited to `ethereum-mainnet` and the `RLUSD <-> USDC`
  pair in this batch

### `defi swap prepare`

Create a deterministic DeFi swap plan.

```bash
rlusd defi swap prepare --chain <chain> --venue <venue> --from-wallet <wallet_name> --from RLUSD --to USDC --amount <amount> [--slippage <bps>] [--fee-tier <fee>] --json
```

Notes:

- top-level swap writes follow `prepare -> review -> execute`
- stored `intent.steps` are venue-specific deterministic calldata steps
- Curve prepare is limited to `ethereum-mainnet` RLUSD/USDC in this batch

### `defi swap execute`

Execute a prepared DeFi swap plan.

```bash
rlusd defi swap execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

Returns submitted step hashes for each stored step.

### `defi lp preview`

Preview a Curve LP add/remove flow.

```bash
rlusd defi lp preview --chain <chain> --venue curve --operation <add|remove> [--rlusd-amount <amount>] [--usdc-amount <amount>] [--lp-amount <amount>] [--receive-token RLUSD|USDC] --json
```

Returns preview data only. It does not return `plan_id`, `plan_path`, or
`intent.steps`.

Preview data includes:

- `quoted_at`
- `ttl_seconds`
- `expires_at`

### `defi lp prepare`

Create a deterministic Curve LP plan.

```bash
rlusd defi lp prepare --chain <chain> --venue curve --operation <add|remove> --from-wallet <wallet_name> [--rlusd-amount <amount>] [--usdc-amount <amount>] [--lp-amount <amount>] [--receive-token RLUSD|USDC] --json
```

Current behavior:

- `--operation add` requires both `--rlusd-amount` and `--usdc-amount`
- `--operation remove` requires `--lp-amount` and `--receive-token RLUSD|USDC`
- the first-pass LP flow is Curve-only on `ethereum-mainnet`

### `defi lp execute`

Execute a prepared Curve LP plan.

```bash
rlusd defi lp execute --plan <path> [--confirm-plan-id <plan_id>] --json
```

Returns submitted step hashes for each stored step.

### `defi supply preview`

Preview a supply route for a configured lending venue.

```bash
rlusd defi supply preview --chain <chain> --venue <venue> --amount <amount> --json
```

Warnings may include `collateral_unsupported`.

### `defi supply prepare`

Create a deterministic DeFi supply plan.

```bash
rlusd defi supply prepare --chain <chain> --venue <venue> --from-wallet <wallet_name> --amount <amount> --json
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

The `fiat` guidance commands are chain-agnostic. Their JSON envelopes omit
`chain`, and chain-specific prerequisites should be checked separately with the
Ethereum or XRPL skills.

### `fiat onboarding checklist`

Print the high-level Ripple onboarding checklist.

```bash
rlusd fiat onboarding checklist --json
```

### `fiat buy instructions`

Print provider and rail guidance for buying RLUSD.

```bash
rlusd fiat buy instructions --json
```

Notes:

- use the chain-specific skills to validate wallet and trust-line prerequisites
- the command is guidance-only and does not submit anything

### `fiat redeem instructions`

Print provider and settlement guidance for redeeming RLUSD.

```bash
rlusd fiat redeem instructions --json
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
