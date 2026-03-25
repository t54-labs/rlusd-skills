import { describe, expect, test } from "vitest";

import {
  findBestSwapQuote,
  findSupplyPreview,
  listVenues,
  loadRegistry
} from "../src/registry/index.js";
import { runCli } from "../src/index.js";

describe("defi registry", () => {
  test("lists DeFi venues matching requested capabilities", async () => {
    const registry = await loadRegistry();

    expect(
      listVenues(registry, {
        chain: "ethereum-mainnet",
        capabilities: ["swap", "lend", "lp"]
      }).map((venue) => venue.venue)
    ).toEqual(["aave", "curve", "uniswap"]);
  });

  test("selects the best static preview swap quote", async () => {
    const registry = await loadRegistry();

    const quote = findBestSwapQuote(registry, {
      chain: "ethereum-mainnet",
      from: "RLUSD",
      to: "USDC",
      amount: "1000"
    });

    if (!quote) {
      throw new Error("Expected a preview quote for RLUSD -> USDC");
    }
    expect(quote).toMatchObject({
      venue: "curve",
      pricing_source: "reference_preview",
      rate: "0.999600",
      amount_out: "999.600000",
      fee_bps: 4
    });
    expect(quote.considered_venues).toEqual(["curve", "uniswap"]);
  });

  test("loads the aave supply preview metadata", async () => {
    const registry = await loadRegistry();

    const preview = findSupplyPreview(registry, {
      chain: "ethereum-mainnet",
      venue: "aave",
      amount: "5000"
    });

    if (!preview) {
      throw new Error("Expected a supply preview for aave");
    }

    expect(preview).toMatchObject({
      venue: "aave",
      asset_symbol: "RLUSD",
      amount: "5000",
      reference_supply_apy: "4.2000",
      collateral_supported: false,
      approval_mode: "approve"
    });
  });
});

