import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

describe("fiat guidance commands", () => {
  test("prints the onboarding checklist as JSON", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      ["fiat", "onboarding", "checklist", "--json"],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T02:00:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "fiat.onboarding.checklist",
      timestamp: "2026-03-25T02:00:00.000Z",
      data: {
        checklist: expect.arrayContaining([
          {
            step: "Provide contact details"
          },
          {
            step: "Prepare tax documentation"
          },
          {
            step: "Register crypto wallets"
          },
          {
            step: "Register bank accounts"
          }
        ])
      },
      warnings: ["manual_process", "institutional_flow"],
      next: []
    });
  });

  test("prints parameterized buy instructions for XRPL", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "fiat",
        "buy",
        "instructions",
        "--wallet-id",
        "wallet-123",
        "--chain",
        "xrpl-mainnet",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T02:05:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "fiat.buy.instructions",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-25T02:05:00.000Z",
      data: {
        wallet_id: "wallet-123",
        chain: "xrpl-mainnet",
        instructions: expect.arrayContaining([
          {
            step: "Complete Ripple onboarding and approval"
          },
          {
            step: "Confirm the funding bank account is already registered with Ripple"
          },
          {
            step: "Use wallet ID wallet-123 as the wire reference or memo"
          },
          {
            step: "Create an RLUSD trust line on XRPL before funding"
          }
        ])
      },
      warnings: [
        "manual_process",
        "bank_wire_required",
        "xrpl_trustline_required"
      ],
      next: []
    });
  });

  test("returns a structured error for unsupported buy chains", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "fiat",
        "buy",
        "instructions",
        "--wallet-id",
        "wallet-123",
        "--chain",
        "ethereum-sepolia",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T02:07:00.000Z"
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "fiat.buy.instructions",
      chain: "ethereum-sepolia",
      timestamp: "2026-03-25T02:07:00.000Z",
      error: {
        code: "UNSUPPORTED_CHAIN",
        message: "Unsupported chain: ethereum-sepolia",
        retryable: false
      },
      warnings: [],
      next: []
    });
  });

  test("prints parameterized redeem instructions", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "fiat",
        "redeem",
        "instructions",
        "--wallet-id",
        "wallet-123",
        "--amount",
        "10000",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T02:10:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "fiat.redeem.instructions",
      timestamp: "2026-03-25T02:10:00.000Z",
      data: {
        wallet_id: "wallet-123",
        amount: "10000",
        instructions: expect.arrayContaining([
          {
            step: "Confirm Ripple onboarding remains active for redemption"
          },
          {
            step: "Use an approved bank account for redemption settlement"
          },
          {
            step: "Follow the Ripple UI redemption flow for wallet wallet-123"
          }
        ])
      },
      warnings: ["manual_process", "banking_rail_timing"],
      next: []
    });
  });
});
