export type PrepareAction =
  | "evm.transfer"
  | "evm.approve"
  | "defi.supply"
  | "xrpl.trustline"
  | "xrpl.payment";

export type PreparePolicy = {
  requires_confirmation: boolean;
  warnings: string[];
};

export function getPreparePolicy(
  chain: string,
  action: PrepareAction
): PreparePolicy {
  const isMainnet = chain.endsWith("mainnet");
  if (!isMainnet) {
    return {
      requires_confirmation: false,
      warnings: []
    };
  }

  switch (action) {
    case "evm.transfer":
      return {
        requires_confirmation: true,
        warnings: ["mainnet", "real_funds"]
      };
    case "evm.approve":
      return {
        requires_confirmation: true,
        warnings: ["mainnet", "token_allowance"]
      };
    case "defi.supply":
      return {
        requires_confirmation: true,
        warnings: ["mainnet", "real_funds", "token_allowance"]
      };
    case "xrpl.trustline":
      return {
        requires_confirmation: true,
        warnings: ["mainnet", "trustline_change"]
      };
    case "xrpl.payment":
      return {
        requires_confirmation: true,
        warnings: ["mainnet", "real_funds"]
      };
  }
}
