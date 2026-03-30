---
name: rlusd-x402
description: XRPL x402 buyer flow. Use when the user wants to fetch a paid API resource using the x402 HTTP payment protocol with an XRPL wallet.
user-invocable: true
---

# Purpose

Use this skill when the user wants to access a paid HTTP resource using the x402
payment protocol. The CLI handles the full negotiation cycle: initial request,
402 Payment Required parsing, compatible payment selection, XRPL payment signing,
and authenticated re-request.

# When To Use This Skill

- The user mentions x402, paid API, or HTTP payment negotiation.
- The user wants to fetch a URL that requires x402 payment.
- The task involves paying for API access with an XRPL wallet.
- The user mentions accessing a resource that returns 402 Payment Required.

# Do Not Use This Skill When

- The task is about regular RLUSD transfers or payments; use `rlusd-transfer`.
- The task is about XRPL trust lines, account info, or other ledger reads; use
  `use-rlusd-xrpl`.
- The task is about DeFi swaps, lending, or liquidity; use `rlusd-defi-action`.
- The user only wants to check balances or metadata without making an x402 fetch.

# Decision Guide

- Before running `x402 fetch`, load `rlusd-wallets` to confirm the XRPL wallet
  alias exists locally. The `--wallet` flag is optional; when omitted, the CLI
  falls back to the default XRPL wallet. When provided, it requires a local
  signer alias, not an `r...` address.
- The `--max-value` flag is required and must be a positive number. It caps the
  maximum amount the CLI will agree to pay per request.
- The `--method` flag defaults to `GET`. Only `GET` and `POST` are supported.
- Use `--require-asset` and `--require-issuer` to constrain which payment options
  the CLI will accept from the server. This is useful when the server advertises
  multiple payment options and you want to pay only with a specific asset.
- Use `--json-body` for POST requests; the CLI validates the JSON before
  sending and fails immediately on malformed JSON. It auto-sets `Content-Type:
  application/json` unless a custom content-type header is provided.
- Use `--header` to add custom request headers. The format is `"Name: value"`.
  Multiple headers can be passed by repeating the flag.
- The CLI resolves the XRPL network from the active configuration environment
  (mainnet, testnet, devnet). Ensure the correct environment is active before
  fetching.
- The CLI only selects payment options that use the `exact` scheme. Other
  scheme types advertised by the server are ignored during selection.
- The command is a single direct-execution command. There is no prepare/execute
  pattern for x402 fetch.
- On success, the output envelope includes request details, response body, and
  payment settlement information.
- On negotiation failure (server returns 402 that cannot be satisfied), the
  output envelope includes the server's accepted payment options for debugging.

# Current Command Sequence

```bash
rlusd config get --json
rlusd wallet list --json

# --wallet is optional; omit it to use the default XRPL wallet
rlusd x402 fetch <url> --max-value <amount> --json
rlusd x402 fetch <url> --wallet <name> --max-value <amount> --password "$RLUSD_WALLET_PASSWORD" --json
rlusd x402 fetch <url> --wallet <name> --max-value <amount> --method POST --json-body '{"key":"value"}' --json
rlusd x402 fetch <url> --wallet <name> --max-value <amount> --require-asset RLUSD --require-issuer rBvKgF3jSZWdJcwSsmoJspoXGpHUhBGurg --json
rlusd x402 fetch <url> --wallet <name> --max-value <amount> --header "Authorization: Bearer tok" --json
```

Use the output to confirm (all success fields nest under `data`):

- `data.response.ok` is `true` and `data.response.status` is a success code
- `data.payment.negotiated` is `true` when x402 payment was performed
- `data.payment.selected_requirement` shows which payment option was used
- `data.payment.settlement` contains the on-chain settlement proof when present
- On failure, `code` is `PAYMENT_NEGOTIATION_FAILED` with the server's
  `accepts` array for debugging, or `X402_FETCH_FAILED` for other errors

# Common Warnings

- The `--max-value` flag is required and must be positive. The CLI rejects zero
  or negative values.
- The `--method` flag only accepts `GET` or `POST`. Other HTTP methods are
  rejected.
- The `--wallet` flag is optional. When omitted, the CLI uses the default XRPL
  wallet. When provided, it requires a local XRPL wallet alias, not an on-chain
  address. Use `rlusd-wallets` to confirm the alias before running the command.
- Do not assume example wallet aliases like `treasury-xrpl` already exist
  locally; use `rlusd-wallets` before any wallet-backed x402 fetch.
- Password handling follows the same pattern as other wallet-backed commands:
  pass `--password "$RLUSD_WALLET_PASSWORD"` explicitly or let the CLI read
  `RLUSD_WALLET_PASSWORD` from the environment.
- This is a direct-execution command with no prepare/execute review cycle.
  Payment is authorized and signed in a single step, bounded by `--max-value`.
- The CLI resolves the XRPL WebSocket URL and network ID from the active
  configuration. If XRPL is not configured, the command fails.
- `--require-asset` does case-insensitive verbatim matching against the server's
  advertised `asset` or `currency` field. XRPL servers may advertise RLUSD using
  the hex-encoded currency code (`524C555344000000000000000000000000000000`)
  instead of the human-readable symbol `RLUSD`. If `--require-asset RLUSD` fails
  with `PAYMENT_NEGOTIATION_FAILED`, check the error's `accepts` array for the
  actual currency value and retry with that value.
- When `--require-asset` or `--require-issuer` are set and no server option
  matches, the command fails with a clear error.
- Header values must use the `"Name: value"` format with a colon separator.
  Invalid headers are rejected.
- If the server's 402 response cannot be satisfied under the current constraints,
  review the `accepts` array in the error envelope and adjust `--max-value`,
  `--require-asset`, or `--require-issuer` accordingly.
- `X402_FETCH_FAILED` is a catch-all error code. Common triggers include:
  - Invalid `--max-value` (not a positive number)
  - Wallet not found (name does not exist locally)
  - Wallet is not an XRPL wallet (e.g., an EVM wallet was selected)
  - Unsupported HTTP method (not GET or POST)
  - Malformed `--json-body` (invalid JSON)
  - Missing XRPL WebSocket configuration in the active environment
  - Password resolution failure (no password provided and no Keychain entry)

# References

- [x402 Protocol](https://www.x402.org/) -- HTTP 402 payment negotiation standard
- [Ripple RLUSD](https://ripple.com/solutions/stablecoin/) -- RLUSD stablecoin docs

# Examples

- "Fetch this paid API endpoint using x402." -> use `rlusd-wallets`, then run
  `x402 fetch`
- "Access this x402-protected URL with my XRPL wallet." -> use `rlusd-wallets`,
  then run `x402 fetch`
- "POST data to this x402 API." -> use `rlusd-wallets`, then run `x402 fetch`
  with `--method POST --json-body '...'`
- "Fetch this paid endpoint but only pay with RLUSD." -> use `rlusd-wallets`,
  then run `x402 fetch` with `--require-asset RLUSD`
- "The x402 negotiation failed. What does the server accept?" -> inspect the
  `accepts` array in the error envelope
