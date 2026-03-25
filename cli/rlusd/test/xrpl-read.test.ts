import { describe, expect, test } from "vitest";

import { runCli } from "../src/index.js";

describe("xrpl read commands", () => {
  test("prints RLUSD trustline status as JSON", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "xrpl",
        "trustline",
        "status",
        "--chain",
        "xrpl-mainnet",
        "--address",
        "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T21:10:00.000Z",
        adapters: {
          xrpl: {
            trustlineStatus: async (input) => {
              expect(input.chain).toBe("xrpl-mainnet");
              expect(input.address).toBe(
                "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
              );
              expect(input.asset.symbol).toBe("RLUSD");
              expect(input.asset.issuer).toBe(
                "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"
              );

              return {
                present: true,
                balance: "125.5",
                limit: "1000"
              };
            },
            accountInfo: async () => {
              throw new Error("unexpected account info call");
            }
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "xrpl.trustline.status",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-24T21:10:00.000Z",
      data: {
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        asset: {
          symbol: "RLUSD",
          issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
          currency: "RLUSD"
        },
        trustline: {
          present: true,
          balance: "125.5",
          limit: "1000"
        }
      }
    });
  });

  test("prints XRPL account info as JSON", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "xrpl",
        "account",
        "info",
        "--chain",
        "xrpl-mainnet",
        "--address",
        "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-24T21:15:00.000Z",
        adapters: {
          xrpl: {
            trustlineStatus: async () => {
              throw new Error("unexpected trustline call");
            },
            accountInfo: async (input) => {
              expect(input.chain).toBe("xrpl-mainnet");
              expect(input.address).toBe(
                "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
              );

              return {
                exists: true,
                sequence: 7,
                xrp_balance_drops: "1000000"
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
      command: "xrpl.account.info",
      chain: "xrpl-mainnet",
      timestamp: "2026-03-24T21:15:00.000Z",
      data: {
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        account: {
          exists: true,
          sequence: 7,
          xrp_balance_drops: "1000000"
        }
      }
    });
  });
});
