import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

describe("evm read commands", () => {
  test("prints a JSON RLUSD balance envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "balance",
        "--chain",
        "ethereum-mainnet",
        "--address",
        "0x0000000000000000000000000000000000000001",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T21:00:00.000Z",
        adapters: {
          evm: {
            balance: async (input) => {
              expect(input.chain).toBe("ethereum-mainnet");
              expect(input.address).toBe(
                "0x0000000000000000000000000000000000000001"
              );
              expect(input.asset.symbol).toBe("RLUSD");
              expect(input.asset.address_type).toBe("proxy");

              return {
                raw: "42000000000000000000",
                formatted: "42"
              };
            },
            allowance: async () => {
              throw new Error("unexpected allowance call");
            }
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "evm.balance",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T21:00:00.000Z",
      data: {
        address: "0x0000000000000000000000000000000000000001",
        asset: {
          symbol: "RLUSD",
          address_type: "proxy",
          decimals: 18
        },
        balance: {
          raw: "42000000000000000000",
          formatted: "42"
        }
      }
    });
  });

  test("prints a JSON RLUSD allowance envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "allowance",
        "--chain",
        "ethereum-mainnet",
        "--owner",
        "0x0000000000000000000000000000000000000001",
        "--spender",
        "0x0000000000000000000000000000000000000002",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T21:05:00.000Z",
        adapters: {
          evm: {
            balance: async () => {
              throw new Error("unexpected balance call");
            },
            allowance: async (input) => {
              expect(input.chain).toBe("ethereum-mainnet");
              expect(input.owner).toBe(
                "0x0000000000000000000000000000000000000001"
              );
              expect(input.spender).toBe(
                "0x0000000000000000000000000000000000000002"
              );
              expect(input.asset.symbol).toBe("RLUSD");

              return {
                raw: "500000000000000000000",
                formatted: "500"
              };
            }
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "evm.allowance",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T21:05:00.000Z",
      data: {
        owner: "0x0000000000000000000000000000000000000001",
        spender: "0x0000000000000000000000000000000000000002",
        asset: {
          symbol: "RLUSD",
          address_type: "proxy"
        },
        allowance: {
          raw: "500000000000000000000",
          formatted: "500"
        }
      }
    });
  });
});
