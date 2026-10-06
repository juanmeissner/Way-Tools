import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionPolicyPath = resolve(projectRoot, "Way Tools/docs/index.html");
const publicPolicyPath = resolve(projectRoot, "docs/index.html");
const policy = readFileSync(extensionPolicyPath, "utf8");

mkdirSync(dirname(publicPolicyPath), { recursive: true });
writeFileSync(publicPolicyPath, policy, "utf8");

console.log("Política principal da extensão sincronizada com o GitHub Pages.");
