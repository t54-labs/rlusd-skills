import { describe, expect, test } from "vitest";

import {
  currenciesMatch,
  normalizeXrplCurrencyCode
} from "../src/adapters/xrpl.js";

describe("XRPL currency normalization", () => {
  test("normalizes printable hex currency codes to ASCII", () => {
    expect(
      normalizeXrplCurrencyCode(
        "524C555344000000000000000000000000000000"
      )
    ).toBe("RLUSD");
  });

  test("treats ASCII and hex RLUSD currency codes as equal", () => {
    expect(
      currenciesMatch(
        "524C555344000000000000000000000000000000",
        "RLUSD"
      )
    ).toBe(true);
  });
});