describe("defi cli commands", () => {
  test("prints DeFi venues as JSON", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "venues",
        "--chain",
        "ethereum-mainnet",
        "--capability",
        "swap,lend,lp",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:00:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "defi.venues",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:00:00.000Z",
      data: {
        capability_filter: ["swap", "lend", "lp"],
        venues: [
          {
            venue: "aave",
            capabilities: ["lend", "borrow"]
          },
          {
            venue: "curve",
            capabilities: ["swap", "lp"]
          },
          {
            venue: "uniswap",
            capabilities: ["swap", "lp"]
          }
        ]
      },
      warnings: [],
      next: []
    });
  });

  test("prints a static preview swap quote as JSON", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "quote",
        "swap",
        "--chain",
        "ethereum-mainnet",
        "--from",
        "RLUSD",
        "--to",
        "USDC",
        "--amount",
        "1000",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:05:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "defi.quote.swap",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:05:00.000Z",
      data: {
        request: {
          from: "RLUSD",
          to: "USDC",
          amount: "1000"
        },
        route: {
          venue: "curve",
          pricing_source: "reference_preview",
          rate: "0.999600",
          reference_rate_is_net_of_fee: true,
          amount_out: "999.600000",
          fee_bps: 4,
          amount_out_is_net_of_fee: true
        },
        considered_venues: ["curve", "uniswap"]
      },
      warnings: ["not_live_market_data", "preview_only"],
      next: []
    });
  });

  test("accepts high-precision RLUSD input amounts in preview quotes", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "quote",
        "swap",
        "--chain",
        "ethereum-mainnet",
        "--from",
        "RLUSD",
        "--to",
        "USDC",
        "--amount",
        "1.000000000000000001",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:07:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "defi.quote.swap",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:07:00.000Z",
      data: {
        request: {
          amount: "1.000000000000000001"
        },
        route: {
          venue: "curve",
          amount_out: "0.999600"
        }
      }
    });
  });

  test("returns a structured error for unsupported swap pairs", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "quote",
        "swap",
        "--chain",
        "ethereum-mainnet",
        "--from",
        "RLUSD",
        "--to",
        "ETH",
        "--amount",
        "1000",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:10:00.000Z"
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "defi.quote.swap",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:10:00.000Z",
      error: {
        code: "QUOTE_UNAVAILABLE",
        message:
          "No preview swap quote is available for RLUSD -> ETH on ethereum-mainnet.",
        retryable: false
      },
      warnings: [],
      next: [
        {
          command: "rlusd defi venues --chain ethereum-mainnet --capability swap --json"
        }
      ]
    });
  });

  test("returns a structured error for unsupported DeFi chains", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "venues",
        "--chain",
        "ethereum-sepolia",
        "--capability",
        "swap",
        "--json"
      ],
      {
        writeStdout: (chunk) => {
          stdout += chunk;
        },
        writeStderr: (chunk) => {
          stderr += chunk;
        },
        now: () => "2026-03-25T01:12:00.000Z"
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "defi.venues",
      chain: "ethereum-sepolia",
      timestamp: "2026-03-25T01:12:00.000Z",
      error: {
        code: "UNSUPPORTED_CHAIN",
        message: "Unsupported chain: ethereum-sepolia",
        retryable: false
      }
    });
  });

  test("prints a static aave supply preview as JSON", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "supply",
        "preview",
        "--chain",
        "ethereum-mainnet",
        "--venue",
        "aave",
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
        now: () => "2026-03-25T01:15:00.000Z"
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: "defi.supply.preview",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:15:00.000Z",
      data: {
        venue: "aave",
        asset_symbol: "RLUSD",
        amount: "5000",
        reference_supply_apy: "4.2000",
        collateral_supported: false,
        approval_mode: "approve"
      },
      warnings: [
        "not_live_market_data",
        "preview_only",
        "collateral_unsupported"
      ],
      next: []
    });
  });

  test("creates a static aave supply prepare plan", async () => {
    const { mkdtemp, readFile } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const path = await import("node:path");

    const planDir = await mkdtemp(path.join(tmpdir(), "rlusd-defi-supply-"));
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
        now: () => "2026-03-25T01:20:00.000Z",
        planDir,
        walletResolver: {
          resolveEvmAddress: async (input) => {
            expect(input.sender).toBe("wallet:ops");
            expect(input.chain.chain).toBe("ethereum-mainnet");
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
    expect(output).toMatchObject({
      ok: true,
      command: "defi.supply.prepare",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:20:00.000Z",
      data: {
        plan_id: expect.stringMatching(/^plan_[0-9a-f]{12}$/),
        action: "defi.supply",
        requires_confirmation: true,
        human_summary:
          "Supply 5000 RLUSD to aave from wallet:ops on Ethereum Mainnet",
        params: {
          venue: "aave",
          from: "wallet:ops",
          amount: "5000"
        },
        intent: {
          venue: "aave",
          steps: [
            {
              step: "approve",
              approval_mode: "approve",
              spender_reference: "venue:aave:pool",
              spender_address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
              token_address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
              value: "0",
              data: expect.stringMatching(/^0x095ea7b3/i),
              amount_raw: "5000000000000000000000"
            },
            {
              step: "supply",
              protocol: "aave",
              asset_symbol: "RLUSD",
              asset_address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
              pool_address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
              amount_raw: "5000000000000000000000",
              on_behalf_of_address: "0x0000000000000000000000000000000000000003",
              referral_code: 0,
              collateral_supported: false,
              reference_supply_apy: "4.2000"
            }
          ]
        },
        plan_path: expect.stringContaining(planDir)
      },
      next: []
    });
    expect(output.warnings).toEqual(
      expect.arrayContaining([
        "mainnet",
        "real_funds",
        "not_live_market_data",
        "preview_only",
        "collateral_unsupported",
        "token_allowance"
      ])
    );
    expect(output.warnings).toHaveLength(6);

    const savedPlan = JSON.parse(await readFile(output.data.plan_path, "utf8"));
    expect(savedPlan).toEqual(output);
  });

  test("returns a structured error for venues without lend capability", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(
      [
        "defi",
        "supply",
        "preview",
        "--chain",
        "ethereum-mainnet",
        "--venue",
        "uniswap",
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
        now: () => "2026-03-25T01:25:00.000Z"
      }
    );

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(JSON.parse(stderr)).toMatchObject({
      ok: false,
      command: "defi.supply.preview",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-25T01:25:00.000Z",
      error: {
        code: "CAPABILITY_UNSUPPORTED",
        message: "Venue uniswap does not support lend on ethereum-mainnet.",
        retryable: false
      },
      warnings: [],
      next: [
        {
          command: "rlusd defi venues --chain ethereum-mainnet --capability lend --json"
        }
      ]
    });
  });
});
