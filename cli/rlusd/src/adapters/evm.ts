import {
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  parseAbi
} from "viem";

import type {
  EvmAllowanceInput,
  EvmBalanceInput,
  EvmReadAdapter
} from "./types.js";

const erc20ReadAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
]);

function normalizeEvmAddress(value: string, label: string): `0x${string}` {
  if (!isAddress(value)) {
    throw new Error(`Invalid EVM address for ${label}: ${value}`);
  }

  return value;
}

function getRpcUrl(
  chainConfig: EvmBalanceInput["chainConfig"],
  env: NodeJS.ProcessEnv
): string {
  if (chainConfig.family !== "evm") {
    throw new Error(`Chain ${chainConfig.chain} is not an EVM network`);
  }

  if (!chainConfig.rpc_url_env) {
    throw new Error(`Chain ${chainConfig.chain} is missing rpc_url_env`);
  }

  const rpcUrl = env[chainConfig.rpc_url_env];
  if (!rpcUrl) {
    throw new Error(
      `Environment variable ${chainConfig.rpc_url_env} is required for ${chainConfig.chain}`
    );
  }

  return rpcUrl;
}

function getAssetAddress(input: EvmBalanceInput | EvmAllowanceInput): `0x${string}` {
  if (!input.asset.address) {
    throw new Error(`Asset ${input.asset.symbol} has no EVM token address`);
  }

  return normalizeEvmAddress(input.asset.address, "asset");
}

export function createViemReadAdapter(
  env: NodeJS.ProcessEnv = process.env
): EvmReadAdapter {
  return {
    async balance(input) {
      const client = createPublicClient({
        transport: http(getRpcUrl(input.chainConfig, env))
      });

      const value = await client.readContract({
        abi: erc20ReadAbi,
        address: getAssetAddress(input),
        functionName: "balanceOf",
        args: [normalizeEvmAddress(input.address, "address")]
      });

      return {
        raw: value.toString(),
        formatted: formatUnits(value, input.asset.decimals ?? 18)
      };
    },

    async allowance(input) {
      const client = createPublicClient({
        transport: http(getRpcUrl(input.chainConfig, env))
      });

      const value = await client.readContract({
        abi: erc20ReadAbi,
        address: getAssetAddress(input),
        functionName: "allowance",
        args: [
          normalizeEvmAddress(input.owner, "owner"),
          normalizeEvmAddress(input.spender, "spender")
        ]
      });

      return {
        raw: value.toString(),
        formatted: formatUnits(value, input.asset.decimals ?? 18)
      };
    }
  };
}
