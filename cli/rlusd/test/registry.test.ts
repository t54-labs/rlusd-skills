import { describe, expect, test } from "vitest";

import { loadRegistry, resolveAsset } from "../src/registry/index.js";

describe("registry", () => {
  test("resolves RLUSD Ethereum mainnet proxy metadata", async () => {
    const registry = await loadRegistry();

    expect(resolveAsset(registry, "ethereum-mainnet", "RLUSD")).toMatchObject({
      symbol: "RLUSD",
      chain: "ethereum-mainnet",
      family: "evm",
      address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
      address_type: "proxy",
      decimals: 18
    });
  });

  test("resolves RLUSD XRPL issuer metadata", async () => {
    const registry = await loadRegistry();

    expect(resolveAsset(registry, "xrpl-mainnet", "RLUSD")).toMatchObject({
      symbol: "RLUSD",
      chain: "xrpl-mainnet",
      family: "xrpl",
      issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
      currency: "RLUSD"
    });
  });
});
