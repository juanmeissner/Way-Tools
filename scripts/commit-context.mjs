import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(...args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trimEnd();
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(projectRoot, path), "utf8"));
}

const lastCommit = git(
  "log",
  "-1",
  "--date=iso-strict",
  "--format=%H%n%h%n%ad%n%an%n%s"
).split(/\r?\n/);
const [fullHash, shortHash, committedAt, author, subject] = lastCommit;
const status = git("status", "--porcelain=v1", "-uall");
const shortStat = git("diff", "--shortstat", "HEAD").trim() || "Nenhum arquivo rastreado alterado.";
const packageJson = readJson("package.json");
const manifest = readJson("Way Tools/manifest.json");
const changedLines = status ? status.split(/\r?\n/) : [];

function statusLabel(code) {
  if (code === "??") return "novo";
  if (code.includes("D")) return "removido";
  if (code.includes("R")) return "renomeado";
  if (code.includes("A")) return "adicionado";
  if (code.includes("M")) return "modificado";
  return code.trim() || "alterado";
}

console.log("# Contexto do próximo commit do Way Tools");
console.log("");
console.log(`- Último commit: ${shortHash} (${fullHash})`);
console.log(`- Data do último commit: ${committedAt}`);
console.log(`- Autor: ${author}`);
console.log(`- Título: ${subject}`);
console.log(`- Versão do package.json: ${packageJson.version}`);
console.log(`- Versão do manifest.json: ${manifest.version}`);
console.log(`- Resumo rastreado: ${shortStat}`);
console.log(`- Arquivos modificados ou novos: ${changedLines.length}`);
console.log("");
console.log("## Alterações desde o último commit");
console.log("");

if (!changedLines.length) {
  console.log("Nenhuma alteração pendente.");
} else {
  for (const line of changedLines) {
    console.log(`- **${statusLabel(line.slice(0, 2))}:** ${line.slice(3)}`);
  }
}

console.log("");
console.log("Este relatório usa o HEAD do Git como marco. Depois que um novo commit for criado, ele passará automaticamente a ser a nova referência.");
