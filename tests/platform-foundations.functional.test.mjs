import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const projectRoot = resolve(import.meta.dirname, "..");
const backupSource = readFileSync(resolve(projectRoot, "Way Tools/content/backup-manager.js"), "utf8");
const sacDraft = JSON.parse(readFileSync(resolve(projectRoot, "Way Tools/data/mensagens-sac-rascunho.json"), "utf8"));
const nativeCatalog = JSON.parse(readFileSync(resolve(projectRoot, "Way Tools/data/mensagens-nativas.json"), "utf8"));

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createStorage(initial = {}) {
  const values = clone(initial);
  return {
    values,
    async get(keys) {
      if (keys === null) return clone(values);
      const requested = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(requested.filter((key) => Object.hasOwn(values, key)).map((key) => [key, clone(values[key])]));
    },
    async set(entries) {
      Object.assign(values, clone(entries));
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key];
    }
  };
}

function createBackupManager() {
  const context = {};
  vm.runInNewContext(backupSource, context);
  return context.WayToolsBackupManager;
}

test("backup completo exporta somente dados do Way Tools", async () => {
  const manager = createBackupManager();
  const storage = createStorage({
    "wayTools.shared.messages.sector.v1": "n2",
    "wayTools.scripts.matrix-mensagens.enabled": true,
    externalSetting: "não exportar",
    [manager.rollbackKey]: { internal: true }
  });
  const backup = await manager.exportFromStorage(storage, "0.7.1");
  assert.equal(backup.application, "Way Tools");
  assert.equal(backup.entryCount, 2);
  assert.equal(backup.data.externalSetting, undefined);
  assert.equal(backup.data[manager.rollbackKey], undefined);
});

test("restauração permite mesclar, substituir e desfazer sem apagar dados externos", async () => {
  const manager = createBackupManager();
  const storage = createStorage({ "wayTools.old": 1, externalSetting: "preservar" });
  const imported = manager.buildBackup({ "wayTools.new": 2 }, "0.7.1");
  await manager.importToStorage(storage, imported, "merge");
  assert.equal(storage.values["wayTools.old"], 1);
  assert.equal(storage.values["wayTools.new"], 2);
  await manager.importToStorage(storage, imported, "replace");
  assert.equal(storage.values["wayTools.old"], undefined);
  assert.equal(storage.values.externalSetting, "preservar");
  await manager.restoreRollback(storage);
  assert.equal(storage.values["wayTools.old"], 1);
  assert.equal(storage.values["wayTools.new"], 2);
  assert.equal(storage.values.externalSetting, "preservar");
});

test("backup rejeita arquivos externos e propriedades perigosas", () => {
  const manager = createBackupManager();
  assert.throws(() => manager.validateBackup({
    schemaVersion: 1,
    application: "Way Tools",
    data: { externalSetting: true }
  }), /chave não reconhecida/);
  const dangerous = JSON.parse('{"schemaVersion":1,"application":"Way Tools","data":{"wayTools.test":{"__proto__":{"admin":true}}}}');
  assert.throws(() => manager.validateBackup(dangerous), /propriedade não permitida/);
});

test("SAC incorpora o primeiro pacote aprovado e mantém propostas planejadas no estúdio", () => {
  assert.equal(nativeCatalog.perfis.sac.mensagens.length, 14);
  assert.deepEqual(
    nativeCatalog.perfis.sac.mensagens
      .filter((message) => message.comando === "enviarimagem")
      .map((message) => ({
      comando: message.comando,
      tipo: message.tipo,
      arquivoImagem: message.arquivoImagem
    })),
    [{
      comando: "enviarimagem",
      tipo: "imagem",
      arquivoImagem: "assets/mensagens/enviarimagem.png"
    }]
  );
  const occurrence = nativeCatalog.perfis.sac.mensagens.find((message) => message.comando === "ocorrencia");
  assert.equal(occurrence?.categoria, "orientacoes");
  assert.match(occurrence?.mensagem || "", /normalizada em até 4 horas/);
  assert.equal(sacDraft.status, "primeiro_pacote_aprovado");
  assert.equal(sacDraft.approvalRequired, false);
  const commands = sacDraft.categories.flatMap((category) => category.commands);
  const firstPackage = commands.filter((command) => command.firstPackage);
  const planned = commands.filter((command) => command.status === "planejado");
  assert.equal(commands.length, 42);
  assert.deepEqual(firstPackage.map((command) => command.command).sort(), [...sacDraft.recommendedFirstPackage].sort());
  assert.equal(firstPackage.length, 12);
  assert.ok(firstPackage.every((command) => command.status === "aprovado"));
  assert.ok(firstPackage.every((command) => command.text || (command.morning && command.afternoon && command.night)));
  assert.equal(planned.length, 30);
  assert.ok(firstPackage.every((command) => nativeCatalog.perfis.sac.mensagens.some((message) => message.comando === command.command)));
  assert.ok(commands.find((command) => command.command === "segundavia").aliases.includes("2via"));
});
