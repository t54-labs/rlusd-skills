import { readFile } from "node:fs/promises";
import path from "node:path";

import { createWalletClient, http, isAddress, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Client, isValidAddress, Wallet } from "xrpl";
import { z } from "zod";

import type { RegistryChain } from "../registry/index.js";

const walletConfigSchema = z.object({
  wallets: z.record(
    z.string(),
    z.object({
      chain: z.string(),
      address: z.string(),
      signer: z.string()
    })
  )
});

export type EvmExecutionRequest = {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
};

export type ResolvedEvmSigner = {
  address: `0x${string}`;
  kind: string;
  sendTransaction(
    request: EvmExecutionRequest
  ): Promise<`0x${string}`>;
};

export type XrplExecutionRequest = {
  tx_json: Record<string, unknown>;
};

export type ResolvedXrplSigner = {
  address: string;
  kind: string;
  sendTransaction(request: XrplExecutionRequest): Promise<string>;
};

export interface WalletResolver {
  resolveEvmAddress(input: {
    sender: string;
    chain: RegistryChain;
  }): Promise<`0x${string}`>;
  resolveXrplAddress(input: {
    sender: string;
    chain: RegistryChain;
  }): Promise<string>;
  resolveEvmSigner(input: {
    sender: string;
    chain: RegistryChain;
  }): Promise<ResolvedEvmSigner>;
  resolveXrplSigner(input: {
    sender: string;
    chain: RegistryChain;
  }): Promise<ResolvedXrplSigner>;
}

type CreateWalletResolverOptions = {
  env?: Record<string, string | undefined>;
  configPath?: string;
};

function getDefaultConfigPath(): string {
  return path.resolve(process.cwd(), ".rlusd", "config.json");
}

function normalizeAddress(
  value: string,
  label: string
): `0x${string}` {
  if (!isAddress(value)) {
    throw new Error(`Invalid EVM address for ${label}: ${value}`);
  }

  return value;
}

function requireWalletAlias(sender: string): string {
  if (!sender.startsWith("wallet:")) {
    throw new Error("Sender must be a configured wallet alias.");
  }

  return sender.slice("wallet:".length);
}

function normalizeXrplAddress(value: string, label: string): string {
  if (!isValidAddress(value)) {
    throw new Error(`Invalid XRPL address for ${label}: ${value}`);
  }

  return value;
}

async function loadWalletConfig(configPath: string) {
  const fileContents = await readFile(configPath, "utf8");
  return walletConfigSchema.parse(JSON.parse(fileContents));
}

type LoadedWalletConfig = Awaited<ReturnType<typeof loadWalletConfig>>;

function findConfiguredWallet(
  config: LoadedWalletConfig,
  sender: string,
  chain: RegistryChain
) {
  if (sender.startsWith("wallet:")) {
    const alias = requireWalletAlias(sender);
    const walletEntry = config.wallets[alias];
    if (!walletEntry) {
      throw new Error(`Wallet alias "${alias}" is not configured.`);
    }

    return {
      alias,
      walletEntry
    };
  }

  const matchingEntry = Object.entries(config.wallets).find(
    ([, walletEntry]) =>
      walletEntry.chain === chain.chain &&
      (chain.family === "xrpl"
        ? walletEntry.address === sender
        : walletEntry.address.toLowerCase() === sender.toLowerCase())
  );

  if (!matchingEntry) {
    throw new Error(
      `No configured wallet matches address "${sender}" on ${chain.chain}.`
    );
  }

  return {
    alias: matchingEntry[0],
    walletEntry: matchingEntry[1]
  };
}

