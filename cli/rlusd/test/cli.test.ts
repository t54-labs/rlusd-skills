import { describe, expect, test } from "vitest";

import { createCli, runCli } from "../src/index.js";

describe("cli", () => {
  test("exposes resolve commands in help output", () => {
    const help = createCli().helpInformation();

    expect(help).toContain("resolve");
    expect(help).toContain("--json");
  });

  test("returns success for help output", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(["--help"], {
      writeStdout: (chunk) => {
        stdout += chunk;
      },
      writeStderr: (chunk) => {
        stderr += chunk;
      }
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Deterministic RLUSD agent CLI");
  });

  test("prints a JSON asset resolution envelope", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      ["resolve", "asset", "--chain", "ethereum-mainnet", "--json"],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T18:00:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "resolve.asset",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T18:00:00.000Z",
      data: {
        symbol: "RLUSD",
        address_type: "proxy",
        decimals: 18
      }
    });
  });
});
