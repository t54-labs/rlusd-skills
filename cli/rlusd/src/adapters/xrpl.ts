import { Client } from "xrpl";

import type {
  XrplAccountInfo,
  XrplAccountInfoInput,
  XrplReadAdapter,
  XrplTrustlineStatus,
  XrplTrustlineStatusInput
} from "./types.js";

type XrplErrorLike = {
  data?: {
    error?: string;
  };
  error?: string;
  message?: string;
};

const XRPL_HEX_CURRENCY_LENGTH = 40;
const printableAsciiPattern = /^[\x20-\x7E]+$/;

export function normalizeXrplCurrencyCode(currency: string): string {
  if (!new RegExp(`^[A-F0-9]{${XRPL_HEX_CURRENCY_LENGTH}}$`, "i").test(currency)) {
    return currency;
  }

  const decoded = Buffer.from(currency, "hex")
    .toString("ascii")
    .replace(/\0+$/g, "");

  if (decoded.length > 0 && printableAsciiPattern.test(decoded)) {
    return decoded;
  }

  return currency.toUpperCase();
}

export function currenciesMatch(observed: string, expected: string): boolean {
  return (
    normalizeXrplCurrencyCode(observed) ===
    normalizeXrplCurrencyCode(expected)
  );
}

function isActNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as XrplErrorLike;

  return (
    candidate.error === "actNotFound" ||
    candidate.data?.error === "actNotFound" ||
    candidate.message?.includes("actNotFound") === true
  );
}

function getWsUrl(chainConfig: XrplTrustlineStatusInput["chainConfig"]): string {
  if (chainConfig.family !== "xrpl") {
    throw new Error(`Chain ${chainConfig.chain} is not an XRPL network`);
  }

  if (!chainConfig.ws_url) {
    throw new Error(`Chain ${chainConfig.chain} is missing ws_url`);
  }

  return chainConfig.ws_url;
}

function getIssuedCurrencyAsset(input: XrplTrustlineStatusInput): {
  issuer: string;
  currency: string;
} {
  if (!input.asset.issuer || !input.asset.currency) {
    throw new Error(`Asset ${input.asset.symbol} is missing XRPL issuer data`);
  }

  return {
    issuer: input.asset.issuer,
    currency: input.asset.currency
  };
}

async function withClient<T>(
  wsUrl: string,
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client(wsUrl);
  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.disconnect();
  }
}

export function createXrplReadAdapter(): XrplReadAdapter {
  return {
    async trustlineStatus(input) {
      const wsUrl = getWsUrl(input.chainConfig);
      const asset = getIssuedCurrencyAsset(input);

      return withClient(wsUrl, async (client) => {
        try {
          const response = await client.request({
            command: "account_lines",
            account: input.address,
            peer: asset.issuer
          });

          const result = response.result as {
            lines?: Array<{
              account?: string;
              currency?: string;
              balance?: string;
              limit?: string;
            }>;
          };

          const matchingLine = (result.lines ?? []).find(
            (line) =>
              line.account === asset.issuer &&
              line.currency !== undefined &&
              currenciesMatch(line.currency, asset.currency)
          );

          if (!matchingLine) {
            return {
              present: false,
              account_exists: true
            } satisfies XrplTrustlineStatus;
          }

          const trustline: XrplTrustlineStatus = {
            present: true,
            account_exists: true
          };

          if (matchingLine.balance !== undefined) {
            trustline.balance = matchingLine.balance;
          }

          if (matchingLine.limit !== undefined) {
            trustline.limit = matchingLine.limit;
          }

          return trustline;
        } catch (error) {
          if (isActNotFoundError(error)) {
            return {
              present: false,
              account_exists: false
            } satisfies XrplTrustlineStatus;
          }

          throw error;
        }
      });
    },

    async accountInfo(input) {
      const wsUrl = getWsUrl(input.chainConfig);

      return withClient(wsUrl, async (client) => {
        try {
          const response = await client.request({
            command: "account_info",
            account: input.address,
            ledger_index: "validated"
          });

          const accountData = response.result.account_data;

          const accountInfo: XrplAccountInfo = {
            exists: true
          };

          if (typeof accountData?.Sequence === "number") {
            accountInfo.sequence = accountData.Sequence;
          }

          if (typeof accountData?.Balance === "string") {
            accountInfo.xrp_balance_drops = accountData.Balance;
          }

          return accountInfo;
        } catch (error) {
          if (isActNotFoundError(error)) {
            return {
              exists: false
            } satisfies XrplAccountInfo;
          }

          throw error;
        }
      });
    }
  };
}
