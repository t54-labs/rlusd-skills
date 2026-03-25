import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { parseUnits } from "viem";
import { z } from "zod";

const chainSchema = z.object({
  chain: z.string(),
  family: z.enum(["evm", "xrpl"]),
  display_name: z.string(),
  rpc_url_env: z.string().optional(),
  rpc_url: z.string().optional(),
  ws_url: z.string().optional()
});

const assetChainSchema = z.object({
  address: z.string().optional(),
  address_type: z.string().optional(),
  implementation_address: z.string().optional(),
  decimals: z.number().int().nonnegative().optional(),
  issuer: z.string().optional(),
  currency: z.string().optional()
});

const assetSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  chains: z.record(z.string(), assetChainSchema)
});

const previewSwapQuoteSchema = z.object({
  from: z.string(),
  to: z.string(),
  reference_rate: z.string().regex(/^\d+(\.\d+)?$/),
  fee_bps: z.number().int().nonnegative(),
  output_decimals: z.number().int().min(0).max(18).default(6)
});

const previewSupplySchema = z.object({
  asset_symbol: z.string(),
  reference_supply_apy: z.string().regex(/^\d+(\.\d+)?$/),
  collateral_supported: z.boolean(),
  approval_mode: z.string(),
  supply_target_reference: z.string(),
  supply_target_address: z.string()
});

const venueSchema = z.object({
  venue: z.string(),
  chain: z.string(),
  capabilities: z.array(z.string()),
  approval_mode: z.string(),
  collateral_supported: z.boolean(),
  status: z.string(),
  notes: z.array(z.string()),
  preview_swap_quotes: z.array(previewSwapQuoteSchema).default([]),
  preview_supply: previewSupplySchema.optional()
});

export type RegistryChain = z.infer<typeof chainSchema>;
export type RegistryAsset = z.infer<typeof assetSchema>;
export type RegistryVenue = z.infer<typeof venueSchema>;
export type SupplyPreview = {
  venue: string;
  asset_symbol: string;
  amount: string;
  reference_supply_apy: string;
  collateral_supported: boolean;
  approval_mode: string;
  supply_target_reference: string;
  supply_target_address: string;
};

export type RegistryStore = {
  chains: Record<string, RegistryChain>;
  assets: Record<string, RegistryAsset>;
  venues: Record<string, RegistryVenue>;
};

export type ResolvedAsset = {
  symbol: string;
  name: string;
  chain: string;
  family: RegistryChain["family"];
  address?: string;
  address_type?: string;
  implementation_address?: string;
  decimals?: number;
  issuer?: string;
  currency?: string;
};

const DEFAULT_REGISTRY_DIR = fileURLToPath(new URL(".", import.meta.url));

async function loadJsonDirectory<TSchema extends z.ZodType>(
  directoryPath: string,
  schema: TSchema,
  keySelector: (value: z.infer<TSchema>) => string
): Promise<Record<string, z.infer<TSchema>>> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const result: Record<string, z.infer<TSchema>> = {};

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(directoryPath, entry.name);
    const fileContents = await readFile(filePath, "utf8");
    const parsedValue = schema.parse(JSON.parse(fileContents));

    result[keySelector(parsedValue)] = parsedValue;
  }

  return result;
}

export async function loadRegistry(
  registryDir = DEFAULT_REGISTRY_DIR
): Promise<RegistryStore> {
  const chainsDirectory = path.join(registryDir, "chains");
  const assetsDirectory = path.join(registryDir, "assets");
  const venuesDirectory = path.join(registryDir, "venues");

  const [chains, assets, venues] = await Promise.all([
    loadJsonDirectory(chainsDirectory, chainSchema, (value) => value.chain),
    loadJsonDirectory(assetsDirectory, assetSchema, (value) => value.symbol),
    loadJsonDirectory(
      venuesDirectory,
      venueSchema,
      (value) => `${value.chain}:${value.venue}`
    )
  ]);

  return {
    chains,
    assets,
    venues
  };
}

export function resolveChain(
  registry: RegistryStore,
  chain: string
): RegistryChain {
  const chainRecord = registry.chains[chain];
  if (!chainRecord) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  return chainRecord;
}

export function resolveAsset(
  registry: RegistryStore,
  chain: string,
  symbol: string
): ResolvedAsset {
  const chainRecord = resolveChain(registry, chain);

  const assetRecord = registry.assets[symbol];
  if (!assetRecord) {
    throw new Error(`Unknown asset symbol: ${symbol}`);
  }

  const chainAssetMetadata = assetRecord.chains[chain];
  if (!chainAssetMetadata) {
    throw new Error(`${symbol} is not configured for chain ${chain}`);
  }

  const resolvedAsset: ResolvedAsset = {
    symbol: assetRecord.symbol,
    name: assetRecord.name,
    chain: chainRecord.chain,
    family: chainRecord.family
  };

  if (chainAssetMetadata.address !== undefined) {
    resolvedAsset.address = chainAssetMetadata.address;
  }

  if (chainAssetMetadata.address_type !== undefined) {
    resolvedAsset.address_type = chainAssetMetadata.address_type;
  }

  if (chainAssetMetadata.implementation_address !== undefined) {
    resolvedAsset.implementation_address =
      chainAssetMetadata.implementation_address;
  }

  if (chainAssetMetadata.decimals !== undefined) {
    resolvedAsset.decimals = chainAssetMetadata.decimals;
  }

  if (chainAssetMetadata.issuer !== undefined) {
    resolvedAsset.issuer = chainAssetMetadata.issuer;
  }

  if (chainAssetMetadata.currency !== undefined) {
    resolvedAsset.currency = chainAssetMetadata.currency;
  }

  return resolvedAsset;
}

