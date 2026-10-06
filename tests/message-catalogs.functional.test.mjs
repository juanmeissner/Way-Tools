import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { loadNativeMessageCatalog } from "../scripts/build-native-messages.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const managerSource = readFileSync(
  resolve(projectRoot, "Way Tools/content/message-catalog-manager.js"),
  "utf8"
);
const experienceSource = readFileSync(
  resolve(projectRoot, "Way Tools/content/message-experience.js"),
  "utf8"
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createManager(catalog = loadNativeMessageCatalog(), chromeData = null) {
  const writes = [];
  const context = {
    WAY_TOOLS_MESSAGE_CATALOG: clone(catalog)
  };

  if (chromeData) {
    context.chrome = {
      storage: {
        local: {
          async get(keys) {
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            return Object.fromEntries(
              requestedKeys
                .filter((key) => Object.prototype.hasOwnProperty.call(chromeData, key))
                .map((key) => [key, clone(chromeData[key])])
            );
          },
          async set(values) {
            writes.push(clone(values));
            Object.assign(chromeData, clone(values));
          }
        }
      }
    };
  }

  vm.runInNewContext(managerSource, context);
  vm.runInNewContext(experienceSource, context);
  return {
    manager: context.WayToolsMessageCatalogs,
    writes
  };
}

function createSharedAdapter(values = {}) {
  return {
    getSharedValue(key, fallbackValue) {
      return Object.prototype.hasOwnProperty.call(values, key)
        ? clone(values[key])
        : fallbackValue;
    },
    setSharedValue(key, value) {
      values[key] = clone(value);
      return value;
    }
  };
}

function textMessage(id, command, category, message) {
  return {
    id,
    comando: command,
    categoria: category,
    tipo: "texto",
    variacaoHorario: false,
    mensagem: message,
    manha: "",
    tarde: "",
    noite: "",
    templateVisita: ""
  };
}

test("ChatWoot e Matrix compartilham personalizações e exclusões do N2", () => {
  const { manager } = createManager();
  const sharedValues = {};
  const chatwootStorage = createSharedAdapter(sharedValues);
  const matrixStorage = createSharedAdapter(sharedValues);
  const initial = manager.ensureWithStorage(chatwootStorage, "n2");
  const removedId = initial[1].id;
  const customized = clone(initial);

  customized[0].mensagem = "Conteúdo personalizado pelo atendente.";
  customized.splice(1, 1);
  customized.push(textMessage(
    "custom-shared-message",
    "meuatalho",
    "abertura",
    "Mensagem criada pelo usuário."
  ));

  manager.saveWithStorage(chatwootStorage, "n2", customized);
  const loadedInMatrix = manager.ensureWithStorage(matrixStorage, "n2");

  assert.equal(loadedInMatrix[0].mensagem, "Conteúdo personalizado pelo atendente.");
  assert.ok(!loadedInMatrix.some((message) => message.id === removedId));
  assert.ok(loadedInMatrix.some((message) => message.id === "custom-shared-message"));
  assert.ok(sharedValues[manager.stateKeys.n2].deletedNativeIds.includes(removedId));
  assert.equal(sharedValues[manager.stateKeys.n2].overrides.length, 1);
  assert.equal(sharedValues[manager.stateKeys.n2].customMessages.length, 1);
});

test("os perfis N2 e SAC permanecem isolados e usam categorias centralizadas", () => {
  const { manager } = createManager();
  const sharedValues = {};
  const storage = createSharedAdapter(sharedValues);
  const n2Messages = manager.ensureWithStorage(storage, "n2");
  const sacMessage = textMessage(
    "sac-personal-opening",
    "aberturasac",
    "abertura",
    "Olá! Você está falando com o SAC."
  );

  manager.saveWithStorage(storage, "sac", [sacMessage]);

  assert.deepEqual(clone(manager.ensureWithStorage(storage, "sac")), [sacMessage]);
  assert.deepEqual(clone(manager.ensureWithStorage(storage, "n2")), clone(n2Messages));
  assert.ok(manager.categoryMap("sac").financeiro);
  assert.ok(manager.categoryMap("sac").cancelamento);
  assert.equal(manager.categoryMap("sac").ajustes, undefined);
  assert.ok(manager.categoryMap("n2").ajustes);
  assert.equal(manager.categoryMap("n2").financeiro, undefined);
});

test("o agradecimento nativo preserva a seleção de gênero em todos os horários", () => {
  const catalog = loadNativeMessageCatalog();
  const message = catalog.profiles.n2.messages.find((item) => item.comando === "agradecimento");

  assert.ok(message);
  assert.equal(message.variacaoHorario, true);
  for (const period of ["manha", "tarde", "noite"]) {
    assert.match(message[period], /\{\{genero:ajudá-lo\|ajudá-la\}\}/);
  }
});

test("uma nova versão oficial é mesclada sem apagar escolhas do usuário", () => {
  const currentCatalog = loadNativeMessageCatalog();
  const { manager: currentManager } = createManager(currentCatalog);
  const sharedValues = {};
  const storage = createSharedAdapter(sharedValues);
  const currentN2 = currentManager.ensureWithStorage(storage, "n2");
  const customizedId = currentN2[0].id;
  const deletedId = currentN2[1].id;
  const untouchedId = currentN2[2].id;
  const personalized = clone(currentN2);

  personalized[0].mensagem = "Personalização que deve permanecer.";
  personalized.splice(1, 1);
  personalized.push(textMessage(
    "custom-before-update",
    "antesdaatualizacao",
    "abertura",
    "Mensagem pessoal anterior à atualização."
  ));
  currentManager.saveWithStorage(storage, "n2", personalized);
  currentManager.ensureWithStorage(storage, "sac");

  const futureCatalog = clone(currentCatalog);
  futureCatalog.profiles.n2.version += 1;
  futureCatalog.profiles.n2.messages[0].mensagem = "Nova versão da mensagem oficial personalizada.";
  futureCatalog.profiles.n2.messages[2].mensagem = "Nova versão oficial de uma mensagem intacta.";
  futureCatalog.profiles.n2.messages.push(textMessage(
    "n2-native-after-update",
    "novoatalhon2",
    "abertura",
    "Nova mensagem oficial do N2."
  ));
  futureCatalog.profiles.sac.version += 1;
  futureCatalog.profiles.sac.messages.push(textMessage(
    "sac-native-after-update",
    "novosac",
    "abertura",
    "Nova mensagem oficial do SAC."
  ));

  const { manager: futureManager } = createManager(futureCatalog);
  const updatedN2 = futureManager.ensureWithStorage(storage, "n2");
  const updatedSac = futureManager.ensureWithStorage(storage, "sac");

  assert.equal(
    updatedN2.find((message) => message.id === customizedId)?.mensagem,
    "Personalização que deve permanecer."
  );
  assert.ok(!updatedN2.some((message) => message.id === deletedId));
  assert.equal(
    updatedN2.find((message) => message.id === untouchedId)?.mensagem,
    "Nova versão oficial de uma mensagem intacta."
  );
  assert.ok(updatedN2.some((message) => message.id === "custom-before-update"));
  assert.ok(updatedN2.some((message) => message.id === "n2-native-after-update"));
  assert.ok(updatedSac.some((message) => message.id === "sac-native-after-update"));
  assert.equal(sharedValues[futureManager.stateKeys.n2].nativeVersion, currentCatalog.profiles.n2.version + 1);
  assert.equal(sharedValues[futureManager.stateKeys.sac].nativeVersion, currentCatalog.profiles.sac.version + 1);
});

test("a inicialização em chrome.storage.local é persistente e idempotente", async () => {
  const chromeData = {};
  const { manager, writes } = createManager(loadNativeMessageCatalog(), chromeData);

  const firstN2 = await manager.ensureWithChromeStorage("n2");
  const firstSac = await manager.ensureWithChromeStorage("sac");
  const writeCountAfterInitialization = writes.length;

  assert.equal(firstN2.length, 18);
  assert.equal(firstSac.length, 2);
  assert.deepEqual(clone(firstSac.map((message) => message.comando).sort()), ["enviarimagem", "ocorrencia"]);
  assert.ok(Array.isArray(chromeData[`wayTools.shared.${manager.catalogKeys.n2}`]));
  assert.ok(chromeData[`wayTools.shared.${manager.stateKeys.n2}`]);
  assert.ok(Array.isArray(chromeData[`wayTools.shared.${manager.catalogKeys.sac}`]));
  assert.ok(chromeData[`wayTools.shared.${manager.stateKeys.sac}`]);

  await manager.ensureWithChromeStorage("n2");
  await manager.ensureWithChromeStorage("sac");
  assert.equal(writes.length, writeCountAfterInitialization);
});

test("comandos ou IDs duplicados não corrompem o catálogo efetivo", () => {
  const { manager } = createManager();
  const storageValues = {};
  const storage = createSharedAdapter(storageValues);
  const first = textMessage("duplicate-one", "duplicado", "abertura", "Primeira mensagem.");
  const duplicateCommand = textMessage("duplicate-two", "duplicado", "abertura", "Segunda mensagem.");
  const duplicateId = textMessage("duplicate-one", "outrocomando", "abertura", "Terceira mensagem.");

  const saved = manager.saveWithStorage(storage, "sac", [first, duplicateCommand, duplicateId]);

  assert.deepEqual(clone(saved), [first]);
  assert.deepEqual(clone(manager.ensureWithStorage(storage, "sac")), [first]);
});

test("a pesquisa encontra comando, sinônimo, palavra relacionada e conteúdo sem depender de acentos", () => {
  const { manager } = createManager();
  const messages = [
    {
      ...textMessage("segunda-via", "segundavia", "financeiro", "Envio da segunda via da fatura."),
      sinonimos: ["boleto", "2via"],
      palavrasChave: ["vencimento", "pagamento"]
    },
    textMessage("wifi-password", "trocarsenha", "ajustes", "Vamos alterar a senha do Wi-Fi.")
  ];
  const categories = {
    financeiro: { label: "Financeiro e cobrança" },
    ajustes: { label: "Ajustes na conexão" }
  };

  assert.equal(manager.searchMessages(messages, "boleto", categories)[0].id, "segunda-via");
  assert.equal(manager.searchMessages(messages, "2via", categories)[0].id, "segunda-via");
  assert.equal(manager.searchMessages(messages, "pagamento", categories)[0].id, "segunda-via");
  assert.equal(manager.searchMessages(messages, "cobranca", categories)[0].id, "segunda-via");
  assert.equal(manager.searchMessages(messages, "wifi", categories)[0].id, "wifi-password");
});

test("favoritos, recentes e ordens personalizadas são compartilhados e isolados por perfil", () => {
  const { manager } = createManager();
  const sharedValues = {};
  const chatwootStorage = createSharedAdapter(sharedValues);
  const matrixStorage = createSharedAdapter(sharedValues);

  manager.toggleFavoriteWithStorage(chatwootStorage, "n2", "message-two");
  manager.recordUseWithStorage(chatwootStorage, "n2", "message-one");
  manager.recordUseWithStorage(chatwootStorage, "n2", "message-two");
  manager.moveCategoryWithStorage(
    chatwootStorage,
    "n2",
    "encerramento",
    -1,
    ["abertura", "encerramento"]
  );
  manager.moveMessageWithStorage(
    chatwootStorage,
    "n2",
    "abertura",
    "message-two",
    -1,
    ["message-one", "message-two"]
  );

  const n2Experience = manager.experienceWithStorage(matrixStorage, "n2");
  const sacExperience = manager.experienceWithStorage(matrixStorage, "sac");
  assert.deepEqual(clone(n2Experience.favorites), ["message-two"]);
  assert.deepEqual(clone(n2Experience.recent.map((entry) => entry.id)), ["message-two", "message-one"]);
  assert.deepEqual(clone(n2Experience.categoryOrder), ["encerramento", "abertura"]);
  assert.deepEqual(clone(n2Experience.messageOrder.abertura), ["message-two", "message-one"]);
  assert.deepEqual(clone(sacExperience.favorites), []);
});

test("o histórico local desfaz a última alteração e preserva as mensagens anteriores", () => {
  const { manager } = createManager();
  const sharedValues = {};
  const storage = createSharedAdapter(sharedValues);
  const before = [textMessage("first", "primeiro", "abertura", "Antes")];
  const after = [textMessage("first", "primeiro", "abertura", "Depois")];

  manager.recordHistoryWithStorage(storage, "n2", "Edição de !primeiro", before);
  const entry = manager.consumeUndoWithStorage(storage, "n2");

  assert.equal(entry.action, "Edição de !primeiro");
  assert.deepEqual(clone(entry.messages), before);
  assert.deepEqual(clone(manager.experienceWithStorage(storage, "n2").history), []);
  assert.notDeepEqual(after, entry.messages);
});

test("tags não preenchidas são identificadas antes da inserção", () => {
  const { manager } = createManager();
  assert.deepEqual(
    clone(manager.unresolvedTags(
      "Olá {{nomecliente}}, protocolo {{protocolo}}. Atendente: {{nome}}.",
      { nomecliente: "Maria", protocolo: "", nome: null }
    )),
    ["protocolo", "nome"]
  );
});
