# XRPL Issuer Settings

## Current Bundled RLUSD Metadata

Resolve the bundled XRPL metadata with:

```bash
rlusd resolve asset --chain xrpl-mainnet --json
```

The current registry should return output where:

- `symbol = RLUSD`
- `issuer = rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`
- `currency` may be XRPL-encoded in CLI output, so do not use it as the
  human-readable RLUSD identity check

## Why Issuer Metadata Matters

- trust-line checks depend on the issuer account plus currency code
- payment plans build issued-token `Amount` objects with issuer metadata
- XRPL RLUSD semantics differ from ERC-20 balance transfers

## Operational Notes

- if the issuer or currency is missing from the registry, extend the registry
  instead of inventing values in prompts
- destination-tag handling is counterparty-specific and is not auto-inferred by
  the current CLI
- account existence and trust-line readiness should be checked explicitly when
  planning receive/payment workflows
