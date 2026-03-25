# DeFi Routing

## Venue Discovery

```bash
rlusd defi venues --chain ethereum-mainnet --capability swap,lend,lp --json
```

Capability filtering is inclusive. A venue is returned when it supports any
requested capability, not necessarily all of them.

## Swap Quote Selection

```bash
rlusd defi quote swap --chain ethereum-mainnet --from RLUSD --to USDC --amount 1000 --json
```

Current quote behavior:

- the CLI inspects venues advertising `swap`
- it selects the route with the best computed preview output
- output is derived from registry `reference_rate` data, not live market reads
- the result includes the selected route plus `considered_venues`

## Supply Routing

```bash
rlusd defi supply preview --chain ethereum-mainnet --venue aave --amount 5000 --json
rlusd defi supply prepare --chain ethereum-mainnet --venue aave --from wallet:ops --amount 5000 --json
```

Current supply routing is narrow:

- only venues with the `lend` capability can be previewed/prepared
- `aave` is the only bundled supply execution path
- the stored plan expands into `approve` then `supply`