export function listVenues(
  registry: RegistryStore,
  input: {
    chain: string;
    capabilities?: string[];
  }
): RegistryVenue[] {
  const requestedCapabilities = new Set(
    (input.capabilities ?? []).filter((capability) => capability.length > 0)
  );

  return Object.values(registry.venues)
    .filter((venue) => venue.chain === input.chain)
    .filter((venue) => {
      if (requestedCapabilities.size === 0) {
        return true;
      }

      return venue.capabilities.some((capability) =>
        requestedCapabilities.has(capability)
      );
    })
    .sort((left, right) => left.venue.localeCompare(right.venue));
}

function formatFixedUnits(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(decimals, "0");
  return `${whole.toString()}.${fraction}`;
}

const DEFI_PREVIEW_CALCULATION_DECIMALS = 18;

function scalePreviewOutput(
  value: bigint,
  outputDecimals: number
): bigint {
  const scaleDifference = DEFI_PREVIEW_CALCULATION_DECIMALS - outputDecimals;
  if (scaleDifference <= 0) {
    return value;
  }

  return value / 10n ** BigInt(scaleDifference);
}

function quotePreviewAmount(
  amount: string,
  rate: string,
  outputDecimals: number
): {
  amount_out: string;
  output_units_for_sort: bigint;
} {
  const inputUnits = parseUnits(amount, DEFI_PREVIEW_CALCULATION_DECIMALS);
  const rateUnits = parseUnits(rate, DEFI_PREVIEW_CALCULATION_DECIMALS);
  const outputUnits =
    (inputUnits * rateUnits) /
    10n ** BigInt(DEFI_PREVIEW_CALCULATION_DECIMALS);
  const scaledOutputUnits = scalePreviewOutput(outputUnits, outputDecimals);

  return {
    amount_out: formatFixedUnits(scaledOutputUnits, outputDecimals),
    output_units_for_sort: outputUnits
  };
}

export function findBestSwapQuote(
  registry: RegistryStore,
  input: {
    chain: string;
    from: string;
    to: string;
    amount: string;
  }
): {
  venue: string;
  pricing_source: "reference_preview";
  rate: string;
  reference_rate_is_net_of_fee: true;
  amount_out: string;
  amount_out_is_net_of_fee: true;
  fee_bps: number;
  considered_venues: string[];
} | null {
  const matchingQuotes = listVenues(registry, {
    chain: input.chain,
    capabilities: ["swap"]
  })
    .map((venue) => {
      const previewQuote = venue.preview_swap_quotes.find(
        (quote) => quote.from === input.from && quote.to === input.to
      );

      if (!previewQuote) {
        return null;
      }

      const previewAmount = quotePreviewAmount(
        input.amount,
        previewQuote.reference_rate,
        previewQuote.output_decimals
      );

      return {
        venue: venue.venue,
        pricing_source: "reference_preview" as const,
        rate: previewQuote.reference_rate,
        amount_out: previewAmount.amount_out,
        amount_out_is_net_of_fee: true as const,
        fee_bps: previewQuote.fee_bps,
        output_units_for_sort: previewAmount.output_units_for_sort
      };
    })
    .filter((quote): quote is NonNullable<typeof quote> => quote !== null)
    .sort((left, right) => {
      if (left.output_units_for_sort === right.output_units_for_sort) {
        return left.venue.localeCompare(right.venue);
      }

      return right.output_units_for_sort > left.output_units_for_sort ? 1 : -1;
    });

  if (matchingQuotes.length === 0) {
    return null;
  }

  const bestQuote = matchingQuotes[0];
  if (!bestQuote) {
    return null;
  }

  return {
    venue: bestQuote.venue,
    pricing_source: bestQuote.pricing_source,
    rate: bestQuote.rate,
    reference_rate_is_net_of_fee: true,
    amount_out: bestQuote.amount_out,
    amount_out_is_net_of_fee: bestQuote.amount_out_is_net_of_fee,
    fee_bps: bestQuote.fee_bps,
    considered_venues: matchingQuotes.map((quote) => quote.venue)
  };
}

export function findSupplyPreview(
  registry: RegistryStore,
  input: {
    chain: string;
    venue: string;
    amount: string;
  }
): SupplyPreview | null {
  const venue = registry.venues[`${input.chain}:${input.venue}`];
  if (!venue || !venue.preview_supply) {
    return null;
  }

  return {
    venue: venue.venue,
    asset_symbol: venue.preview_supply.asset_symbol,
    amount: input.amount,
    reference_supply_apy: venue.preview_supply.reference_supply_apy,
    collateral_supported: venue.preview_supply.collateral_supported,
    approval_mode: venue.preview_supply.approval_mode,
    supply_target_reference: venue.preview_supply.supply_target_reference,
    supply_target_address: venue.preview_supply.supply_target_address
  };
}
