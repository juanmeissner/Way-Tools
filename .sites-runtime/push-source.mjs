import { spawn } from "node:child_process";
import process from "node:process";

const [sourceDir, remoteUrl, branch = "main"] = process.argv.slice(2);

if (!sourceDir || !remoteUrl) {
  console.error("Missing source directory or remote URL.");
  process.exit(2);
}

const input = await new Promise((resolve) => {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    if (!buffer.includes("\n")) return;
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
    resolve(buffer.split(/\r?\n/, 1)[0]);
  });
});

const { token } = JSON.parse(input);
if (!token) {
  console.error("Missing source credential.");
  process.exit(2);
}

const child = spawn(
  "git",
  ["-C", sourceDir, "push", remoteUrl, `HEAD:${branch}`],
  {
    env: {
      ...process.env,
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.extraHeader",
      GIT_CONFIG_VALUE_0: `Authorization: Bearer ${token}`,
      GIT_TERMINAL_PROMPT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
child.on("exit", (code) => process.exit(code ?? 1));
