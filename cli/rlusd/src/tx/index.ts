import { createPublicClient, http, type Hex } from "viem";
import { Client } from "xrpl";

import type { RegistryChain } from "../registry/index.js";

export type EvmTransactionStatus = {
  transaction_hash: `0x${string}`;
  status: "success" | "reverted";
  block_number: number;
  confirmations?: number;
};

export type XrplTransactionStatus = {
  transaction_hash: string;
  validated: boolean;
  result: string;
  ledger_index: number;
};

export type XrplPaymentReceipt = XrplTransactionStatus & {
  destination: string;
  amount: Record<string, string> | string;
};

export interface TransactionMonitor {
  waitForEvmTransaction(input: {
    chain: string;
    chainConfig: RegistryChain;
    hash: `0x${string}`;
  }): Promise<EvmTransactionStatus>;
  getEvmReceipt(input: {
    chain: string;
    chainConfig: RegistryChain;
    hash: `0x${string}`;
  }): Promise<EvmTransactionStatus>;
  waitForXrplTransaction(input: {
    chain: string;
    chainConfig: RegistryChain;
    hash: string;
  }): Promise<XrplTransactionStatus>;
  getXrplPaymentReceipt(input: {
    chain: string;
    chainConfig: RegistryChain;
    hash: string;
  }): Promise<XrplPaymentReceipt>;
}

function getEvmRpcUrl(
  chainConfig: RegistryChain,
  env: Record<string, string | undefined>
): string {
  if (chainConfig.family !== "evm") {
    throw new Error(`Chain ${chainConfig.chain} is not an EVM network`);
  }

  if (!chainConfig.rpc_url_env) {
    throw new Error(`Chain ${chainConfig.chain} is missing rpc_url_env metadata.`);
  }

  const rpcUrl = env[chainConfig.rpc_url_env];
  if (!rpcUrl) {
    throw new Error(
      `Environment variable ${chainConfig.rpc_url_env} is required for ${chainConfig.chain}.`
    );
  }

  return rpcUrl;
}

function getXrplWsUrl(chainConfig: RegistryChain): string {
  if (chainConfig.family !== "xrpl") {
    throw new Error(`Chain ${chainConfig.chain} is not an XRPL network`);
  }

  if (!chainConfig.ws_url) {
    throw new Error(`Chain ${chainConfig.chain} is missing ws_url metadata.`);
  }

  return chainConfig.ws_url;
}

function toEvmStatus(status: string): "success" | "reverted" {
  return status === "success" ? "success" : "reverted";
}

function toXrplStatus(result: {
  hash?: string;
  validated?: boolean;
  meta?: {
    TransactionResult?: string;
  };
  ledger_index?: number;
}): XrplTransactionStatus {
  return {
    transaction_hash: result.hash ?? "",
    validated: result.validated === true,
    result: result.meta?.TransactionResult ?? "unknown",
    ledger_index:
      typeof result.ledger_index === "number" ? result.ledger_index : 0
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createTransactionMonitor(
  env: Record<string, string | undefined> = process.env
): TransactionMonitor {
  return {
    async waitForEvmTransaction(input) {
      const client = createPublicClient({
        transport: http(getEvmRpcUrl(input.chainConfig, env))
      });
      const receipt = await client.waitForTransactionReceipt({
        hash: input.hash as Hex
      });
      const latestBlock = await client.getBlockNumber();

      return {
        transaction_hash: receipt.transactionHash,
        status: toEvmStatus(receipt.status),
        block_number: Number(receipt.blockNumber),
        confirmations: Number(latestBlock - receipt.blockNumber + 1n)
      };
    },

    async getEvmReceipt(input) {
      const client = createPublicClient({
        transport: http(getEvmRpcUrl(input.chainConfig, env))
      });
      const receipt = await client.getTransactionReceipt({
        hash: input.hash as Hex
      });

      return {
        transaction_hash: receipt.transactionHash,
        status: toEvmStatus(receipt.status),
        block_number: Number(receipt.blockNumber)
      };
    },

    async waitForXrplTransaction(input) {
      const client = new Client(getXrplWsUrl(input.chainConfig));
      await client.connect();

      try {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          try {
            const response = await client.request({
              command: "tx",
              transaction: input.hash
            });
            const result = response.result as {
              hash?: string;
              validated?: boolean;
              meta?: { TransactionResult?: string };
              ledger_index?: number;
            };

            if (result.validated) {
              return toXrplStatus(result);
            }
          } catch {
            // Retry until the timeout below.
          }

          await sleep(1000);
        }

        throw new Error(`XRPL transaction ${input.hash} was not validated in time.`);
      } finally {
        await client.disconnect();
      }
    },

    async getXrplPaymentReceipt(input) {
      const client = new Client(getXrplWsUrl(input.chainConfig));
      await client.connect();

      try {
        const response = await client.request({
          command: "tx",
          transaction: input.hash
        });
        const result = response.result as {
          hash?: string;
          validated?: boolean;
          meta?: {
            TransactionResult?: string;
            delivered_amount?: Record<string, string> | string;
          };
          ledger_index?: number;
          tx_json?: {
            Destination?: string;
            Amount?: Record<string, string> | string;
          };
        };

        return {
          ...toXrplStatus(result),
          destination: result.tx_json?.Destination ?? "",
          amount: result.meta?.delivered_amount ?? result.tx_json?.Amount ?? ""
        };
      } finally {
        await client.disconnect();
      }
    }
  };
}
