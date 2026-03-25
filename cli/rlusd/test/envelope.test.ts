import { describe, expect, test } from "vitest";

import { createSuccessEnvelope } from "../src/schemas/envelope.js";

describe("createSuccessEnvelope", () => {
  test("builds the shared JSON response envelope", () => {
    expect(
      createSuccessEnvelope({
        command: "resolve.asset",
        chain: "ethereum-mainnet",
        timestamp: "2026-03-24T18:00:00.000Z",
        data: {
          symbol: "RLUSD"
        }
      })
    ).toEqual({
      ok: true,
      command: "resolve.asset",
      chain: "ethereum-mainnet",
      timestamp: "2026-03-24T18:00:00.000Z",
      data: {
        symbol: "RLUSD"
      },
      warnings: [],
      next: []
    });
  });
});
