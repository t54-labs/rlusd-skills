import { Command, CommanderError } from "commander";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isAddress, type Hex } from "viem";

import {
  createReadAdapters,
  type ReadAdapters
} from "./adapters/index.js";
import {
  findBestSwapQuote,
  findSupplyPreview,
  listVenues,
  loadRegistry,
  resolveAsset,
  resolveChain
} from "./registry/index.js";
import {
  createErrorEnvelope,
  createSuccessEnvelope
} from "./schemas/envelope.js";
import { buildEvmApprovePlan, buildEvmTransferPlan } from "./plans/evm.js";
import { buildDefiSupplyPlan } from "./plans/defi.js";
import { createPreparedPlan, loadPreparedPlan } from "./plans/index.js";
import { buildXrplPaymentPlan, buildXrplTrustlinePlan } from "./plans/xrpl.js";
import { CliCommandError } from "./utils/errors.js";
import {
  createWalletResolver,
  type WalletResolver
} from "./wallets/index.js";
import {
  createTransactionMonitor,
  type TransactionMonitor
} from "./tx/index.js";

type CliIo = {
  writeStdout: (chunk: string) => void;
  writeStderr: (chunk: string) => void;
  now?: () => string;
  registryDir?: string;
  planDir?: string;
  adapters?: Partial<ReadAdapters>;
  walletResolver?: WalletResolver;
  txMonitor?: TransactionMonitor;
};

const defaultNow = (): string => new Date().toISOString();

const defaultIo: CliIo = {
  writeStdout: (chunk) => {
    process.stdout.write(chunk);
  },
  writeStderr: (chunk) => {
    process.stderr.write(chunk);
  },
  now: defaultNow
};

function toJsonLine(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

function getTimestamp(io: CliIo): string {
  return (io.now ?? defaultNow)();
}

function getPlanDir(io: CliIo): string {
  return io.planDir ?? path.resolve(process.cwd(), ".rlusd", "plans");
}

function getWalletResolver(io: CliIo): WalletResolver {
  return io.walletResolver ?? createWalletResolver();
}

function getTxMonitor(io: CliIo): TransactionMonitor {
  return io.txMonitor ?? createTransactionMonitor();
}

function getAdapters(io: CliIo): ReadAdapters {
  const defaultAdapters = createReadAdapters();

  return {
    evm: io.adapters?.evm ?? defaultAdapters.evm,
    xrpl: io.adapters?.xrpl ?? defaultAdapters.xrpl
  };
}

function parseCapabilityFilter(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((capability) => capability.trim())
    .filter((capability) => capability.length > 0);
}

function normalizeExecuteHex(
  value: unknown,
  label: string
): Hex {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Error(`Prepared plan is missing a valid hex ${label}.`);
  }

  return value as Hex;
}

function normalizeExecuteAddress(
  value: unknown,
  label: string
): `0x${string}` {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new Error(`Prepared plan is missing a valid address for ${label}.`);
  }

  return value;
}

function normalizeExecuteValue(value: unknown): bigint {
  if (typeof value !== "string") {
    throw new Error("Prepared plan is missing a valid transaction value.");
  }

  return BigInt(value);
}

