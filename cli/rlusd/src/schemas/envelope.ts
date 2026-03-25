import { z } from "zod";

const nextStepSchema = z.object({
  command: z.string()
});

const successEnvelopeSchema = z.object({
  ok: z.literal(true),
  command: z.string(),
  chain: z.string().optional(),
  timestamp: z.string(),
  data: z.unknown(),
  warnings: z.array(z.string()),
  next: z.array(nextStepSchema)
});

const errorEnvelopeSchema = z.object({
  ok: z.literal(false),
  command: z.string(),
  chain: z.string().optional(),
  timestamp: z.string(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean()
  }),
  warnings: z.array(z.string()),
  next: z.array(nextStepSchema)
});

export type SuccessEnvelope<TData> = z.infer<typeof successEnvelopeSchema> & {
  data: TData;
};

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

type EnvelopeInput<TData> = {
  command: string;
  chain?: string;
  timestamp: string;
  data: TData;
  warnings?: string[];
  next?: Array<{ command: string }>;
};

type ErrorEnvelopeInput = {
  command: string;
  chain?: string;
  timestamp: string;
  code: string;
  message: string;
  retryable?: boolean;
  warnings?: string[];
  next?: Array<{ command: string }>;
};

export function createSuccessEnvelope<TData>(
  input: EnvelopeInput<TData>
): SuccessEnvelope<TData> {
  return successEnvelopeSchema.parse({
    ok: true,
    command: input.command,
    chain: input.chain,
    timestamp: input.timestamp,
    data: input.data,
    warnings: input.warnings ?? [],
    next: input.next ?? []
  }) as SuccessEnvelope<TData>;
}

export function createErrorEnvelope(input: ErrorEnvelopeInput): ErrorEnvelope {
  return errorEnvelopeSchema.parse({
    ok: false,
    command: input.command,
    chain: input.chain,
    timestamp: input.timestamp,
    error: {
      code: input.code,
      message: input.message,
      retryable: input.retryable ?? false
    },
    warnings: input.warnings ?? [],
    next: input.next ?? []
  });
}
