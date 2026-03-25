import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Wallet } from "xrpl";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, test } from "vitest";

import { createWalletResolver } from "../src/wallets/index.js";

describe("wallet resolver", () => {
  test("resolves a configured wallet alias to a local-key signer", async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), "rlusd-wallet-config-"));
    const configPath = path.join(configDir, "config.json");
    const privateKey =
      "0x59c6995e998f97a5a0044966f0945382d7f5b4f8b41dfe0fcb5d3b8b8b6d7c3d";
    const account = privateKeyToAccount(privateKey);

    await writeFile(
      configPath,
      JSON.stringify(
        {
          wallets: {
            ops: {
              chain: "ethereum-mainnet",
              address: account.address,
              signer: "env:OPS_PRIVATE_KEY"
            }
          }
        },
        null,
        2
      )
    );

    const resolver = createWalletResolver({
      configPath,
      env: {
        OPS_PRIVATE_KEY: privateKey
      }
    });

    const signer = await resolver.resolveEvmSigner({
      sender: "wallet:ops",
      chain: {
        chain: "ethereum-mainnet",
        family: "evm",
        display_name: "Ethereum Mainnet",
        rpc_url_env: "ETHEREUM_MAINNET_RPC_URL"
      }
    });

    expect(signer.address).toBe(account.address);
    expect(signer.kind).toBe("local_key");
  });

  test("resolves a configured XRPL wallet by address to a local-key signer", async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), "rlusd-wallet-config-"));
    const configPath = path.join(configDir, "config.json");
    const seed = "ssZkdwURFMBXenJPbrpE14b6noJSu";
    const wallet = Wallet.fromSeed(seed);

    await writeFile(
      configPath,
      JSON.stringify(
        {
          wallets: {
            treasury: {
              chain: "xrpl-mainnet",
              address: wallet.classicAddress,
              signer: "env:XRPL_MAINNET_SEED"
            }
          }
        },
        null,
        2
      )
    );

    const resolver = createWalletResolver({
      configPath,
      env: {
        XRPL_MAINNET_SEED: seed
      }
    });

    const resolvedAddress = await resolver.resolveXrplAddress({
      sender: "wallet:treasury",
      chain: {
        chain: "xrpl-mainnet",
        family: "xrpl",
        display_name: "XRPL Mainnet",
        ws_url: "wss://xrplcluster.com"
      }
    });

    const signer = await resolver.resolveXrplSigner({
      sender: wallet.classicAddress,
      chain: {
        chain: "xrpl-mainnet",
        family: "xrpl",
        display_name: "XRPL Mainnet",
        ws_url: "wss://xrplcluster.com"
      }
    });

    expect(resolvedAddress).toBe(wallet.classicAddress);
    expect(signer.address).toBe(wallet.classicAddress);
    expect(signer.kind).toBe("local_key");
  });
});