export function createWalletResolver(
  options: CreateWalletResolverOptions = {}
): WalletResolver {
  const env = options.env ?? process.env;
  const configPath = options.configPath ?? getDefaultConfigPath();

  return {
    async resolveEvmAddress(input) {
      if (input.chain.family !== "evm") {
        throw new Error(`Chain ${input.chain.chain} is not an EVM network`);
      }

      if (!input.sender.startsWith("wallet:")) {
        return normalizeAddress(input.sender, "sender");
      }

      const config = await loadWalletConfig(configPath);
      const { alias, walletEntry } = findConfiguredWallet(
        config,
        input.sender,
        input.chain
      );

      if (walletEntry.chain !== input.chain.chain) {
        throw new Error(
          `Wallet alias "${alias}" is configured for ${walletEntry.chain}, not ${input.chain.chain}.`
        );
      }

      return normalizeAddress(walletEntry.address, "wallet");
    },

    async resolveXrplAddress(input) {
      if (input.chain.family !== "xrpl") {
        throw new Error(`Chain ${input.chain.chain} is not an XRPL network`);
      }

      if (!input.sender.startsWith("wallet:")) {
        return normalizeXrplAddress(input.sender, "sender");
      }

      const config = await loadWalletConfig(configPath);
      const { alias, walletEntry } = findConfiguredWallet(
        config,
        input.sender,
        input.chain
      );

      if (walletEntry.chain !== input.chain.chain) {
        throw new Error(
          `Wallet alias "${alias}" is configured for ${walletEntry.chain}, not ${input.chain.chain}.`
        );
      }

      return normalizeXrplAddress(walletEntry.address, "wallet");
    },

    async resolveEvmSigner(input) {
      if (input.chain.family !== "evm") {
        throw new Error(`Chain ${input.chain.chain} is not an EVM network`);
      }

      const config = await loadWalletConfig(configPath);
      const { alias, walletEntry } = findConfiguredWallet(
        config,
        input.sender,
        input.chain
      );

      if (walletEntry.chain !== input.chain.chain) {
        throw new Error(
          `Wallet alias "${alias}" is configured for ${walletEntry.chain}, not ${input.chain.chain}.`
        );
      }

      const configuredAddress = normalizeAddress(walletEntry.address, "wallet");

      if (!walletEntry.signer.startsWith("env:")) {
        throw new Error(
          `Wallet alias "${alias}" uses unsupported signer reference "${walletEntry.signer}".`
        );
      }

      const envName = walletEntry.signer.slice("env:".length);
      const privateKey = env[envName];
      if (!privateKey) {
        throw new Error(
          `Environment variable ${envName} is required for wallet alias "${alias}".`
        );
      }

      const account = privateKeyToAccount(privateKey as Hex);
      if (account.address.toLowerCase() !== configuredAddress.toLowerCase()) {
        throw new Error(
          `Wallet alias "${alias}" address does not match the configured signer key.`
        );
      }

      return {
        address: account.address,
        kind: "local_key",
        async sendTransaction(request) {
          if (!input.chain.rpc_url_env) {
            throw new Error(
              `Chain ${input.chain.chain} is missing rpc_url_env metadata.`
            );
          }

          const rpcUrl = env[input.chain.rpc_url_env];
          if (!rpcUrl) {
            throw new Error(
              `Environment variable ${input.chain.rpc_url_env} is required for ${input.chain.chain}.`
            );
          }

          const walletClient = createWalletClient({
            account,
            transport: http(rpcUrl)
          });

          return walletClient.sendTransaction({
            account,
            chain: undefined,
            to: request.to,
            data: request.data,
            value: request.value
          });
        }
      };
    },

    async resolveXrplSigner(input) {
      if (input.chain.family !== "xrpl") {
        throw new Error(`Chain ${input.chain.chain} is not an XRPL network`);
      }

      const config = await loadWalletConfig(configPath);
      const { alias, walletEntry } = findConfiguredWallet(
        config,
        input.sender,
        input.chain
      );

      if (walletEntry.chain !== input.chain.chain) {
        throw new Error(
          `Wallet alias "${alias}" is configured for ${walletEntry.chain}, not ${input.chain.chain}.`
        );
      }

      const configuredAddress = normalizeXrplAddress(walletEntry.address, "wallet");

      if (!walletEntry.signer.startsWith("env:")) {
        throw new Error(
          `Wallet alias "${alias}" uses unsupported signer reference "${walletEntry.signer}".`
        );
      }

      const envName = walletEntry.signer.slice("env:".length);
      const seed = env[envName];
      if (!seed) {
        throw new Error(
          `Environment variable ${envName} is required for wallet alias "${alias}".`
        );
      }

      const wallet = Wallet.fromSeed(seed);
      if (wallet.classicAddress !== configuredAddress) {
        throw new Error(
          `Wallet alias "${alias}" address does not match the configured signer seed.`
        );
      }

      return {
        address: wallet.classicAddress,
        kind: "local_key",
        async sendTransaction(request) {
          if (!input.chain.ws_url) {
            throw new Error(
              `Chain ${input.chain.chain} is missing ws_url metadata.`
            );
          }

          const client = new Client(input.chain.ws_url);
          await client.connect();

          try {
            const autofilled = await client.autofill(request.tx_json as never);
            const signed = wallet.sign(autofilled);
            await client.submit(signed.tx_blob);
            return signed.hash;
          } finally {
            await client.disconnect();
          }
        }
      };
    }
  };
}
