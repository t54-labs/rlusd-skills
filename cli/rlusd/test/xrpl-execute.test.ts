import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

async function prepareTrustlinePlan(planDir: string): Promise<{
  planId: string;
  planPath: string;
}> {
  let stdout = "";
  let stderr = "";

  const exitCode = await runCli(
    [
      "xrpl",
      "trustline",
      "prepare",
      "--chain",
      "xrpl-mainnet",
      "--address",
      "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      "--limit",
      "100000",
      "--json"
    ],
    {
      writeStdout: (chunk) => {
        stdout += chunk;
      },
      writeStderr: (chunk) => {
        stderr += chunk;
      },
      now: () => "2026-03-25T00:00:00.000Z",
      planDir
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

async function preparePaymentPlan(planDir: string): Promise<{
  planId: string;
  planPath: string;
}> {
  let stdout = "";
  let stderr = "";

  const exitCode = await runCli(
    [
      "xrpl",
      "payment",
      "prepare",
      "--chain",
      "xrpl-mainnet",
      "--from",
      "wallet:ops",
      "--to",
      "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      "--amount",
      "250",
      "--json"
    ],
    {
      writeStdout: (chunk) => {
        stdout += chunk;
      },
      writeStderr: (chunk) => {
        stderr += chunk;
      },
      now: () => "2026-03-25T00:05:00.000Z",
      planDir,
      adapters: {
        xrpl: {
          trustlineStatus: async () => {
            return {
              present: true
            };
          },
          accountInfo: async () => {
            throw new Error("unexpected account info call");
          }
        }
      },
      walletResolver: {
        resolveEvmAddress: async () => {
          throw new Error("unexpected evm address resolution");
        },
        resolveXrplAddress: async (input) => {
          expect(input.sender).toBe("wallet:ops");
          expect(input.chain.chain).toBe("xrpl-mainnet");
          return "rTestSender1111111111111111111111111";
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

describe("xrpl execute commands", () => {
  test("executes a prepared trustline plan after explicit confirmation", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-xrpl-trustline-exec-"));
    const { planId, planPath } = await prepareTrustlinePlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "xrpl",
        "trustline",
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
        now: () => "2026-03-25T00:10:00.000Z",
        walletResolver: {
          resolveEvmAddress: async () => {
            throw new Error("unexpected evm address resolution");
          },
          resolveXrplAddress: async () => {
            throw new Error("unexpected xrpl address resolution");
          },
          resolveEvmSigner: async () => {
            throw new Error("unexpected evm signer resolution");
          },
          resolveXrplSigner: async (input) => {
            expect(input.sender).toBe("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
            expect(input.chain.chain).toBe("xrpl-mainnet");

            return {
              address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
              kind: "test",
              sendTransaction: async (request) => {
                expect(request.tx_json).toMatchObject({
                  TransactionType: "TrustSet",
                  Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                });

                return "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
              }
            };
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "xrpl.trustline.execute",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-25T00:10:00.000Z",
      data: {
        plan_id: planId,
        plan_path: planPath,
        action: "xrpl.trustline",
        tx_hash:
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        signer: {
          address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          kind: "test"
        }
      },
      warnings: ["mainnet", "trustline_change"]
    });
  });

  test("executes a prepared payment plan after explicit confirmation", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-xrpl-payment-exec-"));
    const { planId, planPath } = await preparePaymentPlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "xrpl",
        "payment",
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
        now: () => "2026-03-25T00:15:00.000Z",
        walletResolver: {
          resolveEvmAddress: async () => {
            throw new Error("unexpected evm address resolution");
          },
          resolveXrplAddress: async () => {
            throw new Error("unexpected xrpl address resolution");
          },
          resolveEvmSigner: async () => {
            throw new Error("unexpected evm signer resolution");
          },
          resolveXrplSigner: async (input) => {
            expect(input.sender).toBe("wallet:ops");
            expect(input.chain.chain).toBe("xrpl-mainnet");

            return {
              address: "rTestSender1111111111111111111111111",
              kind: "test",
              sendTransaction: async (request) => {
                expect(request.tx_json).toMatchObject({
                  TransactionType: "Payment",
                  Account: "rTestSender1111111111111111111111111",
                  Destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                });

                return "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
              }
            };
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "xrpl.payment.execute",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-25T00:15:00.000Z",
      data: {
        plan_id: planId,
        plan_path: planPath,
        action: "xrpl.payment",
        tx_hash:
          "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        signer: {
          address: "rTestSender1111111111111111111111111",
          kind: "test"
        }
      },
      warnings: ["mainnet", "real_funds"]
    });
  });

  test("requires explicit confirmation for a mainnet XRPL execute command", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-xrpl-confirm-"));
    const { planPath } = await prepareTrustlinePlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      ["xrpl", "trustline", "execute", "--plan", planPath, "--json"],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T00:20:00.000Z",
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
      command: "xrpl.trustline.execute",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-25T00:20:00.000Z",
      error: {
        code: "CONFIRMATION_REQUIRED",
        message:
          "Execution requires an explicit confirmation matching the prepared plan id.",
        retryable: false
      }
    });
  });
});
