import type { RegistryChain, ResolvedAsset } from "../registry/index.js";

export type FormattedTokenAmount = {
  raw: string;
  formatted: string;
};

export type EvmBalanceInput = {
  chain: string;
  chainConfig: RegistryChain;
  address: string;
  asset: ResolvedAsset;
};

export type EvmAllowanceInput = {
  chain: string;
  chainConfig: RegistryChain;
  owner: string;
  spender: string;
  asset: ResolvedAsset;
};

export type XrplTrustlineStatusInput = {
  chain: string;
  chainConfig: RegistryChain;
  address: string;
  asset: ResolvedAsset;
};

export type XrplAccountInfoInput = {
  chain: string;
  chainConfig: RegistryChain;
  address: string;
};

export type XrplTrustlineStatus = {
  present: boolean;
  balance?: string;
  limit?: string;
  account_exists?: boolean;
};

export type XrplAccountInfo = {
  exists: boolean;
  sequence?: number;
  xrp_balance_drops?: string;
};

export interface EvmReadAdapter {
  balance(input: EvmBalanceInput): Promise<FormattedTokenAmount>;
  allowance(input: EvmAllowanceInput): Promise<FormattedTokenAmount>;
}

export interface XrplReadAdapter {
  trustlineStatus(input: XrplTrustlineStatusInput): Promise<XrplTrustlineStatus>;
  accountInfo(input: XrplAccountInfoInput): Promise<XrplAccountInfo>;
}

export type ReadAdapters = {
  evm: EvmReadAdapter;
  xrpl: XrplReadAdapter;
};
