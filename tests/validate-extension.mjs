import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import vm from "node:vm";
import {
  loadNativeMessages,
  renderNativeMessagesModule
} from "../scripts/build-native-messages.mjs";

const root = resolve(import.meta.dirname, "..");
const extensionRoot = resolve(root, "Way Tools");
const manifestPath = resolve(extensionRoot, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const packageMetadata = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

assert.equal(manifest.manifest_version, 3, "A extensão precisa usar Manifest V3.");
assert.equal(manifest.name, "Way Tools");
assert.equal(manifest.version, packageMetadata.version, "A versão do pacote deve acompanhar o manifesto.");
assert.equal(basename(extensionRoot), manifest.name, "A pasta carregável deve ter o nome da extensão.");
assert.deepEqual(manifest.permissions, ["storage"]);
assert.ok(!manifest.permissions.includes("activeTab"), "activeTab é redundante quando os hosts já estão declarados.");
assert.deepEqual(manifest.host_permissions, [
  "https://ia-nocodb.internetway.com.br/*",
  "https://erp.internetway.com.br/*",
  "https://wayinternet.matrixdobrasil.ai/*"
]);
assert.ok(
  manifest.content_scripts[0].js.indexOf("config/default-messages.js") <
    manifest.content_scripts[0].js.indexOf("scripts/way-mensagens.js"),
  "As mensagens nativas precisam ser carregadas antes do script Way Mensagens."
);
for (const entry of manifest.content_scripts) {
  const dictionaryIndex = entry.js.indexOf("config/spelling-dictionary.js");
  const engineIndex = entry.js.indexOf("content/spelling-engine.js");
  const correctorIndex = entry.js.indexOf("scripts/way-corretor-ortografico-pro.js");
  assert.ok(dictionaryIndex >= 0, `Dicionário ausente em ${entry.matches.join(", ")}.`);
  assert.ok(engineIndex > dictionaryIndex, "O motor ortográfico deve carregar depois do dicionário.");
  assert.ok(correctorIndex > engineIndex, "O corretor deve carregar depois do motor ortográfico.");
}

const referencedFiles = [
  manifest.action.default_popup,
  ...Object.values(manifest.action.default_icon),
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap((entry) => entry.js)
];

for (const relativePath of new Set(referencedFiles)) {
  assert.ok(existsSync(resolve(extensionRoot, relativePath)), `Arquivo ausente no manifesto: ${relativePath}`);
}

function readPngDimensions(relativePath) {
  const png = readFileSync(resolve(extensionRoot, relativePath));
  assert.equal(png.toString("ascii", 1, 4), "PNG", `${relativePath} não é um PNG válido.`);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20)
  };
}

for (const [size, relativePath] of Object.entries(manifest.icons)) {
  assert.deepEqual(
    readPngDimensions(relativePath),
    { width: Number(size), height: Number(size) },
    `${relativePath} precisa medir ${size} × ${size} pixels.`
  );
}

assert.equal(manifest.icons["128"], "128.png", "O logotipo principal deve ser salvo como 128.png.");

const catalogSource = readFileSync(resolve(extensionRoot, "config/scripts.js"), "utf8");
const nativeMessagesSource = readFileSync(resolve(extensionRoot, "config/default-messages.js"), "utf8");
const scriptSource = readFileSync(resolve(extensionRoot, "scripts/way-mensagens.js"), "utf8");
const erpScriptSource = readFileSync(resolve(extensionRoot, "scripts/way-erp-copiar-dados.js"), "utf8");
const compactInterfaceSource = readFileSync(resolve(extensionRoot, "scripts/way-interface-compacta.js"), "utf8");
const spellingScriptSource = readFileSync(resolve(extensionRoot, "scripts/way-corretor-ortografico-pro.js"), "utf8");
const spellingDictionarySource = readFileSync(resolve(extensionRoot, "config/spelling-dictionary.js"), "utf8");
const spellingEngineSource = readFileSync(resolve(extensionRoot, "content/spelling-engine.js"), "utf8");
const popupSource = readFileSync(resolve(extensionRoot, "popup/popup.js"), "utf8");
const popupHtmlSource = readFileSync(resolve(extensionRoot, "popup/popup.html"), "utf8");
assert.match(catalogSource, /id:\s*"way-mensagens"/);
assert.match(catalogSource, /version:\s*"3\.4"/);
assert.match(catalogSource, /id:\s*"way-erp-copiar-dados"/);
assert.match(catalogSource, /version:\s*"1\.4"/);
assert.match(catalogSource, /id:\s*"way-interface-compacta"/);
assert.match(catalogSource, /name:\s*"Interface Compacta \+ Tema"/);
assert.match(catalogSource, /version:\s*"3\.4 \+ 1\.1"/);
assert.match(catalogSource, /id:\s*"way-corretor-ortografico-pro"/);
assert.match(catalogSource, /version:\s*"3\.2"/);

