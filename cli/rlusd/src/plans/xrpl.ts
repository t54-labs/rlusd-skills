import { isValidAddress } from "xrpl";

import { getPreparePolicy } from "../policy/index.js";
import type { ResolvedAsset } from "../registry/index.js";
import type { PreparedPlanIntent } from "./index.js";

type XrplPlanBuildResult<TParams extends Record<string, string>> = {
  action: string;
  requires_confirmation: boolean;
  human_summary: string;
  params: TParams;
  intent: PreparedPlanIntent;
  warnings: string[];
};

type XrplTrustlinePlanInput = {
  chain: string;
  chainDisplayName: string;
  address: string;
  limit: string;
  asset: ResolvedAsset;
};

type XrplPaymentPlanInput = {
  chain: string;
  chainDisplayName: string;
  from: string;
  fromAddress: string;
  to: string;
  amount: string;
  asset: ResolvedAsset;
};

function normalizeXrplAddress(value: string, label: string): string {
  if (!isValidAddress(value)) {
    throw new Error(`Invalid XRPL address for ${label}: ${value}`);
  }

  return value;
}

function requireXrplAssetMetadata(asset: ResolvedAsset): {
  issuer: string;
  currency: string;
} {
  if (asset.family !== "xrpl" || !asset.issuer || !asset.currency) {
    throw new Error(`Asset ${asset.symbol} is missing XRPL issuer metadata`);
  }

  return {
    issuer: asset.issuer,
    currency: asset.currency
  };
}

const positiveXrplStringNumberPattern =
  /^(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

function validatePositiveIssuedTokenAmount(amount: string, label: string): string {
  const normalizedAmount = amount.trim();
  if (normalizedAmount.length === 0) {
    throw new Error(`${label} is required`);
  }

  if (!positiveXrplStringNumberPattern.test(normalizedAmount)) {
    throw new Error(`${label} must be a valid XRPL string number greater than zero`);
  }

  const [significand] = normalizedAmount.split(/[eE]/);
  const nonZeroDigits = significand?.replace(".", "").replace(/^0+/, "") ?? "";
  if (nonZeroDigits.length === 0) {
    throw new Error(`${label} must be a valid XRPL string number greater than zero`);
  }

  return normalizedAmount;
}

export function buildXrplTrustlinePlan(
  input: XrplTrustlinePlanInput
): XrplPlanBuildResult<{
  address: string;
  limit: string;
}> {
  const account = normalizeXrplAddress(input.address, "address");
  const limit = validatePositiveIssuedTokenAmount(input.limit, "Limit");
  const asset = requireXrplAssetMetadata(input.asset);
  const policy = getPreparePolicy(input.chain, "xrpl.trustline");

  return {
    action: "xrpl.trustline",
    requires_confirmation: policy.requires_confirmation,
    human_summary: `Set RLUSD trust line limit to ${limit} for ${account} on ${input.chainDisplayName}`,
    params: {
      address: account,
      limit
    },
    intent: {
      account,
      transaction_type: "TrustSet",
      tx_json: {
        TransactionType: "TrustSet",
        Account: account,
        LimitAmount: {
          currency: asset.currency,
          issuer: asset.issuer,
          value: limit
        }
      }
    },
    warnings: policy.warnings
  };
}

export function buildXrplPaymentPlan(
  input: XrplPaymentPlanInput
): XrplPlanBuildResult<{
  from: string;
  to: string;
  amount: string;
}> {
  const destination = normalizeXrplAddress(input.to, "to");
  const amount = validatePositiveIssuedTokenAmount(input.amount, "Amount");
  const asset = requireXrplAssetMetadata(input.asset);
  const policy = getPreparePolicy(input.chain, "xrpl.payment");

  return {
    action: "xrpl.payment",
    requires_confirmation: policy.requires_confirmation,
    human_summary: `Send ${amount} RLUSD from ${input.from} to ${destination} on ${input.chainDisplayName}`,
    params: {
      from: input.from,
      to: destination,
      amount
    },
    intent: {
      account: input.fromAddress,
      transaction_type: "Payment",
      tx_json: {
        TransactionType: "Payment",
        Account: input.fromAddress,
        Destination: destination,
        Amount: {
          currency: asset.currency,
          issuer: asset.issuer,
          value: amount
        }
      }
    },
    warnings: policy.warnings
  };
}
