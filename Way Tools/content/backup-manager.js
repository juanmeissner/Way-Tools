(() => {
  "use strict";

  const schemaVersion = 1;
  const applicationName = "Way Tools";
  const ownedPrefix = "wayTools.";
  const rollbackKey = "wayTools.backup.rollback.v1";
  const internalKeys = new Set([rollbackKey]);
  const unsafeNames = new Set(["__proto__", "prototype", "constructor"]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isOwnedKey(key) {
    return typeof key === "string" && key.startsWith(ownedPrefix) && !internalKeys.has(key);
  }

  function assertSafeValue(value, path = "data") {
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      if (unsafeNames.has(key)) {
        throw new Error(`O backup contém uma propriedade não permitida em ${path}.`);
      }
      assertSafeValue(value[key], `${path}.${key}`);
    }
  }

  function ownedData(values) {
    return Object.fromEntries(
      Object.entries(values || {})
        .filter(([key]) => isOwnedKey(key))
        .map(([key, value]) => [key, clone(value)])
    );
  }

  function buildBackup(values, extensionVersion = "desconhecida", exportedAt = new Date().toISOString()) {
    const data = ownedData(values);
    return {
      schemaVersion,
      application: applicationName,
      extensionVersion: String(extensionVersion || "desconhecida"),
      exportedAt,
      storageArea: "chrome.storage.local",
      entryCount: Object.keys(data).length,
      data
    };
  }

  function validateBackup(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("O arquivo selecionado não contém um backup válido.");
    }
    if (value.application !== applicationName || value.schemaVersion !== schemaVersion) {
      throw new Error("Este arquivo não é um backup compatível do Way Tools.");
    }
    if (!value.data || typeof value.data !== "object" || Array.isArray(value.data)) {
      throw new Error("O backup não contém a área de dados esperada.");
    }
    for (const key of Object.keys(value.data)) {
      if (!isOwnedKey(key)) throw new Error(`O backup contém uma chave não reconhecida: ${key}.`);
    }
    assertSafeValue(value.data);
    return buildBackup(
      value.data,
      value.extensionVersion,
      typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString()
    );
  }

  async function exportFromStorage(storageArea, extensionVersion) {
    return buildBackup(await storageArea.get(null), extensionVersion);
  }

  async function importToStorage(storageArea, backupValue, mode = "merge") {
    const backup = validateBackup(backupValue);
    if (!new Set(["merge", "replace"]).has(mode)) throw new Error("Modo de restauração inválido.");
    const current = await storageArea.get(null);
    const currentOwned = ownedData(current);
    await storageArea.set({
      [rollbackKey]: buildBackup(currentOwned, "rollback-anterior-a-importacao")
    });
    const removableKeys = mode === "replace"
      ? Object.keys(currentOwned).filter((key) => !Object.hasOwn(backup.data, key))
      : [];
    if (removableKeys.length > 0) await storageArea.remove(removableKeys);
    await storageArea.set(clone(backup.data));
    return {
      mode,
      importedCount: Object.keys(backup.data).length,
      removedCount: removableKeys.length
    };
  }

  async function restoreRollback(storageArea) {
    const stored = await storageArea.get(rollbackKey);
    if (!stored[rollbackKey]) throw new Error("Ainda não existe uma importação para desfazer.");
    const rollback = validateBackup(stored[rollbackKey]);
    const current = ownedData(await storageArea.get(null));
    const removableKeys = Object.keys(current).filter((key) => !Object.hasOwn(rollback.data, key));
    if (removableKeys.length > 0) await storageArea.remove(removableKeys);
    await storageArea.set(clone(rollback.data));
    await storageArea.remove(rollbackKey);
    return { restoredCount: Object.keys(rollback.data).length, removedCount: removableKeys.length };
  }

  function serialize(backup) {
    return `${JSON.stringify(validateBackup(backup), null, 2)}\n`;
  }

  function fileName(date = new Date()) {
    return `way-tools-backup-${date.toISOString().replace(/[:.]/g, "-")}.json`;
  }

  globalThis.WayToolsBackupManager = Object.freeze({
    schemaVersion,
    rollbackKey,
    buildBackup,
    validateBackup,
    exportFromStorage,
    importToStorage,
    restoreRollback,
    serialize,
    fileName
  });
})();
