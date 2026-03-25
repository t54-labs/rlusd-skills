# DeFi Risk Model

## Current Warning Posture

The current DeFi batch is intentionally conservative. Preview and action flows
surface explicit warnings that should be treated as decision inputs.

Common warnings:

- `not_live_market_data`
- `preview_only`
- `collateral_unsupported`

## What Those Warnings Mean

- `not_live_market_data`: the quote or preview comes from curated registry data
- `preview_only`: the result is informational and should not be treated as an
  execution guarantee
- `collateral_unsupported`: the current preview marks RLUSD as not supported as
  collateral for that route

## Current Product Limits

- swap execution is not implemented
- supply execution is `aave`-only
- live routing adapters are not implemented yet
- preview venue metadata is marked experimental

## Operator Guidance

- treat preview output as planning support, not a trading oracle
- review stored DeFi plan steps before execution
- do not infer venue safety from brand familiarity alone
- avoid describing unsupported flows like borrow, LP execution, or vault actions
  as available when only preview/discovery exists