function normalizeExecuteObject(
  value: unknown,
  label: string
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Prepared plan is missing a valid object for ${label}.`);
  }

  return value as Record<string, unknown>;
}

function normalizeEvmTransactionHash(
  command: string,
  chain: string,
  hash: string
): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new CliCommandError({
      command,
      chain,
      code: "INVALID_HASH",
      message: `Invalid EVM transaction hash: ${hash}`
    });
  }

  return hash as `0x${string}`;
}

function normalizeXrplTransactionHash(
  command: string,
  chain: string,
  hash: string
): string {
  if (!/^[0-9A-Fa-f]{64}$/.test(hash)) {
    throw new CliCommandError({
      command,
      chain,
      code: "INVALID_HASH",
      message: `Invalid XRPL transaction hash: ${hash}`
    });
  }

  return hash.toUpperCase();
}

function requirePlanParam(
  command: string,
  chain: string,
  params: Record<string, string>,
  key: string
): string {
  const value = params[key];
  if (value === undefined) {
    throw new CliCommandError({
      command,
      chain,
      code: "PLAN_LOAD_FAILED",
      message: `Prepared plan is missing required parameter "${key}".`
    });
  }

  return value;
}

async function loadPlanForExecution(
  command: string,
  expectedAction: string,
  planPath: string
) {
  try {
    const plan = await loadPreparedPlan(planPath);

    if (plan.data.action !== expectedAction) {
      throw new CliCommandError({
        command,
        chain: plan.chain,
        code: "PLAN_ACTION_MISMATCH",
        message: `Prepared plan action ${plan.data.action} cannot be executed with ${command}.`
      });
    }

    return plan;
  } catch (error) {
    if (error instanceof CliCommandError) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.message ===
        "Prepared plan contents do not match the stored deterministic plan id."
    ) {
      throw new CliCommandError({
        command,
        code: "PLAN_INTEGRITY_MISMATCH",
        message: error.message
      });
    }

    throw new CliCommandError({
      command,
      code: "PLAN_LOAD_FAILED",
      message:
        error instanceof Error ? error.message : "Unable to load prepared plan."
    });
  }
}

function requireConfirmedExecution(
  command: string,
  plan: Awaited<ReturnType<typeof loadPreparedPlan>>,
  confirmPlanId: string | undefined
): void {
  if (
    plan.data.requires_confirmation &&
    confirmPlanId !== plan.data.plan_id
  ) {
    throw new CliCommandError({
      command,
      chain: plan.chain,
      code: "CONFIRMATION_REQUIRED",
      message:
        "Execution requires an explicit confirmation matching the prepared plan id."
    });
  }
}

async function resolveExecuteSigner(
  command: string,
  chainKey: string,
  sender: string,
  io: CliIo
) {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, chainKey);

  try {
    return await getWalletResolver(io).resolveEvmSigner({
      sender,
      chain: chainConfig
    });
  } catch (error) {
    throw new CliCommandError({
      command,
      chain: chainKey,
      code: "SIGNER_RESOLUTION_FAILED",
      message:
        error instanceof Error ? error.message : "Unable to resolve signer."
    });
  }
}

async function resolvePreparedEvmAddress(
  command: string,
  chainKey: string,
  sender: string,
  io: CliIo
): Promise<`0x${string}`> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, chainKey);

  try {
    return await getWalletResolver(io).resolveEvmAddress({
      sender,
      chain: chainConfig
    });
  } catch (error) {
    throw new CliCommandError({
      command,
      chain: chainKey,
      code: "ADDRESS_RESOLUTION_FAILED",
      message:
        error instanceof Error ? error.message : "Unable to resolve sender address."
    });
  }
}

async function resolveExecuteXrplSigner(
  command: string,
  chainKey: string,
  sender: string,
  io: CliIo
) {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, chainKey);

  try {
    return await getWalletResolver(io).resolveXrplSigner({
      sender,
      chain: chainConfig
    });
  } catch (error) {
    throw new CliCommandError({
      command,
      chain: chainKey,
      code: "SIGNER_RESOLUTION_FAILED",
      message:
        error instanceof Error ? error.message : "Unable to resolve signer."
    });
  }
}

async function resolvePreparedXrplAddress(
  command: string,
  chainKey: string,
  sender: string,
  io: CliIo
): Promise<string> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, chainKey);

  try {
    return await getWalletResolver(io).resolveXrplAddress({
      sender,
      chain: chainConfig
    });
  } catch (error) {
    throw new CliCommandError({
      command,
      chain: chainKey,
      code: "ADDRESS_RESOLUTION_FAILED",
      message:
        error instanceof Error ? error.message : "Unable to resolve sender address."
    });
  }
}

async function handleResolveAsset(
  options: { chain: string; symbol: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const asset = resolveAsset(registry, options.chain, options.symbol);

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "resolve.asset",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: asset
      })
    )
  );
}

async function handleFiatOnboardingChecklist(io: CliIo): Promise<void> {
  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "fiat.onboarding.checklist",
        timestamp: getTimestamp(io),
        data: {
          checklist: [
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
          ]
        },
        warnings: ["manual_process", "institutional_flow"]
      })
    )
  );
}

async function handleFiatBuyInstructions(
  options: { walletId: string; chain: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  let chainConfig;
  try {
    chainConfig = resolveChain(registry, options.chain);
  } catch (error) {
    throw new CliCommandError({
      command: "fiat.buy.instructions",
      chain: options.chain,
      code: "UNSUPPORTED_CHAIN",
      message: error instanceof Error ? error.message : "Unsupported chain."
    });
  }

  const warnings = ["manual_process", "bank_wire_required"];
  const instructions = [
    {
      step: "Complete Ripple onboarding and approval"
    },
    {
      step: "Confirm the funding bank account is already registered with Ripple"
    },
    {
      step: `Use wallet ID ${options.walletId} as the wire reference or memo`
    }
  ];

  if (chainConfig.family === "xrpl") {
    warnings.push("xrpl_trustline_required");
    instructions.push({
      step: "Create an RLUSD trust line on XRPL before funding"
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "fiat.buy.instructions",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          wallet_id: options.walletId,
          chain: options.chain,
          instructions
        },
        warnings
      })
    )
  );
}

async function handleFiatRedeemInstructions(
  options: { walletId: string; amount: string },
  io: CliIo
): Promise<void> {
  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "fiat.redeem.instructions",
        timestamp: getTimestamp(io),
        data: {
          wallet_id: options.walletId,
          amount: options.amount,
          instructions: [
            {
              step: "Confirm Ripple onboarding remains active for redemption"
            },
            {
              step: "Use an approved bank account for redemption settlement"
            },
            {
              step: `Follow the Ripple UI redemption flow for wallet ${options.walletId}`
            }
          ]
        },
        warnings: ["manual_process", "banking_rail_timing"]
      })
    )
  );
}

async function handleDefiVenues(
  options: { chain: string; capability?: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  try {
    resolveChain(registry, options.chain);
  } catch (error) {
    throw new CliCommandError({
      command: "defi.venues",
      chain: options.chain,
      code: "UNSUPPORTED_CHAIN",
      message: error instanceof Error ? error.message : "Unsupported chain."
    });
  }
  const capabilityFilter = parseCapabilityFilter(options.capability);
  const venues = listVenues(registry, {
    chain: options.chain,
    capabilities: capabilityFilter
  }).map((venue) => ({
    venue: venue.venue,
    capabilities: venue.capabilities,
    approval_mode: venue.approval_mode,
    collateral_supported: venue.collateral_supported,
    status: venue.status,
    notes: venue.notes
  }));

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "defi.venues",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          capability_filter: capabilityFilter,
          venues
        }
      })
    )
  );
}

async function handleDefiQuoteSwap(
  options: { chain: string; from: string; to: string; amount: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  try {
    resolveChain(registry, options.chain);
  } catch (error) {
    throw new CliCommandError({
      command: "defi.quote.swap",
      chain: options.chain,
      code: "UNSUPPORTED_CHAIN",
      message: error instanceof Error ? error.message : "Unsupported chain."
    });
  }
  const quote = findBestSwapQuote(registry, options);

  if (!quote) {
    throw new CliCommandError({
      command: "defi.quote.swap",
      chain: options.chain,
      code: "QUOTE_UNAVAILABLE",
      message: `No preview swap quote is available for ${options.from} -> ${options.to} on ${options.chain}.`,
      next: [
        {
          command: `rlusd defi venues --chain ${options.chain} --capability swap --json`
        }
      ]
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "defi.quote.swap",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          request: {
            from: options.from,
            to: options.to,
            amount: options.amount
          },
          route: {
            venue: quote.venue,
            pricing_source: quote.pricing_source,
            rate: quote.rate,
            reference_rate_is_net_of_fee: quote.reference_rate_is_net_of_fee,
            amount_out: quote.amount_out,
            amount_out_is_net_of_fee: quote.amount_out_is_net_of_fee,
            fee_bps: quote.fee_bps
          },
          considered_venues: quote.considered_venues
        },
        warnings: ["not_live_market_data", "preview_only"]
      })
    )
  );
}

async function handleDefiSupplyPreview(
  options: { chain: string; venue: string; amount: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  try {
    resolveChain(registry, options.chain);
  } catch (error) {
    throw new CliCommandError({
      command: "defi.supply.preview",
      chain: options.chain,
      code: "UNSUPPORTED_CHAIN",
      message: error instanceof Error ? error.message : "Unsupported chain."
    });
  }

  const venue = listVenues(registry, {
    chain: options.chain
  }).find((candidate) => candidate.venue === options.venue);

  if (!venue) {
    throw new CliCommandError({
      command: "defi.supply.preview",
      chain: options.chain,
      code: "VENUE_UNAVAILABLE",
      message: `Venue ${options.venue} is not configured on ${options.chain}.`
    });
  }

  if (!venue.capabilities.includes("lend")) {
    throw new CliCommandError({
      command: "defi.supply.preview",
      chain: options.chain,
      code: "CAPABILITY_UNSUPPORTED",
      message: `Venue ${options.venue} does not support lend on ${options.chain}.`,
      next: [
        {
          command: `rlusd defi venues --chain ${options.chain} --capability lend --json`
        }
      ]
    });
  }

  const preview = findSupplyPreview(registry, options);
  if (!preview) {
    throw new CliCommandError({
      command: "defi.supply.preview",
      chain: options.chain,
      code: "PREVIEW_UNAVAILABLE",
      message: `No preview supply data is available for ${options.venue} on ${options.chain}.`
    });
  }

  const warnings = ["not_live_market_data", "preview_only"];
  if (!preview.collateral_supported) {
    warnings.push("collateral_unsupported");
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "defi.supply.preview",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: preview,
        warnings
      })
    )
  );
}

async function handleDefiSupplyPrepare(
  options: { chain: string; venue: string; from: string; amount: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  let chainConfig;
  try {
    chainConfig = resolveChain(registry, options.chain);
  } catch (error) {
    throw new CliCommandError({
      command: "defi.supply.prepare",
      chain: options.chain,
      code: "UNSUPPORTED_CHAIN",
      message: error instanceof Error ? error.message : "Unsupported chain."
    });
  }
  const venue = listVenues(registry, {
    chain: options.chain
  }).find((candidate) => candidate.venue === options.venue);

  if (!venue) {
    throw new CliCommandError({
      command: "defi.supply.prepare",
      chain: options.chain,
      code: "VENUE_UNAVAILABLE",
      message: `Venue ${options.venue} is not configured on ${options.chain}.`
    });
  }

  if (!venue.capabilities.includes("lend")) {
    throw new CliCommandError({
      command: "defi.supply.prepare",
      chain: options.chain,
      code: "CAPABILITY_UNSUPPORTED",
      message: `Venue ${options.venue} does not support lend on ${options.chain}.`,
      next: [
        {
          command: `rlusd defi venues --chain ${options.chain} --capability lend --json`
        }
      ]
    });
  }

  const preview = findSupplyPreview(registry, {
    chain: options.chain,
    venue: options.venue,
    amount: options.amount
  });
  if (!preview) {
    throw new CliCommandError({
      command: "defi.supply.prepare",
      chain: options.chain,
      code: "PREVIEW_UNAVAILABLE",
      message: `No preview supply data is available for ${options.venue} on ${options.chain}.`
    });
  }

  const asset = resolveAsset(registry, options.chain, preview.asset_symbol);
  const fromAddress = await resolvePreparedEvmAddress(
    "defi.supply.prepare",
    options.chain,
    options.from,
    io
  );
  const plan = await createPreparedPlan({
    command: "defi.supply.prepare",
    chain: options.chain,
    timestamp: getTimestamp(io),
    planDir: getPlanDir(io),
    asset,
    ...buildDefiSupplyPlan({
      chain: options.chain,
      chainDisplayName: chainConfig.display_name,
      venue: options.venue,
      from: options.from,
      fromAddress,
      amount: options.amount,
      asset,
      preview
    })
  });

  io.writeStdout(toJsonLine(plan));
}

async function handleEvmBalance(
  options: { chain: string; address: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const balance = await getAdapters(io).evm.balance({
    chain: options.chain,
    chainConfig,
    address: options.address,
    asset
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "evm.balance",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          address: options.address,
          asset,
          balance
        }
      })
    )
  );
}

async function handleEvmAllowance(
  options: { chain: string; owner: string; spender: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const allowance = await getAdapters(io).evm.allowance({
    chain: options.chain,
    chainConfig,
    owner: options.owner,
    spender: options.spender,
    asset
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "evm.allowance",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          owner: options.owner,
          spender: options.spender,
          asset,
          allowance
        }
      })
    )
  );
}

async function handleEvmTransferPrepare(
  options: { chain: string; from: string; to: string; amount: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const plan = await createPreparedPlan({
    command: "evm.transfer.prepare",
    chain: options.chain,
    timestamp: getTimestamp(io),
    planDir: getPlanDir(io),
    asset,
    ...buildEvmTransferPlan({
      chain: options.chain,
      chainDisplayName: chainConfig.display_name,
      from: options.from,
      to: options.to,
      amount: options.amount,
      asset
    })
  });

  io.writeStdout(toJsonLine(plan));
}

async function handleEvmApprovePrepare(
  options: { chain: string; owner: string; spender: string; amount: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const plan = await createPreparedPlan({
    command: "evm.approve.prepare",
    chain: options.chain,
    timestamp: getTimestamp(io),
    planDir: getPlanDir(io),
    asset,
    ...buildEvmApprovePlan({
      chain: options.chain,
      chainDisplayName: chainConfig.display_name,
      owner: options.owner,
      spender: options.spender,
      amount: options.amount,
      asset
    })
  });

  io.writeStdout(toJsonLine(plan));
}

async function handleEvmTransferExecute(
  options: { plan: string; confirmPlanId?: string },
  io: CliIo
): Promise<void> {
  const plan = await loadPlanForExecution(
    "evm.transfer.execute",
    "evm.transfer",
    options.plan
  );

  requireConfirmedExecution(
    "evm.transfer.execute",
    plan,
    options.confirmPlanId
  );

  const signer = await resolveExecuteSigner(
    "evm.transfer.execute",
    plan.chain,
    requirePlanParam(
      "evm.transfer.execute",
      plan.chain,
      plan.data.params,
      "from"
    ),
    io
  );

  let txHash: `0x${string}`;
  try {
    txHash = await signer.sendTransaction({
      to: normalizeExecuteAddress(plan.data.intent.to, "to"),
      data: normalizeExecuteHex(plan.data.intent.data, "data"),
      value: normalizeExecuteValue(plan.data.intent.value)
    });
  } catch (error) {
    throw new CliCommandError({
      command: "evm.transfer.execute",
      chain: plan.chain,
      code: "EXECUTION_FAILED",
      message:
        error instanceof Error ? error.message : "EVM transaction execution failed."
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "evm.transfer.execute",
        chain: plan.chain,
        timestamp: getTimestamp(io),
        data: {
          plan_id: plan.data.plan_id,
          plan_path: options.plan,
          action: plan.data.action,
          tx_hash: txHash,
          signer: {
            address: signer.address,
            kind: signer.kind
          }
        },
        warnings: plan.warnings
      })
    )
  );
}

async function handleEvmApproveExecute(
  options: { plan: string; confirmPlanId?: string },
  io: CliIo
): Promise<void> {
  const plan = await loadPlanForExecution(
    "evm.approve.execute",
    "evm.approve",
    options.plan
  );

  requireConfirmedExecution(
    "evm.approve.execute",
    plan,
    options.confirmPlanId
  );

  const signer = await resolveExecuteSigner(
    "evm.approve.execute",
    plan.chain,
    requirePlanParam(
      "evm.approve.execute",
      plan.chain,
      plan.data.params,
      "owner"
    ),
    io
  );

  let txHash: `0x${string}`;
  try {
    txHash = await signer.sendTransaction({
      to: normalizeExecuteAddress(plan.data.intent.to, "to"),
      data: normalizeExecuteHex(plan.data.intent.data, "data"),
      value: normalizeExecuteValue(plan.data.intent.value)
    });
  } catch (error) {
    throw new CliCommandError({
      command: "evm.approve.execute",
      chain: plan.chain,
      code: "EXECUTION_FAILED",
      message:
        error instanceof Error ? error.message : "EVM transaction execution failed."
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "evm.approve.execute",
        chain: plan.chain,
        timestamp: getTimestamp(io),
        data: {
          plan_id: plan.data.plan_id,
          plan_path: options.plan,
          action: plan.data.action,
          tx_hash: txHash,
          signer: {
            address: signer.address,
            kind: signer.kind
          }
        },
        warnings: plan.warnings
      })
    )
  );
}

async function handleXrplTrustlineExecute(
  options: { plan: string; confirmPlanId?: string },
  io: CliIo
): Promise<void> {
  const plan = await loadPlanForExecution(
    "xrpl.trustline.execute",
    "xrpl.trustline",
    options.plan
  );

  requireConfirmedExecution(
    "xrpl.trustline.execute",
    plan,
    options.confirmPlanId
  );

  const signer = await resolveExecuteXrplSigner(
    "xrpl.trustline.execute",
    plan.chain,
    requirePlanParam(
      "xrpl.trustline.execute",
      plan.chain,
      plan.data.params,
      "address"
    ),
    io
  );

  let txHash: string;
  try {
    txHash = await signer.sendTransaction({
      tx_json: normalizeExecuteObject(plan.data.intent.tx_json, "tx_json")
    });
  } catch (error) {
    throw new CliCommandError({
      command: "xrpl.trustline.execute",
      chain: plan.chain,
      code: "EXECUTION_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "XRPL transaction execution failed."
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "xrpl.trustline.execute",
        chain: plan.chain,
        timestamp: getTimestamp(io),
        data: {
          plan_id: plan.data.plan_id,
          plan_path: options.plan,
          action: plan.data.action,
          tx_hash: txHash,
          signer: {
            address: signer.address,
            kind: signer.kind
          }
        },
        warnings: plan.warnings
      })
    )
  );
}

async function handleXrplPaymentExecute(
  options: { plan: string; confirmPlanId?: string },
  io: CliIo
): Promise<void> {
  const plan = await loadPlanForExecution(
    "xrpl.payment.execute",
    "xrpl.payment",
    options.plan
  );

  requireConfirmedExecution(
    "xrpl.payment.execute",
    plan,
    options.confirmPlanId
  );

  const signer = await resolveExecuteXrplSigner(
    "xrpl.payment.execute",
    plan.chain,
    requirePlanParam(
      "xrpl.payment.execute",
      plan.chain,
      plan.data.params,
      "from"
    ),
    io
  );

  let txHash: string;
  try {
    txHash = await signer.sendTransaction({
      tx_json: normalizeExecuteObject(plan.data.intent.tx_json, "tx_json")
    });
  } catch (error) {
    throw new CliCommandError({
      command: "xrpl.payment.execute",
      chain: plan.chain,
      code: "EXECUTION_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "XRPL transaction execution failed."
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "xrpl.payment.execute",
        chain: plan.chain,
        timestamp: getTimestamp(io),
        data: {
          plan_id: plan.data.plan_id,
          plan_path: options.plan,
          action: plan.data.action,
          tx_hash: txHash,
          signer: {
            address: signer.address,
            kind: signer.kind
          }
        },
        warnings: plan.warnings
      })
    )
  );
}

async function handleDefiSupplyExecute(
  options: { plan: string; confirmPlanId?: string },
  io: CliIo
): Promise<void> {
  const plan = await loadPlanForExecution(
    "defi.supply.execute",
    "defi.supply",
    options.plan
  );

  requireConfirmedExecution(
    "defi.supply.execute",
    plan,
    options.confirmPlanId
  );

  const signer = await resolveExecuteSigner(
    "defi.supply.execute",
    plan.chain,
    requirePlanParam(
      "defi.supply.execute",
      plan.chain,
      plan.data.params,
      "from"
    ),
    io
  );

  const steps = normalizeExecuteObject(plan.data.intent, "intent").steps;
  if (!Array.isArray(steps)) {
    throw new CliCommandError({
      command: "defi.supply.execute",
      chain: plan.chain,
      code: "PLAN_LOAD_FAILED",
      message: 'Prepared plan is missing a valid "steps" array.'
    });
  }

  const stepResults: Array<{ step: string; tx_hash: `0x${string}` }> = [];

  for (const step of steps) {
    const normalizedStep = normalizeExecuteObject(step, "step");
    const stepName = normalizedStep.step;
    if (typeof stepName !== "string") {
      throw new CliCommandError({
        command: "defi.supply.execute",
        chain: plan.chain,
        code: "PLAN_LOAD_FAILED",
        message: 'Prepared plan step is missing a valid "step" name.'
      });
    }

    let txHash: `0x${string}`;
    try {
      txHash = await signer.sendTransaction({
        to: normalizeExecuteAddress(normalizedStep.token_address ?? normalizedStep.pool_address, "to"),
        data: normalizeExecuteHex(normalizedStep.data, "data"),
        value: normalizeExecuteValue(normalizedStep.value)
      });
    } catch (error) {
      throw new CliCommandError({
        command: "defi.supply.execute",
        chain: plan.chain,
        code: "EXECUTION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "DeFi supply execution failed."
      });
    }

    stepResults.push({
      step: stepName,
      tx_hash: txHash
    });
  }

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "defi.supply.execute",
        chain: plan.chain,
        timestamp: getTimestamp(io),
        data: {
          plan_id: plan.data.plan_id,
          plan_path: options.plan,
          action: plan.data.action,
          signer: {
            address: signer.address,
            kind: signer.kind
          },
          steps: stepResults
        },
        warnings: plan.warnings
      })
    )
  );
}

async function handleXrplTrustlineStatus(
  options: { chain: string; address: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const trustline = await getAdapters(io).xrpl.trustlineStatus({
    chain: options.chain,
    chainConfig,
    address: options.address,
    asset
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "xrpl.trustline.status",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          address: options.address,
          asset,
          trustline
        }
      })
    )
  );
}

async function handleXrplAccountInfo(
  options: { chain: string; address: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const account = await getAdapters(io).xrpl.accountInfo({
    chain: options.chain,
    chainConfig,
    address: options.address
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "xrpl.account.info",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: {
          address: options.address,
          account
        }
      })
    )
  );
}

async function handleXrplTrustlinePrepare(
  options: { chain: string; address: string; limit: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const plan = await createPreparedPlan({
    command: "xrpl.trustline.prepare",
    chain: options.chain,
    timestamp: getTimestamp(io),
    planDir: getPlanDir(io),
    asset,
    ...buildXrplTrustlinePlan({
      chain: options.chain,
      chainDisplayName: chainConfig.display_name,
      address: options.address,
      limit: options.limit,
      asset
    })
  });

  io.writeStdout(toJsonLine(plan));
}

async function handleXrplPaymentPrepare(
  options: { chain: string; from: string; to: string; amount: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const asset = resolveAsset(registry, options.chain, "RLUSD");
  const senderAddress = await resolvePreparedXrplAddress(
    "xrpl.payment.prepare",
    options.chain,
    options.from,
    io
  );
  const paymentPlan = buildXrplPaymentPlan({
    chain: options.chain,
    chainDisplayName: chainConfig.display_name,
    from: options.from,
    fromAddress: senderAddress,
    to: options.to,
    amount: options.amount,
    asset
  });
  const destinationTrustline = await getAdapters(io).xrpl.trustlineStatus({
    chain: options.chain,
    chainConfig,
    address: paymentPlan.params.to,
    asset
  });

  if (!destinationTrustline.present) {
    if (destinationTrustline.account_exists === false) {
      throw new CliCommandError({
        command: "xrpl.payment.prepare",
        chain: options.chain,
        code: "DESTINATION_ACCOUNT_MISSING",
        message: "Destination XRPL account does not exist or is not activated.",
        next: [
          {
            command: `rlusd xrpl account info --chain ${options.chain} --address ${paymentPlan.params.to} --json`
          }
        ]
      });
    }

    throw new CliCommandError({
      command: "xrpl.payment.prepare",
      chain: options.chain,
      code: "TRUSTLINE_MISSING",
      message:
        "Destination account does not currently have an RLUSD trust line.",
      next: [
        {
          command: `rlusd xrpl trustline status --chain ${options.chain} --address ${paymentPlan.params.to} --json`
        }
      ]
    });
  }

  const plan = await createPreparedPlan({
    command: "xrpl.payment.prepare",
    chain: options.chain,
    timestamp: getTimestamp(io),
    planDir: getPlanDir(io),
    asset,
    ...paymentPlan
  });

  io.writeStdout(toJsonLine(plan));
}

async function handleEvmTxWait(
  options: { chain: string; hash: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const status = await getTxMonitor(io).waitForEvmTransaction({
    chain: options.chain,
    chainConfig,
    hash: normalizeEvmTransactionHash(
      "evm.tx.wait",
      options.chain,
      options.hash
    )
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "evm.tx.wait",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: status
      })
    )
  );
}

async function handleEvmTxReceipt(
  options: { chain: string; hash: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const receipt = await getTxMonitor(io).getEvmReceipt({
    chain: options.chain,
    chainConfig,
    hash: normalizeEvmTransactionHash(
      "evm.tx.receipt",
      options.chain,
      options.hash
    )
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "evm.tx.receipt",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: receipt
      })
    )
  );
}

async function handleXrplTxWait(
  options: { chain: string; hash: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const status = await getTxMonitor(io).waitForXrplTransaction({
    chain: options.chain,
    chainConfig,
    hash: normalizeXrplTransactionHash(
      "xrpl.tx.wait",
      options.chain,
      options.hash
    )
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "xrpl.tx.wait",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: status
      })
    )
  );
}

async function handleXrplPaymentReceipt(
  options: { chain: string; hash: string },
  io: CliIo
): Promise<void> {
  const registry = await loadRegistry(io.registryDir);
  const chainConfig = resolveChain(registry, options.chain);
  const receipt = await getTxMonitor(io).getXrplPaymentReceipt({
    chain: options.chain,
    chainConfig,
    hash: normalizeXrplTransactionHash(
      "xrpl.payment.receipt",
      options.chain,
      options.hash
    )
  });

  io.writeStdout(
    toJsonLine(
      createSuccessEnvelope({
        command: "xrpl.payment.receipt",
        chain: options.chain,
        timestamp: getTimestamp(io),
        data: receipt
      })
    )
  );
}

export function createCli(io: CliIo = defaultIo): Command {
  const program = new Command();

  program
    .name("rlusd")
    .description("Deterministic RLUSD agent CLI")
    .option("--json", "Output machine-readable JSON");

  const resolveCommand = program
    .command("resolve")
    .description("Resolve registry-backed RLUSD metadata");

  resolveCommand
    .command("asset")
    .description("Resolve an asset for a specific chain")
    .requiredOption("--chain <chain>", "Target chain key")
    .option("--symbol <symbol>", "Asset symbol", "RLUSD")
    .action(async (options: { chain: string; symbol: string }) => {
      await handleResolveAsset(options, io);
    });

  const fiatCommand = program
    .command("fiat")
    .description("Generate guidance for Ripple onboarding, buy, and redeem flows");

  fiatCommand
    .command("onboarding")
    .description("Onboarding guidance")
    .command("checklist")
    .description("Print the Ripple onboarding checklist")
    .action(async () => {
      await handleFiatOnboardingChecklist(io);
    });

  fiatCommand
    .command("buy")
    .description("Buy guidance")
    .command("instructions")
    .description("Print parameterized buy instructions")
    .requiredOption("--wallet-id <walletId>", "Ripple wallet id reference")
    .requiredOption("--chain <chain>", "Target chain key")
    .action(async (options: { walletId: string; chain: string }) => {
      await handleFiatBuyInstructions(options, io);
    });

  fiatCommand
    .command("redeem")
    .description("Redeem guidance")
    .command("instructions")
    .description("Print parameterized redeem instructions")
    .requiredOption("--wallet-id <walletId>", "Ripple wallet id reference")
    .requiredOption("--amount <amount>", "Redemption amount")
    .action(async (options: { walletId: string; amount: string }) => {
      await handleFiatRedeemInstructions(options, io);
    });

  const defiCommand = program
    .command("defi")
    .description("Preview RLUSD DeFi venues and routes");

  defiCommand
    .command("venues")
    .description("List registry-backed DeFi venues")
    .requiredOption("--chain <chain>", "Target chain key")
    .option(
      "--capability <capabilities>",
      "Comma-separated capability filter"
    )
    .action(async (options: { chain: string; capability?: string }) => {
      await handleDefiVenues(options, io);
    });

  const defiQuoteCommand = defiCommand
    .command("quote")
    .description("Preview DeFi quotes");

  defiQuoteCommand
    .command("swap")
    .description("Preview a registry-backed swap quote")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--from <symbol>", "Input asset symbol")
    .requiredOption("--to <symbol>", "Output asset symbol")
    .requiredOption("--amount <amount>", "Input amount")
    .action(
      async (options: {
        chain: string;
        from: string;
        to: string;
        amount: string;
      }) => {
        await handleDefiQuoteSwap(options, io);
      }
    );

  const defiSupplyCommand = defiCommand
    .command("supply")
    .description("Preview and prepare DeFi supply actions");

  defiSupplyCommand
    .command("preview")
    .description("Preview a registry-backed supply route")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--venue <venue>", "Target DeFi venue")
    .requiredOption("--amount <amount>", "Supply amount")
    .action(
      async (options: {
        chain: string;
        venue: string;
        amount: string;
      }) => {
        await handleDefiSupplyPreview(options, io);
      }
    );

  defiSupplyCommand
    .command("prepare")
    .description("Prepare a registry-backed DeFi supply plan")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--venue <venue>", "Target DeFi venue")
    .requiredOption("--from <from>", "Sender wallet alias or address")
    .requiredOption("--amount <amount>", "Supply amount")
    .action(
      async (options: {
        chain: string;
        venue: string;
        from: string;
        amount: string;
      }) => {
        await handleDefiSupplyPrepare(options, io);
      }
    );

  defiSupplyCommand
    .command("execute")
    .description("Execute a prepared registry-backed DeFi supply plan")
    .requiredOption("--plan <path>", "Path to a prepared plan file")
    .option(
      "--confirm-plan-id <planId>",
      "Explicit confirmation matching the prepared plan id"
    )
    .action(
      async (options: { plan: string; confirmPlanId?: string }) => {
        await handleDefiSupplyExecute(options, io);
      }
    );

  const evmCommand = program
    .command("evm")
    .description("Read and plan RLUSD actions on EVM chains");

  evmCommand
    .command("balance")
    .description("Read an RLUSD balance on an EVM chain")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--address <address>", "Owner address")
    .action(async (options: { chain: string; address: string }) => {
      await handleEvmBalance(options, io);
    });

  evmCommand
    .command("allowance")
    .description("Read an RLUSD allowance on an EVM chain")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--owner <address>", "Owner address")
    .requiredOption("--spender <address>", "Spender address")
    .action(
      async (options: { chain: string; owner: string; spender: string }) => {
        await handleEvmAllowance(options, io);
      }
    );

  const evmTransferCommand = evmCommand
    .command("transfer")
    .description("Plan and execute RLUSD transfers on EVM chains");

  evmTransferCommand
    .command("prepare")
    .description("Prepare an RLUSD transfer plan")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--from <from>", "Sender wallet alias or address")
    .requiredOption("--to <address>", "Recipient address")
    .requiredOption("--amount <amount>", "RLUSD amount")
    .action(
      async (options: {
        chain: string;
        from: string;
        to: string;
        amount: string;
      }) => {
        await handleEvmTransferPrepare(options, io);
      }
    );

  evmTransferCommand
    .command("execute")
    .description("Execute a prepared RLUSD transfer plan")
    .requiredOption("--plan <path>", "Path to a prepared plan file")
    .option(
      "--confirm-plan-id <planId>",
      "Explicit confirmation matching the prepared plan id"
    )
    .action(
      async (options: { plan: string; confirmPlanId?: string }) => {
        await handleEvmTransferExecute(options, io);
      }
    );

  const evmApproveCommand = evmCommand
    .command("approve")
    .description("Plan and execute RLUSD approvals on EVM chains");

  evmApproveCommand
    .command("prepare")
    .description("Prepare an RLUSD approval plan")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--owner <owner>", "Owner wallet alias or address")
    .requiredOption("--spender <address>", "Spender address")
    .requiredOption("--amount <amount>", "RLUSD amount")
    .action(
      async (options: {
        chain: string;
        owner: string;
        spender: string;
        amount: string;
      }) => {
        await handleEvmApprovePrepare(options, io);
      }
    );

  evmApproveCommand
    .command("execute")
    .description("Execute a prepared RLUSD approval plan")
    .requiredOption("--plan <path>", "Path to a prepared plan file")
    .option(
      "--confirm-plan-id <planId>",
      "Explicit confirmation matching the prepared plan id"
    )
    .action(
      async (options: { plan: string; confirmPlanId?: string }) => {
        await handleEvmApproveExecute(options, io);
      }
    );

  const evmTxCommand = evmCommand
    .command("tx")
    .description("Wait for and inspect EVM transaction status");

  evmTxCommand
    .command("wait")
    .description("Wait for an EVM transaction to be mined")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--hash <hash>", "Transaction hash")
    .action(async (options: { chain: string; hash: string }) => {
      await handleEvmTxWait(options, io);
    });

  evmTxCommand
    .command("receipt")
    .description("Read an EVM transaction receipt")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--hash <hash>", "Transaction hash")
    .action(async (options: { chain: string; hash: string }) => {
      await handleEvmTxReceipt(options, io);
    });

  const xrplCommand = program
    .command("xrpl")
    .description("Read and plan RLUSD issuer, trust line, and payment data on XRPL");

  const xrplTrustlineCommand = xrplCommand
    .command("trustline")
    .description("Read and plan RLUSD trust line data");

  xrplTrustlineCommand
    .command("status")
    .description("Read RLUSD trust line status for an XRPL account")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--address <address>", "XRPL account address")
    .action(async (options: { chain: string; address: string }) => {
      await handleXrplTrustlineStatus(options, io);
    });

  xrplTrustlineCommand
    .command("prepare")
    .description("Prepare an RLUSD trust line plan")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--address <address>", "XRPL account address")
    .requiredOption("--limit <limit>", "Trust line limit")
    .action(async (options: { chain: string; address: string; limit: string }) => {
      await handleXrplTrustlinePrepare(options, io);
    });

  xrplTrustlineCommand
    .command("execute")
    .description("Execute a prepared RLUSD trust line plan")
    .requiredOption("--plan <path>", "Path to a prepared plan file")
    .option(
      "--confirm-plan-id <planId>",
      "Explicit confirmation matching the prepared plan id"
    )
    .action(
      async (options: { plan: string; confirmPlanId?: string }) => {
        await handleXrplTrustlineExecute(options, io);
      }
    );

  xrplCommand
    .command("account")
    .description("Read XRPL account data")
    .command("info")
    .description("Read XRPL account info")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--address <address>", "XRPL account address")
    .action(async (options: { chain: string; address: string }) => {
      await handleXrplAccountInfo(options, io);
    });

  const xrplPaymentCommand = xrplCommand
    .command("payment")
    .description("Plan, execute, and inspect RLUSD payments on XRPL");

  xrplPaymentCommand
    .command("prepare")
    .description("Prepare an RLUSD payment plan")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--from <from>", "Sender wallet alias or address")
    .requiredOption("--to <address>", "Destination XRPL address")
    .requiredOption("--amount <amount>", "RLUSD amount")
    .action(
      async (options: {
        chain: string;
        from: string;
        to: string;
        amount: string;
      }) => {
        await handleXrplPaymentPrepare(options, io);
      }
    );

  xrplPaymentCommand
    .command("execute")
    .description("Execute a prepared RLUSD payment plan")
    .requiredOption("--plan <path>", "Path to a prepared plan file")
    .option(
      "--confirm-plan-id <planId>",
      "Explicit confirmation matching the prepared plan id"
    )
    .action(
      async (options: { plan: string; confirmPlanId?: string }) => {
        await handleXrplPaymentExecute(options, io);
      }
    );

  xrplPaymentCommand
    .command("receipt")
    .description("Read an XRPL payment receipt")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--hash <hash>", "Transaction hash")
    .action(async (options: { chain: string; hash: string }) => {
      await handleXrplPaymentReceipt(options, io);
    });

  const xrplTxCommand = xrplCommand
    .command("tx")
    .description("Wait for XRPL transaction validation");

  xrplTxCommand
    .command("wait")
    .description("Wait for an XRPL transaction to validate")
    .requiredOption("--chain <chain>", "Target chain key")
    .requiredOption("--hash <hash>", "Transaction hash")
    .action(async (options: { chain: string; hash: string }) => {
      await handleXrplTxWait(options, io);
    });

  return program;
}

export async function runCli(
  argv: string[],
  io: CliIo = defaultIo
): Promise<number> {
  const program = createCli(io);

  program.configureOutput({
    writeOut: (chunk) => {
      io.writeStdout(chunk);
    },
    writeErr: (chunk) => {
      io.writeStderr(chunk);
    },
    outputError: (chunk, write) => {
      write(chunk);
    }
  });

  program.exitOverride();

  try {
    await program.parseAsync(argv, { from: "user" });
    return 0;
  } catch (error) {
    if (
      error instanceof CommanderError &&
      (error.code === "commander.help" ||
        error.code === "commander.helpDisplayed")
    ) {
      return 0;
    }

    if (error instanceof CliCommandError) {
      const errorEnvelopeInput = {
        command: error.command,
        timestamp: getTimestamp(io),
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        warnings: error.warnings,
        next: error.next
      };

      io.writeStderr(
        toJsonLine(
          createErrorEnvelope({
            ...errorEnvelopeInput,
            ...(error.chain !== undefined ? { chain: error.chain } : {})
          })
        )
      );

      return 1;
    }

    if (argv.includes("--json")) {
      const message =
        error instanceof Error ? error.message : "Unknown CLI failure";

      io.writeStderr(
        toJsonLine(
          createErrorEnvelope({
            command: "unknown",
            timestamp: getTimestamp(io),
            code: "CLI_ERROR",
            message
          })
        )
      );
    } else if (error instanceof Error) {
      io.writeStderr(`${error.message}\n`);
    }

    return 1;
  }
}

async function main(): Promise<void> {
  const exitCode = await runCli(process.argv.slice(2), defaultIo);
  process.exitCode = exitCode;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main();
}
