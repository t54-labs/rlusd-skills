import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

async function prepareTransferPlan(planDir: string): Promise<{
  planId: string;
  planPath: string;
}> {
  let stdout = "";
  let stderr = "";

  const exitCode = await runCli(
    [
      "evm",
      "transfer",
      "prepare",
      "--chain",
      "ethereum-mainnet",
      "--from",
      "wallet:ops",
      "--to",
      "0x0000000000000000000000000000000000000001",
      "--amount",
      "25.5",
      "--json"
    ],
    {
      writeStdout: (chunk) => {
        stdout += chunk;
      },
      writeStderr: (chunk) => {
        stderr += chunk;
      },
      now: () => "2026-03-24T23:00:00.000Z",
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

async function prepareApprovePlan(planDir: string): Promise<{
  planId: string;
  planPath: string;
}> {
  let stdout = "";
  let stderr = "";

  const exitCode = await runCli(
    [
      "evm",
      "approve",
      "prepare",
      "--chain",
      "ethereum-mainnet",
      "--owner",
      "wallet:ops",
      "--spender",
      "0x0000000000000000000000000000000000000002",
      "--amount",
      "500",
      "--json"
    ],
    {
      writeStdout: (chunk) => {
        stdout += chunk;
      },
      writeStderr: (chunk) => {
        stderr += chunk;
      },
      now: () => "2026-03-24T23:05:00.000Z",
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

describe("evm execute commands", () => {
  test("executes a prepared transfer plan after explicit confirmation", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-execute-transfer-"));
    const { planId, planPath } = await prepareTransferPlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "transfer",
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
        now: () => "2026-03-24T23:10:00.000Z",
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
                expect(transaction.to).toBe(
                  "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD"
                );
                expect(transaction.value).toBe(0n);
                expect(transaction.data).toMatch(/^0xa9059cbb/i);

                return "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
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
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "evm.transfer.execute",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T23:10:00.000Z",
      data: {
        plan_id: planId,
        plan_path: planPath,
        action: "evm.transfer",
        tx_hash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        signer: {
          address: "0x0000000000000000000000000000000000000003",
          kind: "test"
        }
      },
      warnings: ["mainnet", "real_funds"]
    });
  });

  test("executes a prepared approval plan after explicit confirmation", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-execute-approve-"));
    const { planId, planPath } = await prepareApprovePlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "approve",
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
        now: () => "2026-03-24T23:15:00.000Z",
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
                expect(transaction.to).toBe(
                  "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD"
                );
                expect(transaction.value).toBe(0n);
                expect(transaction.data).toMatch(/^0x095ea7b3/i);

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
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "evm.approve.execute",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T23:15:00.000Z",
      data: {
        plan_id: planId,
        plan_path: planPath,
        action: "evm.approve",
        tx_hash:
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        signer: {
          address: "0x0000000000000000000000000000000000000003",
          kind: "test"
        }
      },
      warnings: ["mainnet", "token_allowance"]
    });
  });

  test("requires explicit confirmation for a mainnet execute command", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-confirmation-"));
    const { planPath } = await prepareTransferPlan(planDir);
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      ["evm", "transfer", "execute", "--plan", planPath, "--json"],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T23:20:00.000Z",
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
      command: "evm.transfer.execute",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T23:20:00.000Z",
      error: {
        code: "CONFIRMATION_REQUIRED",
        message:
          "Execution requires an explicit confirmation matching the prepared plan id.",
        retryable: false
      }
    });
  });

  test("rejects execution if the plan contents were tampered with", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-plan-tamper-"));
    const { planId, planPath } = await prepareTransferPlan(planDir);
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    plan.data.params.amount = "999";
    await writeFile(planPath, JSON.stringify(plan, null, 2));

    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "transfer",
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
        now: () => "2026-03-24T23:25:00.000Z",
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
      command: "evm.transfer.execute",
      timestamp: "2026-03-24T23:25:00.000Z",
      error: {
        code: "PLAN_INTEGRITY_MISMATCH",
        message:
          "Prepared plan contents do not match the stored deterministic plan id.",
        retryable: false
      }
    });
  });

  test("rejects execution if confirmation requirements were tampered with", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-confirm-tamper-"));
    const { planPath } = await prepareTransferPlan(planDir);
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    plan.data.requires_confirmation = false;
    await writeFile(planPath, JSON.stringify(plan, null, 2));

    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      ["evm", "transfer", "execute", "--plan", planPath, "--json"],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T23:30:00.000Z",
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
      command: "evm.transfer.execute",
      timestamp: "2026-03-24T23:30:00.000Z",
      error: {
        code: "PLAN_INTEGRITY_MISMATCH",
        message:
          "Prepared plan contents do not match the stored deterministic plan id.",
        retryable: false
      }
    });
  });
});
