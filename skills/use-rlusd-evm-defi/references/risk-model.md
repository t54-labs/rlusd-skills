# DeFi Risk Model

## Current Warning Posture

The current DeFi batch is intentionally conservative. Preview and action flows
surface explicit warnings that should be treated as decision inputs.

Common warnings:

- `quote_expires`
- `preview_only`
- `collateral_unsupported`

## What Those Warnings Mean

- `quote_expires`: the quote is live but only valid for a short window
- `preview_only`: the result is informational and should not be treated as an
  execution guarantee
- `collateral_unsupported`: the current preview marks RLUSD as not supported as
  collateral for that route

## Current Product Limits

- swap execution is available through prepared plans on supported venues
- Curve LP execution is available through prepared plans on `ethereum-mainnet`
- supply execution is `aave`-only
- preview venue metadata is still curated and narrow in scope

## Operator Guidance

- treat quote output as expiring market data, not a standing execution guarantee
- review stored DeFi plan steps before execution
- do not infer venue safety from brand familiarity alone
- avoid describing unsupported flows like borrow or generic vault actions as
  available when the current execution surface is limited to venue-specific
  swap, Curve LP, and Aave supply flows
