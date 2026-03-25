import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { encodeFunctionData, parseAbi } from "viem";
import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

const aavePoolAbi = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"
]);

async function prepareSupplyPlan(planDir: string): Promise<{
  planId: string;
  planPath: string;
}> {
  let stdout = "";
  let stderr = "";

  const exitCode = await runCli(
    [
      "defi",
      "supply",
      "prepare",
      "--chain",
      "ethereum-mainnet",
      "--venue",
      "aave",
      "--from",
      "wallet:ops",
      "--amount",
      "5000",
      "--json"
    ],
    {
      writeStdout: (chunk) => {
        stdout += chunk;
      },
      writeStderr: (chunk) => {
        stderr += chunk;
      },
      now: () => "2026-03-25T01:30:00.000Z",
      planDir,
      walletResolver: {
        resolveEvmAddress: async () => {
          return "0x0000000000000000000000000000000000000003";
        },
        resolveXrplAddress: async () => {
          throw new Error("unexpected xrpl address resolution");
        },
        resolveEvmSigner: async () => {
          throw new Error("unexpected evm signer resolution");
        },
        resolveXrplSigner: async () => {
          throw new Error("unexpected xrpl signer resolution");
        }
      }
    }
  );

  expect(exitCode).toBe(0);
  expect(stderr).toBe("");

  const output = JSON.parse(stdout);
  return {
    planId: output.data.plan_id,
    planPath: output.data.plan_path
  };
}

describe("defi execute commands", () => {
  test("executes the aave supply plan after explicit confirmation", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-defi-execute-"));
    const { planId, planPath } = await prepareSupplyPlan(planDir);
    let stdout = "";
    let stderr = "";
    const calls: Array<{
      to: string;
      data: string;
      value: bigint;
    }> = [];

    const exitCode = await runCli(
      [
        "defi",
        "supply",
        "execute",
        "--plan",
        planPath,
        "--confirm-plan-id",
        planId,
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:35:00.000Z",
        walletResolver: {
          resolveEvmAddress: async () => {
            throw new Error("unexpected evm address resolution");
          },
          resolveXrplAddress: async () => {
            throw new Error("unexpected xrpl address resolution");
          },
          resolveEvmSigner: async (input) => {
            expect(input.sender).toBe("wallet:ops");
            expect(input.chain.chain).toBe("ethereum-mainnet");

            return {
              address: "0x0000000000000000000000000000000000000003",
              kind: "test",
              sendTransaction: async (transaction) => {
                calls.push({
                  to: transaction.to,
                  data: transaction.data,
                  value: transaction.value
                });

                if (calls.length === 1) {
                  return "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
                }

                return "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
              }
            };
          },
          resolveXrplSigner: async () => {
            throw new Error("unexpected xrpl signer resolution");
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      to: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
      value: 0n
    });
    expect(calls[0]?.data).toMatch(/^0x095ea7b3/i);
    expect(calls[1]).toEqual({
      to: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      value: 0n,
      data: encodeFunctionData({
        abi: aavePoolAbi,
        functionName: "supply",
        args: [
          "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
          5000000000000000000000n,
          "0x0000000000000000000000000000000000000003",
          0
        ]
      })
    });
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "defi.supply.execute",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:35:00.000Z",
      data: {
        plan_id: planId,
        plan_path: planPath,
        action: "defi.supply",
        signer: {
          address: "0x0000000000000000000000000000000000000003",
          kind: "test"
        },
        steps: [
          {
            step: "approve",
            tx_hash:
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          },
          {
            step: "supply",
            tx_hash:
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ]
      }
    });
  });

  test("requires explicit confirmation for defi supply execute", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-defi-confirm-"));
    const { planPath } = await prepareSupplyPlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      ["defi", "supply", "execute", "--plan", planPath, "--json"],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:40:00.000Z",
        walletResolver: {
          resolveEvmAddress: async () => {
            throw new Error("wallet resolver should not be called");
          },
          resolveXrplAddress: async () => {
            throw new Error("wallet resolver should not be called");
          },
          resolveEvmSigner: async () => {
            throw new Error("wallet resolver should not be called");
          },
          resolveXrplSigner: async () => {
            throw new Error("wallet resolver should not be called");
          }
        }
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "defi.supply.execute",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:40:00.000Z",
      error: {
        code: "CONFIRMATION_REQUIRED",
        message:
          "Execution requires an explicit confirmation matching the prepared plan id.",
        retryable: false
      }
    });
  });
});
