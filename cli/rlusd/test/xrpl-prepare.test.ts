import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";
import {
  buildXrplPaymentPlan,
  buildXrplTrustlinePlan
} from "../src/plans/xrpl.js";

describe("xrpl prepare commands", () => {
  test("creates and stores a trustline plan", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-xrpl-trustline-"));
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
        now: () => "2026-03-24T22:10:00.000Z",
        planDir
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");

    const output = JSON.parse(stdout);
    expect(output).toMatchObject({
      ok: true,
      command: "xrpl.trustline.prepare",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-24T22:10:00.000Z",
      data: {
        plan_id: expect.stringMatching(/^plan_[0-9a-f]{12}$/),
        action: "xrpl.trustline",
        requires_confirmation: true,
        human_summary:
          "Set RLUSD trust line limit to 100000 for rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh on XRPL Mainnet",
        asset: {
          symbol: "RLUSD",
          issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
          currency: "RLUSD"
        },
        params: {
          address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          limit: "100000"
        },
        intent: {
          account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          transaction_type: "TrustSet",
          tx_json: {
            TransactionType: "TrustSet",
            Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            LimitAmount: {
              currency: "RLUSD",
              issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
              value: "100000"
            }
          }
        },
        plan_path: expect.stringContaining(planDir)
      },
      warnings: ["mainnet", "trustline_change"],
      next: []
    });

    const savedPlan = JSON.parse(await readFile(output.data.plan_path, "utf8"));
    expect(savedPlan).toEqual(output);
  });

  test("creates and stores a payment plan when destination trustline exists", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-xrpl-payment-"));
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
        now: () => "2026-03-24T22:15:00.000Z",
        planDir,
        adapters: {
          xrpl: {
            trustlineStatus: async (input) => {
              expect(input.chain).toBe("xrpl-mainnet");
              expect(input.address).toBe(
                "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
              );
              expect(input.asset.symbol).toBe("RLUSD");

              return {
                present: true,
                limit: "1000"
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
    expect(output).toMatchObject({
      ok: true,
      command: "xrpl.payment.prepare",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-24T22:15:00.000Z",
      data: {
        plan_id: expect.stringMatching(/^plan_[0-9a-f]{12}$/),
        action: "xrpl.payment",
        requires_confirmation: true,
        human_summary:
          "Send 250 RLUSD from wallet:ops to rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh on XRPL Mainnet",
        asset: {
          symbol: "RLUSD",
          issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
          currency: "RLUSD"
        },
        params: {
          from: "wallet:ops",
          to: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          amount: "250"
        },
        intent: {
          account: "rTestSender1111111111111111111111111",
          transaction_type: "Payment",
          tx_json: {
            TransactionType: "Payment",
            Account: "rTestSender1111111111111111111111111",
            Destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            Amount: {
              currency: "RLUSD",
              issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
              value: "250"
            }
          }
        },
        plan_path: expect.stringContaining(planDir)
      },
      warnings: ["mainnet", "real_funds"],
      next: []
    });

    const savedPlan = JSON.parse(await readFile(output.data.plan_path, "utf8"));
    expect(savedPlan).toEqual(output);
  });

  test("returns a structured error when destination trustline is missing", async () => {
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
        now: () => "2026-03-24T22:20:00.000Z",
        adapters: {
          xrpl: {
            trustlineStatus: async () => {
              return {
                present: false,
                account_exists: true
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
          resolveXrplAddress: async () => "rTestSender1111111111111111111111111",
          resolveEvmSigner: async () => {
            throw new Error("unexpected evm signer resolution");
          },
          resolveXrplSigner: async () => {
            throw new Error("unexpected xrpl signer resolution");
          }
        }
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "xrpl.payment.prepare",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-24T22:20:00.000Z",
      error: {
        code: "TRUSTLINE_MISSING",
        message: "Destination account does not currently have an RLUSD trust line.",
        retryable: false
      },
      warnings: [],
      next: [
        {
          command:
            "rlusd xrpl trustline status --chain xrpl-mainnet --address rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh --json"
        }
      ]
    });
  });

  test("returns a structured error when destination account does not exist", async () => {
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
        now: () => "2026-03-24T22:25:00.000Z",
        adapters: {
          xrpl: {
            trustlineStatus: async () => {
              return {
                present: false,
                account_exists: false
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
          resolveXrplAddress: async () => "rTestSender1111111111111111111111111",
          resolveEvmSigner: async () => {
            throw new Error("unexpected evm signer resolution");
          },
          resolveXrplSigner: async () => {
            throw new Error("unexpected xrpl signer resolution");
          }
        }
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "xrpl.payment.prepare",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-24T22:25:00.000Z",
      error: {
        code: "DESTINATION_ACCOUNT_MISSING",
        message: "Destination XRPL account does not exist or is not activated.",
        retryable: false
      },
      warnings: [],
      next: [
        {
          command:
            "rlusd xrpl account info --chain xrpl-mainnet --address rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh --json"
        }
      ]
    });
  });

  test("rejects non-canonical XRPL string numbers for trustline limits", () => {
    expect(() =>
      buildXrplTrustlinePlan({
        chain: "xrpl-mainnet",
        chainDisplayName: "XRPL Mainnet",
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        limit: "01",
        asset: {
          symbol: "RLUSD",
          name: "Ripple USD",
          chain: "xrpl-mainnet",
          family: "xrpl",
          issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
          currency: "RLUSD"
        }
      })
    ).toThrow("Limit must be a valid XRPL string number greater than zero");
  });

  test("preserves XRPL scientific-notation payment amounts", () => {
    const plan = buildXrplPaymentPlan({
      chain: "xrpl-mainnet",
      chainDisplayName: "XRPL Mainnet",
      from: "wallet:ops",
      fromAddress: "rTestSender1111111111111111111111111",
      to: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
      amount: "1.2E5",
      asset: {
        symbol: "RLUSD",
        name: "Ripple USD",
        chain: "xrpl-mainnet",
        family: "xrpl",
        issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
        currency: "RLUSD"
      }
    });

    expect(plan.params.amount).toBe("1.2E5");
    expect(plan.intent.tx_json).toMatchObject({
      Amount: {
        value: "1.2E5"
      }
    });
  });
});
