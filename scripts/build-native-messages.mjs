import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

export const messagesJsonPath = resolve(projectRoot, "Way Tools/data/mensagens-nativas.json");
export const messagesModulePath = resolve(projectRoot, "Way Tools/config/default-messages.js");

export function loadNativeMessages() {
  const backup = JSON.parse(readFileSync(messagesJsonPath, "utf8"));

  if (!Array.isArray(backup.mensagens)) {
    throw new Error("mensagens-nativas.json não contém uma lista de mensagens válida.");
  }

  if (backup.quantidade !== backup.mensagens.length) {
    throw new Error("A quantidade declarada no backup não corresponde à lista de mensagens.");
  }

  return backup.mensagens;
}

export function renderNativeMessagesModule(messages = loadNativeMessages()) {
  const serializedMessages = JSON.stringify(messages, null, 2);

  return `/* Arquivo gerado de data/mensagens-nativas.json. Não edite manualmente. */
(() => {
  "use strict";

  const messages = ${serializedMessages};

  globalThis.WAY_TOOLS_NATIVE_MESSAGES = Object.freeze(
    messages.map((message) => Object.freeze(message))
  );
})();
`;
}

export function writeNativeMessagesModule() {
  const messages = loadNativeMessages();
  writeFileSync(messagesModulePath, renderNativeMessagesModule(messages), "utf8");
  return messages.length;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const count = writeNativeMessagesModule();
  console.log(`${count} mensagens nativas incorporadas ao Way Tools.`);
}
