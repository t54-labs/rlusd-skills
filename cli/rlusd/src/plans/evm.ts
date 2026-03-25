import {
  encodeFunctionData,
  isAddress,
  parseAbi,
  parseUnits
} from "viem";

import { getPreparePolicy } from "../policy/index.js";
import type { ResolvedAsset } from "../registry/index.js";
import type { PreparedPlanIntent } from "./index.js";

const erc20WriteAbi = parseAbi([
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)"
]);

type EvmPlanBuildResult<TParams extends Record<string, string>> = {
  action: string;
  requires_confirmation: boolean;
  human_summary: string;
  params: TParams;
  intent: PreparedPlanIntent;
  warnings: string[];
};

type EvmTransferPlanInput = {
  chain: string;
  chainDisplayName: string;
  from: string;
  to: string;
  amount: string;
  asset: ResolvedAsset;
};

type EvmApprovePlanInput = {
  chain: string;
  chainDisplayName: string;
  owner: string;
  spender: string;
  amount: string;
  asset: ResolvedAsset;
};

function normalizeEvmAddress(value: string, label: string): `0x${string}` {
  if (!isAddress(value)) {
    throw new Error(`Invalid EVM address for ${label}: ${value}`);
  }

  return value;
}

function requireEvmAssetAddress(asset: ResolvedAsset): `0x${string}` {
  if (asset.family !== "evm" || !asset.address) {
    throw new Error(`Asset ${asset.symbol} is missing EVM token metadata`);
  }

  return normalizeEvmAddress(asset.address, "asset");
}

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

export function buildEvmTransferPlan(
  input: EvmTransferPlanInput
): EvmPlanBuildResult<{
  from: string;
  to: string;
  amount: string;
}> {
  const tokenAddress = requireEvmAssetAddress(input.asset);
  const recipient = normalizeEvmAddress(input.to, "to");
  const rawAmount = parseAmountRaw(input.amount, requireAssetDecimals(input.asset));
  const policy = getPreparePolicy(input.chain, "evm.transfer");

  return {
    action: "evm.transfer",
    requires_confirmation: policy.requires_confirmation,
    human_summary: `Transfer ${input.amount} RLUSD from ${input.from} to ${recipient} on ${input.chainDisplayName}`,
    params: {
      from: input.from,
      to: recipient,
      amount: input.amount
    },
    intent: {
      to: tokenAddress,
      value: "0",
      function_name: "transfer",
      args: {
        to: recipient,
        amount_raw: rawAmount.toString()
      },
      data: encodeFunctionData({
        abi: erc20WriteAbi,
        functionName: "transfer",
        args: [recipient, rawAmount]
      })
    },
    warnings: policy.warnings
  };
}

export function buildEvmApprovePlan(
  input: EvmApprovePlanInput
): EvmPlanBuildResult<{
  owner: string;
  spender: string;
  amount: string;
}> {
  const tokenAddress = requireEvmAssetAddress(input.asset);
  const spender = normalizeEvmAddress(input.spender, "spender");
  const rawAmount = parseAmountRaw(input.amount, requireAssetDecimals(input.asset));
  const policy = getPreparePolicy(input.chain, "evm.approve");

  return {
    action: "evm.approve",
    requires_confirmation: policy.requires_confirmation,
    human_summary: `Approve ${input.amount} RLUSD from ${input.owner} for ${spender} on ${input.chainDisplayName}`,
    params: {
      owner: input.owner,
      spender,
      amount: input.amount
    },
    intent: {
      to: tokenAddress,
      value: "0",
      function_name: "approve",
      args: {
        spender,
        amount_raw: rawAmount.toString()
      },
      data: encodeFunctionData({
        abi: erc20WriteAbi,
        functionName: "approve",
        args: [spender, rawAmount]
      })
    },
    warnings: policy.warnings
  };
}
