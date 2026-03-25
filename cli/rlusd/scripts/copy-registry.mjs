import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const sourceRegistryDirectory = path.join(packageRoot, "src", "registry");
const targetRegistryDirectory = path.join(packageRoot, "dist", "registry");

await mkdir(targetRegistryDirectory, { recursive: true });
await cp(sourceRegistryDirectory, targetRegistryDirectory, { recursive: true });
