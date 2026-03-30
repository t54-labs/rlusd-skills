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
rlusd evm transfer execute --plan <path> [--confirm-plan-id <plan_id>] --password "$RLUSD_WALLET_PASSWORD" --json
```

Notes:

- loads and validates the stored plan
- resolves the sender wallet from `rlusd-cli` local wallet storage
- pass `--password "$RLUSD_WALLET_PASSWORD"` explicitly for agent-friendly
  execution examples; the CLI can also read `RLUSD_WALLET_PASSWORD` from the
  environment
- returns the submitted `tx_hash`

### `evm approve prepare`

Create a deterministic RLUSD approval plan.

```bash
rlusd evm approve prepare --chain <chain> --owner-wallet <wallet_name> --spender <address> --amount <amount> --json
```

### `evm approve execute`

Execute a prepared RLUSD approval.

```bash
rlusd evm approve execute --plan <path> [--confirm-plan-id <plan_id>] --password "$RLUSD_WALLET_PASSWORD" --json
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

Examples in this repo pass `--chain xrpl-mainnet` for predictability. On the
current CLI surface, some CLI help output may only list `--address`, but
`--chain` is still accepted via the global flag.

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
rlusd xrpl trustline execute --plan <path> [--confirm-plan-id <plan_id>] --wallet <wallet_name> --password "$RLUSD_WALLET_PASSWORD" --json
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
rlusd xrpl payment execute --plan <path> [--confirm-plan-id <plan_id>] --wallet <wallet_name> --password "$RLUSD_WALLET_PASSWORD" --json
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
rlusd defi swap execute --plan <path> [--confirm-plan-id <plan_id>] --password "$RLUSD_WALLET_PASSWORD" --json
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
rlusd defi lp execute --plan <path> [--confirm-plan-id <plan_id>] --password "$RLUSD_WALLET_PASSWORD" --json
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
rlusd defi supply execute --plan <path> [--confirm-plan-id <plan_id>] --password "$RLUSD_WALLET_PASSWORD" --json
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

## `x402`

### `x402 fetch`

Fetch an x402-protected resource with automatic XRPL payment negotiation.

