import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

describe("transaction wait and receipt commands", () => {
  test("prints an EVM transaction wait envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "tx",
        "wait",
        "--chain",
        "ethereum-mainnet",
        "--hash",
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T00:25:00.000Z",
        txMonitor: {
          waitForEvmTransaction: async (input) => {
            expect(input.chain).toBe("ethereum-mainnet");
            expect(input.hash).toBe(
              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            );

            return {
              transaction_hash:
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              status: "success",
              block_number: 123,
              confirmations: 2
            };
          },
          getEvmReceipt: async () => {
            throw new Error("unexpected evm receipt call");
          },
          waitForXrplTransaction: async () => {
            throw new Error("unexpected xrpl wait call");
          },
          getXrplPaymentReceipt: async () => {
            throw new Error("unexpected xrpl receipt call");
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "evm.tx.wait",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T00:25:00.000Z",
      data: {
        transaction_hash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        status: "success",
        block_number: 123,
        confirmations: 2
      }
    });
  });

  test("prints an EVM transaction receipt envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "evm",
        "tx",
        "receipt",
        "--chain",
        "ethereum-mainnet",
        "--hash",
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T00:30:00.000Z",
        txMonitor: {
          waitForEvmTransaction: async () => {
            throw new Error("unexpected evm wait call");
          },
          getEvmReceipt: async (input) => {
            expect(input.hash).toBe(
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
            );

            return {
              transaction_hash:
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              status: "success",
              block_number: 456
            };
          },
          waitForXrplTransaction: async () => {
            throw new Error("unexpected xrpl wait call");
          },
          getXrplPaymentReceipt: async () => {
            throw new Error("unexpected xrpl receipt call");
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "evm.tx.receipt",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T00:30:00.000Z",
      data: {
        transaction_hash:
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        status: "success",
        block_number: 456
      }
    });
  });

  test("prints an XRPL transaction wait envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "xrpl",
        "tx",
        "wait",
        "--chain",
        "xrpl-mainnet",
        "--hash",
        "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T00:35:00.000Z",
        txMonitor: {
          waitForEvmTransaction: async () => {
            throw new Error("unexpected evm wait call");
          },
          getEvmReceipt: async () => {
            throw new Error("unexpected evm receipt call");
          },
          waitForXrplTransaction: async (input) => {
            expect(input.chain).toBe("xrpl-mainnet");
            expect(input.hash).toBe(
              "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"
            );

            return {
              transaction_hash:
                "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
              validated: true,
              result: "tesSUCCESS",
              ledger_index: 987654
            };
          },
          getXrplPaymentReceipt: async () => {
            throw new Error("unexpected xrpl receipt call");
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "xrpl.tx.wait",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-25T00:35:00.000Z",
      data: {
        transaction_hash:
          "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
        validated: true,
        result: "tesSUCCESS",
        ledger_index: 987654
      }
    });
  });

  test("prints an XRPL payment receipt envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "xrpl",
        "payment",
        "receipt",
        "--chain",
        "xrpl-mainnet",
        "--hash",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T00:40:00.000Z",
        txMonitor: {
          waitForEvmTransaction: async () => {
            throw new Error("unexpected evm wait call");
          },
          getEvmReceipt: async () => {
            throw new Error("unexpected evm receipt call");
          },
          waitForXrplTransaction: async () => {
            throw new Error("unexpected xrpl wait call");
          },
          getXrplPaymentReceipt: async (input) => {
            expect(input.hash).toBe(
              "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
            );

            return {
              transaction_hash:
                "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
              validated: true,
              result: "tesSUCCESS",
              ledger_index: 765432,
              destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
              amount: {
                currency: "RLUSD",
                issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
                value: "250"
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
      command: "xrpl.payment.receipt",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-25T00:40:00.000Z",
      data: {
        transaction_hash:
          "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        validated: true,
        result: "tesSUCCESS",
        ledger_index: 765432,
        destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        amount: {
          currency: "RLUSD",
          issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
          value: "250"
        }
      }
    });
  });
});
