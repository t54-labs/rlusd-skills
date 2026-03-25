import { encodeFunctionData, parseAbi, parseUnits } from "viem";

import { getPreparePolicy } from "../policy/index.js";
import type { ResolvedAsset } from "../registry/index.js";
import type { PreparedPlanIntent } from "./index.js";

type DefiSupplyPlanInput = {
  chain: string;
  chainDisplayName: string;
  venue: string;
  from: string;
  fromAddress: string;
  amount: string;
  asset: ResolvedAsset;
  preview: {
    asset_symbol: string;
    reference_supply_apy: string;
    collateral_supported: boolean;
    approval_mode: string;
    supply_target_reference: string;
    supply_target_address: string;
  };
};

type DefiSupplyPlanResult = {
  action: string;
  requires_confirmation: boolean;
  human_summary: string;
  params: {
    venue: string;
    from: string;
    amount: string;
  };
  intent: PreparedPlanIntent;
  warnings: string[];
};

const erc20ApproveAbi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)"
]);

const aavePoolAbi = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"
]);

function requireAssetDecimals(asset: ResolvedAsset): number {
  if (asset.decimals === undefined) {
    throw new Error(`Asset ${asset.symbol} is missing decimals metadata`);
  }

  return asset.decimals;
}

function parseAmountRaw(amount: string, decimals: number): bigint {
  const normalizedAmount = amount.trim();
  if (normalizedAmount.length === 0) {
    throw new Error("Amount is required");
  }

  const rawAmount = parseUnits(normalizedAmount, decimals);
  if (rawAmount <= 0n) {
    throw new Error("Amount must be greater than zero");
  }

  return rawAmount;
}

export function buildDefiSupplyPlan(
  input: DefiSupplyPlanInput
): DefiSupplyPlanResult {
  const rawAmount = parseAmountRaw(input.amount, requireAssetDecimals(input.asset));
  const policy = getPreparePolicy(input.chain, "defi.supply");
  const warnings = [
    ...policy.warnings,
    "not_live_market_data",
    "preview_only"
  ];

  if (!input.preview.collateral_supported) {
    warnings.push("collateral_unsupported");
  }

  return {
    action: "defi.supply",
    requires_confirmation: policy.requires_confirmation,
    human_summary: `Supply ${input.amount} ${input.preview.asset_symbol} to ${input.venue} from ${input.from} on ${input.chainDisplayName}`,
    params: {
      venue: input.venue,
      from: input.from,
      amount: input.amount
    },
    intent: {
      venue: input.venue,
      steps: [
        {
          step: "approve",
          approval_mode: input.preview.approval_mode,
          spender_reference: input.preview.supply_target_reference,
          spender_address: input.preview.supply_target_address,
          token_address: input.asset.address,
          value: "0",
          data: encodeFunctionData({
            abi: erc20ApproveAbi,
            functionName: "approve",
            args: [input.preview.supply_target_address as `0x${string}`, rawAmount]
          }),
          amount_raw: rawAmount.toString()
        },
        {
          step: "supply",
          protocol: input.venue,
          asset_symbol: input.preview.asset_symbol,
          asset_address: input.asset.address,
          pool_address: input.preview.supply_target_address,
          value: "0",
          data: encodeFunctionData({
            abi: aavePoolAbi,
            functionName: "supply",
            args: [
              input.asset.address as `0x${string}`,
              rawAmount,
              input.fromAddress as `0x${string}`,
              0
            ]
          }),
          amount_raw: rawAmount.toString(),
          on_behalf_of_address: input.fromAddress,
          referral_code: 0,
          collateral_supported: input.preview.collateral_supported,
          reference_supply_apy: input.preview.reference_supply_apy
        }
      ]
    },
    warnings
  };
}