const catalogContext = {};
vm.runInNewContext(catalogSource, catalogContext);
assert.equal(catalogContext.WAY_TOOLS_SCRIPTS.length, 4, "O painel precisa listar os quatro scripts nativos.");
assert.deepEqual(
  JSON.parse(JSON.stringify(catalogContext.WAY_TOOLS_SCRIPTS.map((script) => script.id))),
  [
    "way-mensagens",
    "way-erp-copiar-dados",
    "way-interface-compacta",
    "way-corretor-ortografico-pro"
  ]
);
assert.ok(Object.isFrozen(catalogContext.WAY_TOOLS_SCRIPTS), "O catálogo de scripts precisa ser imutável.");
assert.match(scriptSource, /WayToolsRuntime\.run\("way-mensagens"/);
assert.match(scriptSource, /const GM_getValue = storage\.getValue/);
assert.match(scriptSource, /const GM_setValue = storage\.setValue/);
assert.match(scriptSource, /\[Way Mensagens\] v3\.4 ativa\./);
assert.match(scriptSource, /function obterMensagensNativas\(\)/);
assert.match(scriptSource, /GM_getValue\(\s*CONFIG\.storageKey,\s*null\s*\)/);
const defaultVisitTemplate = scriptSource.match(
  /const TEMPLATE_VISITA_PADRAO\s*=\s*`([\s\S]*?)`;/
)?.[1];
assert.ok(defaultVisitTemplate, "O template padrão de visita precisa existir.");
assert.doesNotMatch(
  defaultVisitTemplate,
  /(?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*)/,
  "O template padrão de visita deve usar dois asteriscos para formatação em negrito."
);

const nativeMessages = loadNativeMessages();
assert.equal(nativeMessages.length, 16, "O catálogo nativo precisa conter as 16 mensagens do backup.");
assert.equal(new Set(nativeMessages.map((message) => message.id)).size, nativeMessages.length, "Os IDs das mensagens nativas precisam ser únicos.");
assert.equal(new Set(nativeMessages.map((message) => message.comando)).size, nativeMessages.length, "Os comandos das mensagens nativas precisam ser únicos.");
const nativeMessagesText = JSON.stringify(nativeMessages);
assert.doesNotMatch(
  nativeMessagesText,
  /(?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*)/,
  "As mensagens nativas devem usar dois asteriscos para formatação em negrito."
);
assert.doesNotMatch(
  nativeMessagesText,
  /\{\{(?:endereço|período|horário)\}\}/,
  "As tags dinâmicas devem manter os identificadores sem acento reconhecidos pelo script."
);
assert.equal(nativeMessagesSource, renderNativeMessagesModule(nativeMessages), "O módulo nativo está desatualizado em relação ao JSON.");

const nativeContext = {};
vm.runInNewContext(nativeMessagesSource, nativeContext);
assert.deepEqual(
  JSON.parse(JSON.stringify(nativeContext.WAY_TOOLS_NATIVE_MESSAGES)),
  nativeMessages,
  "O módulo carregado precisa preservar exatamente as mensagens do JSON."
);
assert.ok(Object.isFrozen(nativeContext.WAY_TOOLS_NATIVE_MESSAGES), "O catálogo nativo precisa ser imutável.");

assert.match(erpScriptSource, /WayToolsRuntime\.run\("way-erp-copiar-dados"/);
assert.match(erpScriptSource, /\[Way ERP\] Copiar Dados v1\.4 ativo\./);
assert.match(compactInterfaceSource, /WayToolsRuntime\.run\("way-interface-compacta"/);
assert.match(compactInterfaceSource, /const GM_getValue = storage\.getValue/);
assert.match(compactInterfaceSource, /const GM_setValue = storage\.setValue/);
assert.match(compactInterfaceSource, /registerMenuCommand\("way-interface-compacta"/);
assert.match(compactInterfaceSource, /\[Way Interface\] Interface Compacta 3\.4 ativa\./);
assert.match(compactInterfaceSource, /\[Way Matrix Theme\] Light\/Dark Mode 1\.1 ativo\./);
assert.match(
  compactInterfaceSource,
  /window\.location\.hostname\s*===\s*"wayinternet\.matrixdobrasil\.ai"/,
  "O tema precisa ficar protegido para executar somente no Matrix."
);
assert.match(spellingScriptSource, /WayToolsRuntime\.run\("way-corretor-ortografico-pro"/);
assert.match(spellingScriptSource, /const localStorage = Object\.freeze/);
assert.match(spellingScriptSource, /\[Way AutoCorrect PRO\] iniciado\./);
assert.match(spellingScriptSource, /WAY_TOOLS_SPELLING_DICTIONARY/);
assert.match(spellingScriptSource, /WayToolsSpellingEngine/);
assert.match(
  spellingScriptSource,
  /\.ProseMirror\[contenteditable="true"\]/,
  "O corretor precisa reconhecer o editor ProseMirror usado no chat do IA NocoDB."
);
assert.match(popupHtmlSource, /id="personal-dictionary"/);
assert.match(popupHtmlSource, /id="correction-form"/);
assert.match(popupHtmlSource, /id="ignored-form"/);
assert.match(popupSource, /way-corretor-dicionario-pessoal-v1/);

const spellingContext = {};
vm.createContext(spellingContext);
vm.runInContext(spellingDictionarySource, spellingContext);
vm.runInContext(spellingEngineSource, spellingContext);

const spellingDictionary = spellingContext.WAY_TOOLS_SPELLING_DICTIONARY;
assert.ok(Object.isFrozen(spellingDictionary));
assert.ok(Object.isFrozen(spellingDictionary.terms));
assert.ok(Object.isFrozen(spellingDictionary.corrections));
assert.ok(
  Object.keys(spellingDictionary.corrections).length >= 500,
  "O vocabulário deve manter pelo menos 500 correções seguras."
);
assert.ok(
  Object.keys(spellingDictionary.terms).length >= 90,
  "O vocabulário deve manter pelo menos 90 termos técnicos padronizados."
);
assert.equal(
  Object.entries(spellingDictionary.corrections)
    .filter(([source, target]) => source === target.toLocaleLowerCase("pt-BR"))
    .length,
  0,
  "O dicionário não deve conter substituições sem efeito."
);

const spellingEngine = spellingContext.WayToolsSpellingEngine.create({
  dictionary: spellingDictionary
});

const correctionCorpus = [
  ["voce nao possui conexao", "você não possui conexão"],
  ["NAO FOI POSSIVEL", "NÃO FOI POSSÍVEL"],
  ["Concerteza o wifi esta disponivel", "Com certeza o Wi-Fi esta disponível"],
  ["velociade de 500 mbps em 5 ghz", "velocidade de 500 Mbps em 5 GHz"],
  ["o clietne solicitou o bolteo", "o cliente solicitou o boleto"],
  ["configruacao do roteaodr", "configuração do roteador"],
  ["menssagem encaminahda ao finaceiro", "mensagem encaminhada ao financeiro"],
  ["teste com donwload e uplaod", "teste com download e upload"],
  ["Olá , tudo bem ?", "Olá, tudo bem?"],
  ["analise publica media", "analise publica media"],
  ["Acesse https://nao.example.com/configuracao", "Acesse https://nao.example.com/configuracao"],
  ["Envie para voce@example.com", "Envie para voce@example.com"]
];

for (const [input, expected] of correctionCorpus) {
  assert.equal(spellingEngine.correctText(input), expected, `Correção inesperada para: ${input}`);
}

assert.ok(
  spellingEngine.contextualSuggestions("Por favor, analise esta media.").length >= 3,
  "Termos ambíguos devem gerar sugestões contextuais."
);

const personalEngine = spellingContext.WayToolsSpellingEngine.create({
  dictionary: spellingDictionary,
  personal: {
    corrections: { internete: "internet" },
    ignored: ["wifi"]
  }
});
assert.equal(personalEngine.correctText("internete wifi"), "internet wifi");
assert.match(
  spellingScriptSource,
  /@match\s+https:\/\/ia-nocodb\.internetway\.com\.br\/\*/,
  "Os metadados do corretor devem documentar o suporte ao IA NocoDB."
);
assert.ok(
  catalogContext.WAY_TOOLS_SCRIPTS
    .find((script) => script.id === "way-corretor-ortografico-pro")
    .matches
    .includes("https://ia-nocodb.internetway.com.br/*"),
  "O catálogo deve informar que o corretor funciona no IA NocoDB."
);
assert.ok(
  manifest.content_scripts.some((entry) =>
    entry.matches.includes("https://erp.internetway.com.br/*") &&
    entry.js.includes("scripts/way-erp-copiar-dados.js")
  ),
  "O script de cópia precisa estar registrado somente no domínio do ERP."
);
assert.ok(
  manifest.content_scripts.some((entry) =>
    entry.matches.includes("https://wayinternet.matrixdobrasil.ai/*") &&
    entry.js.includes("scripts/way-interface-compacta.js")
  ),
  "A Interface Compacta precisa estar registrada no domínio Matrix."
);
const matrixEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://wayinternet.matrixdobrasil.ai/*")
);
assert.equal(matrixEntries.length, 1, "O Matrix deve carregar apenas uma instância do runtime.");
assert.ok(matrixEntries[0].js.includes("scripts/way-interface-compacta.js"));
assert.ok(matrixEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
const iaEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://ia-nocodb.internetway.com.br/*")
);
assert.equal(iaEntries.length, 1, "O IA NocoDB deve carregar apenas uma instância do runtime.");
assert.ok(iaEntries[0].js.includes("scripts/way-mensagens.js"));
assert.ok(iaEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
const erpEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://erp.internetway.com.br/*")
);
assert.equal(erpEntries.length, 1, "O ERP deve carregar apenas uma instância do runtime.");
assert.ok(erpEntries[0].js.includes("scripts/way-erp-copiar-dados.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-interface-compacta.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
assert.ok(
  !manifest.content_scripts.some((entry) => entry.js.includes("scripts/way-matrix-theme.js")),
  "O tema deve permanecer incorporado ao módulo da Interface Compacta."
);

const runtimeSource = readFileSync(resolve(extensionRoot, "content/runtime.js"), "utf8");
assert.match(runtimeSource, /registerMenuCommand\(scriptId, label, callback\)/);

const runtimeListeners = [];
const runtimeContext = {
  chrome: {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => undefined
      }
    },
    runtime: {
      onMessage: {
        addListener: (listener) => runtimeListeners.push(listener)
      }
    }
  },
  console
};
vm.createContext(runtimeContext);
vm.runInContext(catalogSource, runtimeContext);
vm.runInContext(runtimeSource, runtimeContext);

let menuCommandExecuted = false;
runtimeContext.WayToolsRuntime.registerMenuCommand(
  "way-interface-compacta",
  "Abas no topo",
  () => {
    menuCommandExecuted = true;
  }
);

let listedCommands;
runtimeListeners[0]({ type: "wayTools:listMenuCommands" }, {}, (response) => {
  listedCommands = response.commands;
});
assert.equal(listedCommands.length, 1);
assert.equal(listedCommands[0].label, "Abas no topo");

await new Promise((resolvePromise, rejectPromise) => {
  runtimeListeners[0](
    {
      type: "wayTools:executeMenuCommand",
      commandId: listedCommands[0].id
    },
    {},
    (response) => {
      if (response.ok) {
        resolvePromise();
      } else {
        rejectPromise(new Error(response.error));
      }
    }
  );
});
assert.equal(menuCommandExecuted, true, "O painel precisa conseguir executar comandos registrados.");

const javascriptFiles = [
  "config/scripts.js",
  "config/default-messages.js",
  "config/spelling-dictionary.js",
  "content/runtime.js",
  "content/spelling-engine.js",
  "popup/popup.js",
  "scripts/way-mensagens.js",
  "scripts/way-erp-copiar-dados.js",
  "scripts/way-interface-compacta.js",
  "scripts/way-corretor-ortografico-pro.js"
];

for (const relativePath of javascriptFiles) {
  execFileSync(process.execPath, ["--check", resolve(extensionRoot, relativePath)], {
    stdio: "pipe"
  });
}

console.log(`Way Tools validado: Manifest V${manifest.manifest_version}, ${javascriptFiles.length} arquivos JavaScript e ${new Set(referencedFiles).size} recursos conferidos.`);
