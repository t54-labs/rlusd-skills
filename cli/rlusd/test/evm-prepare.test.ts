import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

describe("evm prepare commands", () => {
  test("creates and stores a transfer plan", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-transfer-plan-"));
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
        now: () => "2026-03-24T22:00:00.000Z",
        planDir
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");

    const output = JSON.parse(stdout);
    expect(output).toMatchObject({
      ok: true,
      command: "evm.transfer.prepare",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T22:00:00.000Z",
      data: {
        plan_id: expect.stringMatching(/^plan_[0-9a-f]{12}$/),
        action: "evm.transfer",
        requires_confirmation: true,
        human_summary:
          "Transfer 25.5 RLUSD from wallet:ops to 0x0000000000000000000000000000000000000001 on Ethereum Mainnet",
        asset: {
          symbol: "RLUSD",
          address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
          address_type: "proxy",
          decimals: 18
        },
        params: {
          from: "wallet:ops",
          to: "0x0000000000000000000000000000000000000001",
          amount: "25.5"
        },
        intent: {
          to: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
          value: "0",
          function_name: "transfer",
          args: {
            to: "0x0000000000000000000000000000000000000001",
            amount_raw: "25500000000000000000"
          },
          data: expect.stringMatching(/^0xa9059cbb/i)
        },
        plan_path: expect.stringContaining(planDir)
      },
      warnings: ["mainnet", "real_funds"],
      next: []
    });

    const savedPlan = JSON.parse(await readFile(output.data.plan_path, "utf8"));
    expect(savedPlan).toEqual(output);
  });

  test("creates and stores an approval plan", async () => {
    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-approve-plan-"));
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
        now: () => "2026-03-24T22:05:00.000Z",
        planDir
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");

    const output = JSON.parse(stdout);
    expect(output).toMatchObject({
      ok: true,
      command: "evm.approve.prepare",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T22:05:00.000Z",
      data: {
        plan_id: expect.stringMatching(/^plan_[0-9a-f]{12}$/),
        action: "evm.approve",
        requires_confirmation: true,
        human_summary:
          "Approve 500 RLUSD from wallet:ops for 0x0000000000000000000000000000000000000002 on Ethereum Mainnet",
        asset: {
          symbol: "RLUSD",
          address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
          address_type: "proxy",
          decimals: 18
        },
        params: {
          owner: "wallet:ops",
          spender: "0x0000000000000000000000000000000000000002",
          amount: "500"
        },
        intent: {
          to: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
          value: "0",
          function_name: "approve",
          args: {
            spender: "0x0000000000000000000000000000000000000002",
            amount_raw: "500000000000000000000"
          },
          data: expect.stringMatching(/^0x095ea7b3/i)
        },
        plan_path: expect.stringContaining(planDir)
      },
      warnings: ["mainnet", "token_allowance"],
      next: []
    });

    const savedPlan = JSON.parse(await readFile(output.data.plan_path, "utf8"));
    expect(savedPlan).toEqual(output);
  });
});
