import { createViemReadAdapter } from "./evm.js";
import { createXrplReadAdapter } from "./xrpl.js";
import type { ReadAdapters } from "./types.js";

export function createReadAdapters(
  env: NodeJS.ProcessEnv = process.env
): ReadAdapters {
  return {
    evm: createViemReadAdapter(env),
    xrpl: createXrplReadAdapter()
  };
}

export type { ReadAdapters } from "./types.js";
