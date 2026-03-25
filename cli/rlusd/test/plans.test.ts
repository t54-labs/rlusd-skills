import { describe, expect, test } from "vitest";

import { createPlanId } from "../src/plans/index.js";

describe("createPlanId", () => {
  test("returns the same plan id for the same normalized payload", () => {
    const input = {
      action: "evm.transfer",
      chain: "ethereum-mainnet",
      params: {
        from: "wallet:ops",
        to: "0x0000000000000000000000000000000000000001",
        amount: "25.5"
      }
    };

    expect(createPlanId(input)).toBe(createPlanId(input));
    expect(createPlanId(input)).toMatch(/^plan_[0-9a-f]{12}$/);
  });

  test("returns different plan ids for different payloads", () => {
    const transferPlanId = createPlanId({
      action: "evm.transfer",
      chain: "ethereum-mainnet",
      params: {
        from: "wallet:ops",
        to: "0x0000000000000000000000000000000000000001",
        amount: "25.5"
      }
    });

    const approvePlanId = createPlanId({
      action: "evm.approve",
      chain: "ethereum-mainnet",
      params: {
        owner: "wallet:ops",
        spender: "0x0000000000000000000000000000000000000002",
        amount: "25.5"
      }
    });

    expect(transferPlanId).not.toBe(approvePlanId);
  });
});
