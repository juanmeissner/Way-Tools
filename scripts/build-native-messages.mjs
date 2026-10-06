import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const supportedSectors = new Set(["n2", "sac"]);
const supportedMessageTypes = new Set(["texto", "disponibilidade", "visita", "imagem"]);

export const messagesJsonPath = resolve(projectRoot, "Way Tools/data/mensagens-nativas.json");
export const messagesModulePath = resolve(projectRoot, "Way Tools/config/default-messages.js");

function validateCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error("mensagens-nativas.json não contém categorias válidas.");
  }

  const ids = new Set();

  for (const category of categories) {
    if (!category || typeof category !== "object" || Array.isArray(category)) {
      throw new Error("Existe uma categoria inválida no catálogo nativo.");
    }

    const id = String(category.id || "").trim();
    const label = String(category.label || "").trim();
    const sectors = Array.isArray(category.setores) ? category.setores : [];

    if (!id || !label || ids.has(id)) {
      throw new Error(`Categoria inválida ou duplicada: ${id || "sem identificador"}.`);
    }

    if (!Number.isFinite(category.ordem) || sectors.length === 0) {
      throw new Error(`A categoria ${id} precisa de ordem e setores válidos.`);
    }

    if (sectors.some((sector) => !supportedSectors.has(sector))) {
      throw new Error(`A categoria ${id} contém um setor desconhecido.`);
    }

    ids.add(id);
  }

  return ids;
}

function validateProfile(sector, profile, categoryIds, categories) {
  if (!profile || typeof profile !== "object" || !Array.isArray(profile.mensagens)) {
    throw new Error(`O perfil ${sector.toUpperCase()} não contém uma lista de mensagens válida.`);
  }

  if (!Number.isInteger(profile.versaoCatalogo) || profile.versaoCatalogo < 1) {
    throw new Error(`O perfil ${sector.toUpperCase()} precisa de uma versão de catálogo válida.`);
  }

  if (profile.quantidade !== profile.mensagens.length) {
    throw new Error(`A quantidade declarada no perfil ${sector.toUpperCase()} não corresponde à lista de mensagens.`);
  }

  const ids = new Set();
  const commands = new Set();
  const legacyNativeIds = Array.isArray(profile.idsNativosLegados)
    ? profile.idsNativosLegados.map((id) => String(id || "").trim())
    : [];
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  if (legacyNativeIds.some((id) => !id) || new Set(legacyNativeIds).size !== legacyNativeIds.length) {
    throw new Error(`O perfil ${sector.toUpperCase()} contém IDs nativos legados inválidos.`);
  }

  for (const message of profile.mensagens) {
    const id = String(message?.id || "").trim();
    const command = String(message?.comando || "").trim();
    const category = String(message?.categoria || "").trim();
    const type = String(message?.tipo || "texto").trim();

    if (!id || ids.has(id)) {
      throw new Error(`O perfil ${sector.toUpperCase()} contém um ID de mensagem inválido ou duplicado.`);
    }

    if (!command || commands.has(command)) {
      throw new Error(`O perfil ${sector.toUpperCase()} contém um comando inválido ou duplicado: ${command}.`);
    }

    if (!categoryIds.has(category) || !categoriesById.get(category)?.setores?.includes(sector)) {
      throw new Error(`A mensagem !${command} usa uma categoria indisponível para ${sector.toUpperCase()}.`);
    }

    if (!supportedMessageTypes.has(type)) {
      throw new Error(`A mensagem !${command} usa o tipo desconhecido ${type}.`);
    }

    if (type === "imagem" && !/^assets\/mensagens\/[a-z0-9_-]+\.png$/.test(String(message.arquivoImagem || ""))) {
      throw new Error(`A mensagem !${command} precisa indicar uma imagem PNG válida em assets/mensagens/.`);
    }

    ids.add(id);
    commands.add(command);
  }

  return {
    version: profile.versaoCatalogo,
    legacyNativeIds,
    messages: profile.mensagens
  };
}

export function loadNativeMessageCatalog() {
  const source = JSON.parse(readFileSync(messagesJsonPath, "utf8"));

  if (source.schemaVersion !== 2 || !source.perfis || typeof source.perfis !== "object") {
    throw new Error("mensagens-nativas.json precisa usar o schemaVersion 2 com perfis N2 e SAC.");
  }

  const categoryIds = validateCategories(source.categorias);
  const profiles = Object.fromEntries(
    [...supportedSectors].map((sector) => [
      sector,
      validateProfile(sector, source.perfis[sector], categoryIds, source.categorias)
    ])
  );

  return {
    schemaVersion: source.schemaVersion,
    backupVersion: source.versaoBackup,
    categories: source.categorias,
    profiles
  };
}

export function loadNativeMessages() {
  return loadNativeMessageCatalog().profiles.n2.messages;
}

export function renderNativeMessagesModule(input = loadNativeMessageCatalog()) {
  const catalog = Array.isArray(input)
    ? (() => {
        const current = loadNativeMessageCatalog();
        return {
          ...current,
          profiles: {
            ...current.profiles,
            n2: {
              ...current.profiles.n2,
              messages: input
            }
          }
        };
      })()
    : input;
  const serializedCatalog = JSON.stringify(catalog, null, 2);

  return `/* Arquivo gerado de data/mensagens-nativas.json. Não edite manualmente. */
(() => {
  "use strict";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  const catalog = deepFreeze(${serializedCatalog});

  globalThis.WAY_TOOLS_MESSAGE_CATALOG = catalog;
  globalThis.WAY_TOOLS_MESSAGE_CATEGORIES = catalog.categories;
  globalThis.WAY_TOOLS_NATIVE_CATALOGS = catalog.profiles;
  globalThis.WAY_TOOLS_NATIVE_MESSAGES = catalog.profiles.n2.messages;
})();
`;
}

export function writeNativeMessagesModule() {
  const catalog = loadNativeMessageCatalog();
  writeFileSync(messagesModulePath, renderNativeMessagesModule(catalog), "utf8");
  return Object.values(catalog.profiles)
    .reduce((total, profile) => total + profile.messages.length, 0);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const count = writeNativeMessagesModule();
  console.log(`${count} mensagens nativas incorporadas ao Way Tools.`);
}
