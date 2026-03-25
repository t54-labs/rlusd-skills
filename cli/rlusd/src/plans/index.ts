import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ResolvedAsset } from "../registry/index.js";
import {
  createSuccessEnvelope,
  type SuccessEnvelope
} from "../schemas/envelope.js";
import { z } from "zod";

export type PreparedPlanIntent = {
  [key: string]: unknown;
};

export type PreparedPlanData<
  TParams extends Record<string, string>,
  TIntent extends PreparedPlanIntent
> = {
  plan_id: string;
  plan_path: string;
  action: string;
  requires_confirmation: boolean;
  human_summary: string;
  asset: ResolvedAsset;
  params: TParams;
  intent: TIntent;
};

type CreatePreparedPlanInput<
  TParams extends Record<string, string>,
  TIntent extends PreparedPlanIntent
> = {
  command: string;
  chain: string;
  timestamp: string;
  planDir: string;
  action: string;
  requires_confirmation: boolean;
  human_summary: string;
  asset: ResolvedAsset;
  params: TParams;
  intent: TIntent;
  warnings: string[];
  next?: Array<{ command: string }>;
};

const loadedPreparedPlanSchema = z.object({
  ok: z.literal(true),
  command: z.string(),
  chain: z.string(),
  timestamp: z.string(),
  data: z.object({
    plan_id: z.string(),
    plan_path: z.string(),
    action: z.string(),
    requires_confirmation: z.boolean(),
    human_summary: z.string(),
    asset: z.object({
      symbol: z.string(),
      name: z.string(),
      chain: z.string(),
      family: z.enum(["evm", "xrpl"]),
      address: z.string().optional(),
      address_type: z.string().optional(),
      implementation_address: z.string().optional(),
      decimals: z.number().int().optional(),
      issuer: z.string().optional(),
      currency: z.string().optional()
    }),
    params: z.record(z.string(), z.string()),
    intent: z.record(z.string(), z.unknown())
  }),
  warnings: z.array(z.string()),
  next: z.array(
    z.object({
      command: z.string()
    })
  )
});

export type LoadedPreparedPlan = z.infer<typeof loadedPreparedPlanSchema>;

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)
    );

    return `{${entries
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableSerialize(entryValue)}`
      )
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function createPlanId(value: unknown): string {
  const digest = createHash("sha256")
    .update(stableSerialize(value))
    .digest("hex");

  return `plan_${digest.slice(0, 12)}`;
}

export async function createPreparedPlan<
  TParams extends Record<string, string>,
  TIntent extends PreparedPlanIntent
>(
  input: CreatePreparedPlanInput<TParams, TIntent>
): Promise<SuccessEnvelope<PreparedPlanData<TParams, TIntent>>> {
  const planId = createPlanId({
    command: input.command,
    chain: input.chain,
    action: input.action,
    requires_confirmation: input.requires_confirmation,
    asset: input.asset,
    params: input.params,
    intent: input.intent,
    warnings: input.warnings
  });
  const planPath = path.join(input.planDir, `${planId}.json`);

  const envelope = createSuccessEnvelope({
    command: input.command,
    chain: input.chain,
    timestamp: input.timestamp,
    data: {
      plan_id: planId,
      plan_path: planPath,
      action: input.action,
      requires_confirmation: input.requires_confirmation,
      human_summary: input.human_summary,
      asset: input.asset,
      params: input.params,
      intent: input.intent
    },
    warnings: input.warnings,
    next: input.next ?? []
  });

  await mkdir(input.planDir, { recursive: true });
  await writeFile(planPath, JSON.stringify(envelope, null, 2));

  return envelope;
}

export async function loadPreparedPlan(
  planPath: string
): Promise<LoadedPreparedPlan> {
  const fileContents = await readFile(planPath, "utf8");
  const parsedPlan = loadedPreparedPlanSchema.parse(JSON.parse(fileContents));

  const expectedPlanId = createPlanId({
    command: parsedPlan.command,
    chain: parsedPlan.chain,
    action: parsedPlan.data.action,
    requires_confirmation: parsedPlan.data.requires_confirmation,
    asset: parsedPlan.data.asset,
    params: parsedPlan.data.params,
    intent: parsedPlan.data.intent,
    warnings: parsedPlan.warnings
  });

  if (parsedPlan.data.plan_id !== expectedPlanId) {
    throw new Error(
      "Prepared plan contents do not match the stored deterministic plan id."
    );
  }

  return parsedPlan;
}