```bash
rlusd x402 fetch <url> --max-value <amount> [--wallet <name>] [--method GET|POST] [--header <header...>] [--json-body <json>] [--require-asset <asset>] [--require-issuer <issuer>] [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `<url>`: resource URL (positional argument)
- `--max-value <amount>`: maximum amount willing to pay per request (required)
- `--wallet <name>`: stored XRPL wallet to use for signing
- `--method <method>`: HTTP method, `GET` or `POST` (default `GET`)
- `--header <header...>`: additional request header(s) as `Name: value`
- `--json-body <json>`: JSON request body for POST requests
- `--require-asset <asset>`: only accept payment options for this XRPL asset
- `--require-issuer <issuer>`: only accept payment options for this XRPL issuer
- `--password <password>`: wallet password (or set `RLUSD_WALLET_PASSWORD`)

## `wallet keychain`

### `wallet keychain enable`

Store an existing wallet password in the macOS Keychain.

```bash
rlusd wallet keychain enable <name> [--password "$RLUSD_WALLET_PASSWORD"]
```

Notes:

- validates the password can decrypt the named wallet before storing
- macOS only

### `wallet keychain disable`

Remove a wallet password from the macOS Keychain.

```bash
rlusd wallet keychain disable <name>
```

### `wallet keychain status`

Check whether a wallet password is stored in the macOS Keychain.

```bash
rlusd wallet keychain status [name] [--chain <chain>]
```

Options:

- `[name]`: wallet name (optional; defaults to the chain's default wallet)
- `--chain <chain>`: chain to use when name is omitted

## `wallet export-seed`

### `wallet export-seed`

Export the XRPL wallet seed for importing into third-party wallets.

```bash
rlusd wallet export-seed [--wallet <name>] --password "$RLUSD_WALLET_PASSWORD" --json
```

Options:

- `--wallet <name>`: wallet name to export (defaults to current XRPL wallet)
- `--password <password>`: wallet password (or set `RLUSD_WALLET_PASSWORD`)

## `xrpl dex`

### `xrpl dex orderbook`

Display the XRP/RLUSD order book (both bid and ask sides).

```bash
rlusd xrpl dex orderbook --json
```

### `xrpl dex buy`

Place a buy limit order for RLUSD with XRP.

```bash
rlusd xrpl dex buy --amount <n> --price <p> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--amount <n>`: RLUSD amount to receive (required)
- `--price <p>`: max XRP to pay per 1 RLUSD (required)
- `--password <password>`: wallet password

### `xrpl dex sell`

Place a sell limit order to sell RLUSD for XRP.

```bash
rlusd xrpl dex sell --amount <n> --price <p> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--amount <n>`: RLUSD amount to sell (required)
- `--price <p>`: XRP to receive per 1 RLUSD (required)
- `--password <password>`: wallet password

### `xrpl dex cancel`

Cancel an open offer by its sequence number.

```bash
rlusd xrpl dex cancel --sequence <seq> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--sequence <seq>`: OfferSequence from the original OfferCreate transaction (required)
- `--password <password>`: wallet password

## `xrpl amm`

### `xrpl amm info`

Show the XRP/RLUSD AMM pool state including TVL, trading fee, and LP token.

```bash
rlusd xrpl amm info --json
```

### `xrpl amm deposit`

Deposit XRP and RLUSD liquidity into the AMM pool (two-asset deposit).

```bash
rlusd xrpl amm deposit --xrp <n> --rlusd <n> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--xrp <n>`: XRP amount to deposit (required)
- `--rlusd <n>`: RLUSD amount to deposit (required)
- `--password <password>`: wallet password

### `xrpl amm withdraw`

Withdraw liquidity from the AMM pool by redeeming LP tokens.

```bash
rlusd xrpl amm withdraw --lp-tokens <n> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--lp-tokens <n>`: LP token amount to redeem (required)
- `--password <password>`: wallet password

### `xrpl amm vote`

Vote on the AMM trading fee.

```bash
rlusd xrpl amm vote --fee <n> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--fee <n>`: proposed trading fee in 1/100,000 units, integer 0-1000 where 1000 = 1% (required)
- `--password <password>`: wallet password

### `xrpl amm swap`

Swap XRP for RLUSD via the AMM (single-asset deposit).

```bash
rlusd xrpl amm swap --sell-xrp <n> [--password "$RLUSD_WALLET_PASSWORD"] --json
```

Options:

- `--sell-xrp <n>`: XRP amount to contribute toward the swap (required)
- `--password <password>`: wallet password

## `xrpl pathfind`

### `xrpl pathfind`

Find cross-currency payment paths to deliver RLUSD to a destination (read-only,
no signing required).

```bash
rlusd xrpl pathfind --to <address> --amount <n> --json
```

Options:

- `--to <address>`: destination XRPL classic address (required)
- `--amount <n>`: RLUSD value to deliver (required)

Notes:

- uses the default XRPL wallet address as `source_account`
- no password needed; this is a read-only ledger query

## `gas-balance`

### `gas-balance`

Show native token balances (XRP, ETH) for gas across configured wallets.

```bash
rlusd gas-balance --json
```

## `price`

### `price`

Show RLUSD reference price from Chainlink oracle or XRPL DEX.

```bash
rlusd price [--chain <chain>] [--source chainlink|dex] --json
```

Options:

- `--chain <chain>`: EVM chain for Chainlink reads (defaults from config; use `xrpl` for DEX source)
- `--source <source>`: `chainlink` or `dex` (auto-detected from default chain)

## `market`

### `market`

Basic RLUSD market overview combining Chainlink USD price and XRPL DEX book.

```bash
rlusd market [--chain <chain>] --json
```

Options:

- `--chain <chain>`: EVM chain for Chainlink reads

## `send`

### `send`

Convenience command to send RLUSD to an address (auto-detects chain from
address format when `--chain` is omitted).

```bash
rlusd send --to <address> --amount <amount> [--chain <chain>] [--from-wallet <name>] [--tag <tag>] [--memo <memo>] [--password "$RLUSD_WALLET_PASSWORD"] [--dry-run] --json
```

Options:

- `--to <address>`: recipient address (required)
- `--amount <amount>`: amount of RLUSD to send (required)
- `--chain <chain>`: chain to send on (auto-detected from address if omitted)
- `--from-wallet <name>`: wallet name to send from
- `--tag <tag>`: XRPL destination tag (integer)
- `--memo <memo>`: transaction memo (max 256 bytes)
- `--password <password>`: wallet password
- `--dry-run`: preview transaction without submitting

## `faucet`

### `faucet fund`

Request test tokens from the network faucet (testnet/devnet only).

```bash
rlusd faucet fund [--chain <chain>] [--address <address>] --json
```

Options:

- `--chain <chain>`: chain to fund, `xrpl` or `ethereum` (defaults from config)
- `--address <address>`: address to fund (defaults to current wallet)

Notes:

- not available on mainnet
- XRPL faucet provides XRP; for RLUSD testnet tokens use the official faucet at
  `https://tryrlusd.com/`

## `tx`

### `tx status`

Check transaction status on a chain.

```bash
rlusd tx status <hash> [--chain <chain>] --json
```

Options:

- `<hash>`: transaction hash (positional argument)
- `--chain <chain>`: chain (defaults from config)

### `tx history`

Show recent RLUSD transactions for the current wallet.

```bash
rlusd tx history [--chain <chain>] [--limit <n>] --json
```

Options:

- `--chain <chain>`: chain (defaults from config)
- `--limit <n>`: max number of entries (default 20, max 400)

## Current Supported Chain Keys

Bundled registry entries:

- `ethereum-mainnet`
- `xrpl-mainnet`

Some top-level read and wallet commands also accept family aliases such as
`ethereum` and `xrpl`. Examples in this repo follow each subcommand's help
surface: top-level reads often use the family alias, while network-scoped
prepare, execute, wait, and receipt flows use `ethereum-mainnet` or
`xrpl-mainnet`.

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
