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
assert.equal(manifest.minimum_chrome_version, "120", "Os alarmes de 30 segundos exigem Chrome 120 ou superior.");
assert.equal(basename(extensionRoot), manifest.name, "A pasta carregável deve ter o nome da extensão.");
assert.deepEqual(manifest.permissions, ["storage", "notifications", "alarms"]);
assert.ok(!manifest.permissions.includes("activeTab"), "activeTab é redundante quando os hosts já estão declarados.");
assert.equal(
  manifest.background?.service_worker,
  "background/service-worker.js",
  "As notificações precisam ser processadas pelo service worker da extensão."
);
assert.deepEqual(manifest.host_permissions, [
  "https://ia-nocodb.internetway.com.br/*",
  "https://erp.internetway.com.br/*",
  "https://wayinternet.matrixdobrasil.ai/*"
]);
const chatwootRuntimeEntry = manifest.content_scripts.find((entry) =>
  entry.js.includes("scripts/way-mensagens.js")
);
const chatwootBridgeEntry = manifest.content_scripts.find((entry) =>
  entry.js.includes("content/chatwoot-realtime-bridge.js")
);
assert.ok(chatwootRuntimeEntry, "O runtime do ChatWoot precisa estar cadastrado.");
assert.ok(chatwootBridgeEntry, "A ponte em tempo real do ChatWoot precisa estar cadastrada.");
assert.equal(chatwootBridgeEntry.world, "MAIN", "A ponte precisa observar o WebSocket no contexto da página.");
assert.equal(chatwootBridgeEntry.run_at, "document_start");
assert.ok(
  chatwootRuntimeEntry.js.indexOf("config/default-messages.js") <
    chatwootRuntimeEntry.js.indexOf("scripts/way-mensagens.js"),
  "As mensagens nativas precisam ser carregadas antes do script Way Mensagens."
);
for (const entry of manifest.content_scripts) {
  if (entry.world === "MAIN") {
    continue;
  }

  const dictionaryIndex = entry.js.indexOf("config/spelling-dictionary.js");
  const engineIndex = entry.js.indexOf("content/spelling-engine.js");
  const correctorIndex = entry.js.indexOf("scripts/way-corretor-ortografico-pro.js");

  if (correctorIndex < 0) {
    continue;
  }

  assert.ok(dictionaryIndex >= 0, `Dicionário ausente em ${entry.matches.join(", ")}.`);
  assert.ok(engineIndex > dictionaryIndex, "O motor ortográfico deve carregar depois do dicionário.");
  assert.ok(correctorIndex > engineIndex, "O corretor deve carregar depois do motor ortográfico.");
}

const referencedFiles = [
  manifest.background.service_worker,
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
const erpReportGeneratorSource = readFileSync(resolve(extensionRoot, "scripts/way-erp-gerador-relato.js"), "utf8");
const compactInterfaceSource = readFileSync(resolve(extensionRoot, "scripts/way-interface-compacta.js"), "utf8");
const erpThemeSource = readFileSync(resolve(extensionRoot, "scripts/way-erp-temas.js"), "utf8");
const matrixMessagesSource = readFileSync(resolve(extensionRoot, "scripts/matrix-mensagens.js"), "utf8");
const matrixInterfaceSource = readFileSync(resolve(extensionRoot, "scripts/matrix-interface-compacta.js"), "utf8");
const matrixThemeSource = readFileSync(resolve(extensionRoot, "scripts/matrix-temas.js"), "utf8");
const matrixPasteSource = readFileSync(resolve(extensionRoot, "scripts/matrix-corrigir-colagem.js"), "utf8");
const spellingScriptSource = readFileSync(resolve(extensionRoot, "scripts/way-corretor-ortografico-pro.js"), "utf8");
const spellingDictionarySource = readFileSync(resolve(extensionRoot, "config/spelling-dictionary.js"), "utf8");
const spellingEngineSource = readFileSync(resolve(extensionRoot, "content/spelling-engine.js"), "utf8");
const runtimeSource = readFileSync(resolve(extensionRoot, "content/runtime.js"), "utf8");
const chatwootRealtimeBridgeSource = readFileSync(
  resolve(extensionRoot, "content/chatwoot-realtime-bridge.js"),
  "utf8"
);
const messageNotificationPolicySource = readFileSync(resolve(extensionRoot, "content/message-notification-policy.js"), "utf8");
const backgroundServiceWorkerSource = readFileSync(resolve(extensionRoot, "background/service-worker.js"), "utf8");
const popupSource = readFileSync(resolve(extensionRoot, "popup/popup.js"), "utf8");
const popupHtmlSource = readFileSync(resolve(extensionRoot, "popup/popup.html"), "utf8");
const privacyPolicySource = readFileSync(resolve(root, "docs/index.html"), "utf8");
assert.match(popupHtmlSource, /<img class="brand-mark" src="\.\.\/128\.png"/);
assert.doesNotMatch(popupHtmlSource, /<span class="brand-mark"[^>]*>W<\/span>/);
for (const tabName of ["home", "tools", "settings"]) {
  assert.match(popupHtmlSource, new RegExp(`data-tab-target="${tabName}"`));
  assert.match(popupHtmlSource, new RegExp(`data-tab-panel="${tabName}"`));
}
assert.match(popupHtmlSource, /id="compatible-scripts-list"/);
assert.match(popupSource, /function activateTab\(/);
assert.match(popupSource, /function renderCompatibleScripts\(/);
assert.match(popupSource, /function createScriptGroup\(/);
assert.match(popupSource, /label:\s*"ChatWoot"/);
assert.match(popupSource, /label:\s*"ERP Way"/);
assert.match(popupSource, /label:\s*"Matrix"/);
assert.match(privacyPolicySource, /<code>notifications<\/code>/);
assert.match(privacyPolicySource, /<code>alarms<\/code>/);
assert.match(privacyPolicySource, /chrome\.storage\.session/);
assert.match(privacyPolicySource, /Central de Notificações ou na tela bloqueada/);
assert.doesNotMatch(privacyPolicySource, /devem ser substituídos pelas informações reais/);
assert.match(catalogSource, /id:\s*"way-mensagens"/);
assert.match(catalogSource, /id:\s*"way-mensagens"[\s\S]*?version:\s*"3\.7"/);
assert.match(catalogSource, /id:\s*"way-erp-copiar-dados"/);
assert.match(catalogSource, /version:\s*"1\.6"/);
assert.match(catalogSource, /id:\s*"way-erp-gerador-relato"/);
assert.match(catalogSource, /name:\s*"ERP — Gerador de Relato"/);
assert.match(catalogSource, /id:\s*"way-interface-compacta"/);
assert.match(catalogSource, /name:\s*"ERP — Interface Compacta"/);
assert.match(catalogSource, /id:\s*"way-erp-temas"/);
assert.match(catalogSource, /name:\s*"ERP — Tema Claro\/Escuro"/);
assert.match(catalogSource, /badge:\s*"BETA"/);
assert.match(catalogSource, /id:\s*"matrix-mensagens"/);
assert.match(catalogSource, /name:\s*"Matrix — Mensagens Personalizadas"/);
assert.match(catalogSource, /id:\s*"matrix-interface-compacta"/);
assert.match(catalogSource, /name:\s*"Matrix — Interface Compacta"/);
assert.match(catalogSource, /id:\s*"matrix-temas"/);
assert.match(catalogSource, /name:\s*"Matrix — Tema Claro\/Escuro"/);
assert.match(catalogSource, /id:\s*"matrix-corrigir-colagem"/);
assert.match(catalogSource, /name:\s*"Matrix — Corrigir Colagem"/);
assert.match(catalogSource, /id:\s*"way-corretor-ortografico-pro"/);
assert.match(catalogSource, /version:\s*"3\.2"/);

const catalogContext = {};
vm.runInNewContext(catalogSource, catalogContext);
assert.equal(catalogContext.WAY_TOOLS_SCRIPTS.length, 10, "O painel precisa listar os dez scripts nativos.");
assert.deepEqual(
  JSON.parse(JSON.stringify(catalogContext.WAY_TOOLS_SCRIPTS.map((script) => script.id))),
  [
    "way-mensagens",
    "way-erp-copiar-dados",
    "way-erp-gerador-relato",
    "way-interface-compacta",
    "way-erp-temas",
    "matrix-mensagens",
    "matrix-interface-compacta",
    "matrix-temas",
    "matrix-corrigir-colagem",
    "way-corretor-ortografico-pro"
  ]
);
assert.ok(Object.isFrozen(catalogContext.WAY_TOOLS_SCRIPTS), "O catálogo de scripts precisa ser imutável.");
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "way-erp-gerador-relato").defaultEnabled,
  true,
  "ERP — Gerador de Relato precisa iniciar ativado por padrão."
);
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "way-interface-compacta").defaultEnabled,
  true,
  "ERP — Interface Compacta precisa iniciar ativado por padrão."
);
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "way-erp-temas").defaultEnabled,
  false,
  "ERP — Tema Claro/Escuro precisa iniciar desativado por padrão."
);
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "matrix-mensagens").defaultEnabled,
  true,
  "Matrix — Mensagens Personalizadas precisa iniciar ativado por padrão."
);
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "matrix-interface-compacta").defaultEnabled,
  true,
  "Matrix — Interface Compacta precisa iniciar ativado por padrão."
);
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "matrix-temas").defaultEnabled,
  false,
  "Matrix — Tema Claro/Escuro precisa iniciar desativado por padrão."
);
assert.equal(
  catalogContext.WAY_TOOLS_SCRIPTS.find((script) => script.id === "matrix-corrigir-colagem").defaultEnabled,
  true,
  "Matrix — Corrigir Colagem precisa iniciar ativado por padrão."
);
assert.match(runtimeSource, /onValueChanged\(key, callback\)/);
assert.match(popupSource, /script\.badge/);
assert.match(popupSource, /script-badge/);
assert.match(runtimeSource, /chrome\.storage\.onChanged\.addListener\(listener\)/);
assert.match(runtimeSource, /snapshot\[namespacedKey\]\s*=\s*change\.newValue/);
assert.match(scriptSource, /WayToolsRuntime\.run\("way-mensagens"/);
assert.match(scriptSource, /const GM_getValue = storage\.getValue/);
assert.match(scriptSource, /const GM_setValue = storage\.setValue/);
assert.match(scriptSource, /\[Way Mensagens\] v3\.7 ativa\./);
assert.match(scriptSource, /function monitorarNovasMensagens\(/);
assert.match(scriptSource, /function monitorarNotificacaoInatividade\(/);
assert.match(scriptSource, /function abaConversasMinhasEstaAtiva\(/);
assert.match(scriptSource, /localizarAbaConversas\(\s*'Minhas'\s*\)/);
assert.match(scriptSource, /const ESTADO_CONVERSAS_MINHAS\s*=/);
assert.match(scriptSource, /function obterCardsConversasMinhas\(/);
assert.match(scriptSource, /const cardsNotificaveis\s*=/);
assert.match(scriptSource, /cardsNotificaveis\.has\(/);
assert.match(scriptSource, /classList\.contains\(\s*'after:bg-n-brand'\s*\)/);
assert.match(scriptSource, /classList\.contains\(\s*'after:opacity-100'\s*\)/);
assert.match(scriptSource, /const cardsParaNotificacoes\s*=/);
assert.match(scriptSource, /atualizarTituloMensagensNaoLidas\(\s*cardsParaNotificacoes\s*\)/);
assert.match(scriptSource, /monitorarNovasMensagens\(\s*cardsParaNotificacoes\s*\)/);
assert.match(scriptSource, /const ESTADO_NOTIFICACOES_INATIVIDADE/);
assert.match(scriptSource, /amarelo:\s*2/);
assert.match(scriptSource, /laranja:\s*5/);
assert.match(scriptSource, /vermelho:\s*10/);
assert.match(scriptSource, /notificarAmarelo:\s*true/);
assert.match(scriptSource, /notificarLaranja:\s*true/);
assert.match(scriptSource, /notificarVermelho:\s*true/);
assert.match(scriptSource, /padrao\.notificarAmarelo/);
assert.match(scriptSource, /padrao\.notificarLaranja/);
assert.match(scriptSource, /padrao\.notificarVermelho/);
assert.match(scriptSource, /name="notificarAmarelo"/);
assert.match(scriptSource, /name="notificarLaranja"/);
assert.match(scriptSource, /name="notificarVermelho"/);
assert.match(scriptSource, /atendimento sem nova atividade há/);
assert.match(scriptSource, /\|inatividade\|\$\{nivel\}\|/);
assert.match(scriptSource, /function atualizarTituloMensagensNaoLidas\(/);
assert.match(scriptSource, /cards\.reduce\(/);
assert.match(scriptSource, /`\(\$\{quantidadeTotal\}\) \$\{tituloBase\}`/);
assert.match(scriptSource, /document\.title\s*=\s*proximoTitulo/);
assert.match(scriptSource, /atualizarTituloMensagensNaoLidas\(\s*cards\s*\)/);
assert.match(scriptSource, /return '\*\*HOJE\*\*';/);
assert.match(scriptSource, /return '\*\*AMANHÃ\*\*';/);
assert.match(scriptSource, /`\$\{referencia\}, \*\*\$\{dataFormatada\}\*\*`/);
assert.match(scriptSource, /`da \*\*\$\{periodo\.nome\.toLowerCase\(\)\}\*\*, `/);
assert.match(scriptSource, /`das \*\*\$\{periodo\.inicio\.replace\(':00', ''\)\} às \$\{periodo\.fim\.replace\(':00', ''\)\}\*\*`/);
assert.doesNotMatch(scriptSource, /return '\*HOJE\*';/);
assert.doesNotMatch(scriptSource, /return '\*AMANHÃ\*';/);
assert.match(scriptSource, /wayTools:iaMessageNotification/);
assert.match(scriptSource, /wayTools:syncChatwootInactivity/);
assert.match(scriptSource, /wayTools:cancelChatwootInactivity/);
assert.match(scriptSource, /iniciarMonitorRealtimeChatWoot/);
assert.match(scriptSource, /ESTADO_CHATWOOT_REALTIME/);
assert.match(scriptSource, /function obterAccountIdPelaUrlAtual\(/);
assert.match(scriptSource, /conversaMonitorada\?\.accountId/);
assert.match(chatwootRealtimeBridgeSource, /message\.created/);
assert.match(chatwootRealtimeBridgeSource, /assignee\.changed/);
assert.match(chatwootRealtimeBridgeSource, /RoomChannel/);
assert.match(chatwootRealtimeBridgeSource, /assignee_type/);
assert.match(chatwootRealtimeBridgeSource, /assigned-snapshot/);
assert.match(chatwootRealtimeBridgeSource, /function accountIdFromUrl\(/);
assert.doesNotMatch(chatwootRealtimeBridgeSource, /post\([^)]*pubsub_token/);

const bridgePostedMessages = [];
const bridgeWindowListeners = new Map();

class BridgeTestWebSocket {
  constructor(url) {
    this.url = url;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  send(data) {
    this.lastSentData = data;
  }

  emit(type, data) {
    for (const listener of this.listeners.get(type) || []) {
      listener({ data });
    }
  }
}

class BridgeTestXmlHttpRequest {
  addEventListener() {}
  open() {}
  send() {}
  setRequestHeader() {}
}

const bridgeWindow = {
  fetch: async () => ({ ok: false }),
  WebSocket: BridgeTestWebSocket,
  postMessage: (message, targetOrigin) => {
    bridgePostedMessages.push({ message, targetOrigin });
  },
  addEventListener: (type, listener) => {
    const listeners = bridgeWindowListeners.get(type) || [];
    listeners.push(listener);
    bridgeWindowListeners.set(type, listeners);
  }
};
const bridgeContext = {
  Headers,
  Request,
  URL,
  XMLHttpRequest: BridgeTestXmlHttpRequest,
  location: {
    href: "https://ia-nocodb.internetway.com.br/app/accounts/2/dashboard"
  },
  queueMicrotask: (callback) => callback(),
  setInterval: () => 1,
  setTimeout: (callback) => {
    callback();
    return 1;
  },
  window: bridgeWindow
};
vm.createContext(bridgeContext);
vm.runInContext(chatwootRealtimeBridgeSource, bridgeContext);

const bridgeSocket = new bridgeWindow.WebSocket(
  "wss://ia-nocodb.internetway.com.br/cable"
);
bridgeSocket.emit("message", JSON.stringify({
  identifier: JSON.stringify({
    channel: "RoomChannel",
    pubsub_token: "token-que-nao-pode-sair-da-pagina",
    account_id: 2,
    user_id: 78
  }),
  message: {
    event: "message.created",
    data: {
      id: 119782,
      account_id: 2,
      conversation_id: 4504,
      message_type: 0,
      sender_type: "Contact",
      private: false,
      content: "Preciso de ajuda com a conexão",
      created_at: 1_790_879_169,
      conversation: {
        assignee_id: 78,
        unread_count: 1,
        last_activity_at: 1_790_879_169
      },
      sender: {
        id: 83,
        name: "Cliente Teste",
        email: "dado-sensivel@example.com",
        phone_number: "+5500000000000",
        custom_attributes: { documento: "00000000000" }
      }
    }
  }
}));
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));

const bridgeIdentityMessage = bridgePostedMessages.find(
  ({ message }) => message.type === "identity"
);
const bridgeRealtimeMessage = bridgePostedMessages.find(
  ({ message }) => message.type === "event"
);
assert.deepEqual(
  JSON.parse(JSON.stringify(bridgeIdentityMessage?.message.payload)),
  { accountId: 2, userId: 78 },
  "A ponte precisa identificar a conta e o atendente pelo RoomChannel."
);
assert.equal(bridgeRealtimeMessage?.message.payload.event, "message.created");
assert.equal(bridgeRealtimeMessage?.message.payload.conversationId, 4504);
assert.equal(bridgeRealtimeMessage?.message.payload.assigneeId, 78);
assert.equal(bridgeRealtimeMessage?.message.payload.customerName, "Cliente Teste");
assert.equal(
  bridgeRealtimeMessage?.message.payload.url,
  "https://ia-nocodb.internetway.com.br/app/accounts/2/conversations/4504"
);

bridgeSocket.emit("message", JSON.stringify({
  identifier: JSON.stringify({
    channel: "RoomChannel",
    pubsub_token: "outro-token-privado",
    account_id: 2,
    user_id: 78
  }),
  message: {
    event: "assignee.changed",
    data: {
      id: 4527,
      account_id: 2,
      status: "pending",
      last_activity_at: 1_790_879_574,
      meta: {
        assignee: { id: 1, name: "Robô", type: "agent_bot" },
        sender: {
          name: "Outro Cliente",
          custom_attributes: { documento: "11111111111" }
        }
      }
    }
  }
}));
const bridgeAssignmentMessage = bridgePostedMessages.find(
  ({ message }) =>
    message.type === "event" &&
    message.payload?.event === "assignee.changed"
);
assert.equal(bridgeAssignmentMessage?.message.payload.conversationId, 4527);
assert.equal(bridgeAssignmentMessage?.message.payload.assigneeId, 1);
assert.equal(bridgeAssignmentMessage?.message.payload.assigneeType, "agent_bot");
const serializedBridgeMessages = JSON.stringify(bridgePostedMessages);
for (const forbiddenValue of [
  "token-que-nao-pode-sair-da-pagina",
  "outro-token-privado",
  "dado-sensivel@example.com",
  "+5500000000000",
  "00000000000",
  "11111111111"
]) {
  assert.doesNotMatch(
    serializedBridgeMessages,
    new RegExp(forbiddenValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    "A ponte em tempo real só pode publicar os campos operacionais sanitizados."
  );
}
assert.match(scriptSource, /ultimaMensagemFoiDoAtendente/);
assert.match(scriptSource, /\.right-bubble/);
assert.match(scriptSource, /\.left-bubble/);
assert.match(scriptSource, /\.message-bubble-container/);
assert.match(scriptSource, /document\.visibilityState/);
assert.match(scriptSource, /document\.hasFocus\(\)/);
assert.match(scriptSource, /suppressNotification:/);
assert.match(scriptSource, /Testar notificação de mensagem/);
assert.match(backgroundServiceWorkerSource, /chrome\.notifications\.create/);
assert.match(backgroundServiceWorkerSource, /DURATION_STORAGE_KEY\s*=\s*"wayTools\.notifications\.duration"/);
assert.match(backgroundServiceWorkerSource, /DEFAULT_DURATION\s*=\s*"5"/);
assert.match(backgroundServiceWorkerSource, /requireInteraction:\s*duration\s*!==\s*"windows"/);
assert.match(backgroundServiceWorkerSource, /chrome\.alarms\.onAlarm/);
assert.match(backgroundServiceWorkerSource, /EXPIRATION_PREFIX\s*=\s*"wayTools\.notificationExpiration\."/);
assert.match(backgroundServiceWorkerSource, /chrome\.notifications\.getAll\(\)/);
assert.match(backgroundServiceWorkerSource, /async function restoreAutoCloseSchedules\(/);
assert.match(backgroundServiceWorkerSource, /async function restoreInactivitySchedules\(/);
assert.match(backgroundServiceWorkerSource, /INACTIVITY_ALARM_PREFIX/);
assert.match(backgroundServiceWorkerSource, /const uniqueSuffix\s*=/);
assert.match(backgroundServiceWorkerSource, /title:\s*customerName/);
assert.doesNotMatch(backgroundServiceWorkerSource, /title:\s*`Nova mensagem/);
assert.doesNotMatch(backgroundServiceWorkerSource, /contextMessage:/);
assert.match(backgroundServiceWorkerSource, /chrome\.notifications\.onClicked/);
assert.match(scriptSource, /wayTools\.notifications\.whenFocused/);
assert.match(scriptSource, /notificarEmPrimeiroPlano:\s*false/);
assert.match(scriptSource, /!PREFERENCIAS_NOTIFICACOES[\s\S]*?\.notificarEmPrimeiroPlano\s*&&[\s\S]*?paginaChatWootEstaEmUso\(\)/);
assert.ok(
  chatwootRuntimeEntry.js.includes("content/message-notification-policy.js"),
  "A política de deduplicação precisa carregar no ChatWoot."
);

const notificationPolicyContext = {};
vm.runInNewContext(messageNotificationPolicySource, notificationPolicyContext);
const notificationPolicy = notificationPolicyContext.WayToolsMessageNotificationPolicy;
assert.equal(notificationPolicy.isCurrentActivityLabel(" now "), true);
assert.equal(notificationPolicy.isCurrentActivityLabel("agora"), true);
assert.equal(notificationPolicy.isCurrentActivityLabel("1m"), false);
assert.equal(
  notificationPolicy.shouldNotifyInactivityTransition("normal", "yellow", { enabled: true }),
  true,
  "Entrar no amarelo deve notificar quando a opção estiver ativa."
);
assert.equal(
  notificationPolicy.shouldNotifyInactivityTransition("yellow", "yellow", { enabled: true }),
  false,
  "Permanecer no mesmo nível não pode repetir a notificação."
);
assert.equal(
  notificationPolicy.shouldNotifyInactivityTransition("yellow", "orange", { enabled: true }),
  true,
  "Subir para o laranja deve gerar uma nova notificação."
);
assert.equal(
  notificationPolicy.shouldNotifyInactivityTransition("orange", "red", { enabled: false }),
  false,
  "Um nível desativado não pode gerar notificação."
);
assert.equal(
  notificationPolicy.shouldNotifyInactivityTransition("normal", "red", {
    enabled: true,
    warmingUp: true
  }),
  false,
  "A carga inicial não pode disparar alertas de inatividade em massa."
);

const firstMessage = {
  isNow: true,
  isOutgoing: false,
  signature: notificationPolicy.createSignature({
    conversationKey: "conversation:1369",
    preview: "Preciso de ajuda",
    unreadCount: 1
  })
};
const warmupResult = notificationPolicy.evaluate(null, firstMessage, {
  now: 1_000,
  warmingUp: true
});
assert.equal(warmupResult.notify, false, "A carga inicial não pode disparar várias notificações.");
const repeatedResult = notificationPolicy.evaluate(warmupResult.next, firstMessage, {
  now: 7_000,
  warmingUp: false
});
assert.equal(repeatedResult.notify, false, "O mesmo estado 'now' não pode notificar repetidamente.");
const secondMessage = {
  ...firstMessage,
  signature: notificationPolicy.createSignature({
    conversationKey: "conversation:1369",
    preview: "Ainda estou aguardando",
    unreadCount: 2
  })
};
const secondMessageResult = notificationPolicy.evaluate(repeatedResult.next, secondMessage, {
  now: 8_000,
  warmingUp: false
});
assert.equal(secondMessageResult.notify, true, "Uma nova mensagem deve gerar uma notificação.");
const duplicateMessageResult = notificationPolicy.evaluate(secondMessageResult.next, secondMessage, {
  now: 9_000,
  warmingUp: false
});
assert.equal(duplicateMessageResult.notify, false, "Uma mensagem já notificada não pode ser repetida.");
const outgoingResult = notificationPolicy.evaluate(duplicateMessageResult.next, {
  ...secondMessage,
  isOutgoing: true,
  signature: `${secondMessage.signature}|atendente`
}, {
  now: 10_000,
  warmingUp: false
});
assert.equal(outgoingResult.notify, false, "Respostas do atendente não devem gerar notificações.");

const focusedMessage = {
  ...secondMessage,
  signature: `${secondMessage.signature}|aba-em-uso`
};
const focusedResult = notificationPolicy.evaluate(outgoingResult.next, focusedMessage, {
  now: 11_000,
  warmingUp: false,
  suppressNotification: true
});
assert.equal(focusedResult.notify, false, "A conversa aberta e em foco não deve gerar notificação.");
const focusedMessageAfterLeaving = notificationPolicy.evaluate(focusedResult.next, focusedMessage, {
  now: 12_000,
  warmingUp: false,
  suppressNotification: false
});
assert.equal(
  focusedMessageAfterLeaving.notify,
  false,
  "Uma mensagem já vista com a aba em foco não deve reaparecer ao trocar de janela."
);

const backgroundMessageListeners = [];
const backgroundClickListeners = [];
const backgroundCloseListeners = [];
const backgroundAlarmListeners = [];
const backgroundStartupListeners = [];
const backgroundInstalledListeners = [];
const createdNotifications = [];
const scheduledNotificationTimeouts = [];
const scheduledNotificationAlarms = [];
const updatedNotificationTabs = [];
const createdNotificationTabs = [];
const focusedNotificationWindows = [];
const sessionStorage = {};
const activeNotifications = {};
let notificationDurationSetting = "windows";
let notificationTabExists = true;
let notificationTabActive = false;
let notificationWindowFocused = false;
let queriedNotificationTabs = [];
const backgroundContext = {
  URL,
  setTimeout: (callback, milliseconds) => {
    const id = scheduledNotificationTimeouts.length + 1;
    scheduledNotificationTimeouts.push({ id, callback, milliseconds });
    return id;
  },
  clearTimeout: () => undefined,
  chrome: {
    runtime: {
      lastError: undefined,
      getURL: (path) => `chrome-extension://way-tools/${path}`,
      onMessage: {
        addListener: (listener) => backgroundMessageListeners.push(listener)
      },
      onStartup: {
        addListener: (listener) => backgroundStartupListeners.push(listener)
      },
      onInstalled: {
        addListener: (listener) => backgroundInstalledListeners.push(listener)
      }
    },
    storage: {
      local: {
        get: async (defaults) => ({
          ...defaults,
          "wayTools.notifications.duration": notificationDurationSetting
        })
      },
      session: {
        get: async (key) => {
          if (key === null) {
            return { ...sessionStorage };
          }
          if (Array.isArray(key)) {
            return Object.fromEntries(key.map((item) => [item, sessionStorage[item]]));
          }
          return { [key]: sessionStorage[key] };
        },
        set: async (values) => Object.assign(sessionStorage, values),
        remove: async (keys) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete sessionStorage[key];
          }
        }
      }
    },
    alarms: {
      clear: async () => true,
      create: async (name, options) => {
        scheduledNotificationAlarms.push({ name, options });
      },
      onAlarm: {
        addListener: (listener) => backgroundAlarmListeners.push(listener)
      }
    },
    notifications: {
      create: async (id, options) => {
        createdNotifications.push({ id, options });
        activeNotifications[id] = options;
        return id;
      },
      clear: async (id) => {
        const existed = Object.prototype.hasOwnProperty.call(activeNotifications, id);
        delete activeNotifications[id];
        return existed;
      },
      getAll: async () => ({ ...activeNotifications }),
      onClicked: {
        addListener: (listener) => backgroundClickListeners.push(listener)
      },
      onClosed: {
        addListener: (listener) => backgroundCloseListeners.push(listener)
      }
    },
    tabs: {
      query: async () => [...queriedNotificationTabs],
      get: async () => {
        if (!notificationTabExists) {
          throw new Error("A aba foi fechada.");
        }
        return { id: 7, windowId: 1, active: notificationTabActive };
      },
      update: async (tabId, options) => updatedNotificationTabs.push({ tabId, options }),
      create: async (options) => createdNotificationTabs.push(options)
    },
    windows: {
      get: async () => ({ focused: notificationWindowFocused }),
      update: async (windowId, options) => focusedNotificationWindows.push({ windowId, options })
    }
  }
};
vm.createContext(backgroundContext);
vm.runInContext(backgroundServiceWorkerSource, backgroundContext);
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(backgroundMessageListeners.length, 1);
assert.equal(backgroundClickListeners.length, 1);
assert.equal(backgroundCloseListeners.length, 1);
assert.equal(backgroundAlarmListeners.length, 1);
assert.equal(backgroundStartupListeners.length, 1);
assert.equal(backgroundInstalledListeners.length, 1);

const notificationRequest = {
  type: "wayTools:iaMessageNotification",
  conversationKey: "conversation:1369",
  fingerprint: "conversation:1369|preciso de ajuda|1",
  customerName: "Cliente Teste",
  preview: "Preciso de ajuda",
  url: "https://ia-nocodb.internetway.com.br/app/accounts/2/inbox-view/conversation/1369"
};
const trustedSender = {
  url: "https://ia-nocodb.internetway.com.br/app/accounts/2/inbox-view",
  tab: { id: 7 }
};

const firstNotificationResponse = await new Promise((resolvePromise) => {
  assert.equal(
    backgroundMessageListeners[0](notificationRequest, trustedSender, resolvePromise),
    true
  );
});
assert.equal(firstNotificationResponse.ok, true);
assert.equal(firstNotificationResponse.duration, "windows");
assert.equal(createdNotifications.length, 1);
assert.equal(createdNotifications[0].options.requireInteraction, false);
assert.equal(createdNotifications[0].options.title, "Cliente Teste");
assert.equal(createdNotifications[0].options.message, "Preciso de ajuda");
assert.equal(createdNotifications[0].options.contextMessage, undefined);

queriedNotificationTabs = [{
  id: 9,
  windowId: 1,
  active: true,
  url: "https://ia-nocodb.internetway.com.br/app/accounts/2/dashboard"
}];
notificationWindowFocused = true;
const focusedMessageResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    fingerprint: `${notificationRequest.fingerprint}|chatwoot-focused`
  }, trustedSender, resolvePromise);
});
assert.equal(focusedMessageResponse.suppressed, true);
assert.equal(
  createdNotifications.length,
  1,
  "Mensagens não devem notificar quando qualquer aba do ChatWoot estiver ativa e em foco."
);
queriedNotificationTabs = [];
notificationWindowFocused = false;

const duplicateNotificationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0](notificationRequest, trustedSender, resolvePromise);
});
assert.equal(duplicateNotificationResponse.duplicate, true);
assert.equal(createdNotifications.length, 1, "O service worker também deve bloquear notificações duplicadas.");

notificationDurationSetting = "disabled";
const disabledNotificationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    fingerprint: `${notificationRequest.fingerprint}|disabled`
  }, trustedSender, resolvePromise);
});
assert.equal(disabledNotificationResponse.disabled, true);
assert.equal(createdNotifications.length, 1, "A opção desativada não pode criar notificações.");

notificationDurationSetting = "5";
const timedNotificationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    fingerprint: `${notificationRequest.fingerprint}|5s`
  }, trustedSender, resolvePromise);
});
assert.equal(timedNotificationResponse.duration, "5");
assert.equal(createdNotifications.length, 2);
assert.equal(createdNotifications[1].options.requireInteraction, true);
assert.equal(scheduledNotificationTimeouts.at(-1).milliseconds, 5_000);
assert.match(scheduledNotificationAlarms.at(-1).name, /^wayTools\.clearNotification\./);
assert.ok(
  Object.keys(sessionStorage).some((key) =>
    key === `wayTools.notificationExpiration.${timedNotificationResponse.notificationId}`
  ),
  "O prazo da notificação temporizada precisa sobreviver ao encerramento do service worker."
);
scheduledNotificationTimeouts.at(-1).callback();
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(
  Object.prototype.hasOwnProperty.call(activeNotifications, timedNotificationResponse.notificationId),
  false,
  "O timeout principal deve remover a notificação."
);
assert.equal(
  Object.prototype.hasOwnProperty.call(
    sessionStorage,
    `wayTools.notificationExpiration.${timedNotificationResponse.notificationId}`
  ),
  false,
  "A expiração concluída precisa remover seu estado persistido."
);

notificationDurationSetting = "1";
const oneSecondNotificationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    fingerprint: `${notificationRequest.fingerprint}|1s`
  }, trustedSender, resolvePromise);
});
assert.equal(oneSecondNotificationResponse.duration, "1");
assert.equal(createdNotifications.length, 3);
assert.equal(scheduledNotificationTimeouts.at(-1).milliseconds, 1_000);

notificationDurationSetting = "2";
const twoSecondNotificationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    fingerprint: `${notificationRequest.fingerprint}|2s`
  }, trustedSender, resolvePromise);
});
assert.equal(twoSecondNotificationResponse.duration, "2");
assert.equal(createdNotifications.length, 4);
assert.equal(scheduledNotificationTimeouts.at(-1).milliseconds, 2_000);

notificationDurationSetting = "30";
const alarmNotificationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    fingerprint: `${notificationRequest.fingerprint}|30s`
  }, trustedSender, resolvePromise);
});
assert.equal(alarmNotificationResponse.duration, "30");
assert.equal(createdNotifications.length, 5);
assert.match(scheduledNotificationAlarms.at(-1).name, /^wayTools\.clearNotification\./);
assert.ok(scheduledNotificationAlarms.at(-1).options.when > Date.now());
backgroundAlarmListeners[0]({
  name: `wayTools.clearNotification.${alarmNotificationResponse.notificationId}`
});
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(
  Object.prototype.hasOwnProperty.call(activeNotifications, alarmNotificationResponse.notificationId),
  false,
  "O alarme de segurança deve remover a notificação."
);
assert.equal(
  new Set(createdNotifications.map(({ id }) => id)).size,
  createdNotifications.length,
  "Cada evento deve usar um ID próprio para não cancelar o prazo de outra notificação."
);

const expiredNotificationId = "way-tools-ia-restored-expired";
activeNotifications[expiredNotificationId] = { title: "Expirada" };
sessionStorage[`wayTools.notificationExpiration.${expiredNotificationId}`] = {
  notificationId: expiredNotificationId,
  expiresAt: Date.now() - 1_000
};
backgroundStartupListeners[0]();
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(
  Object.prototype.hasOwnProperty.call(activeNotifications, expiredNotificationId),
  false,
  "Ao reiniciar, o service worker deve remover notificações que já venceram."
);

notificationDurationSetting = "windows";
const inactivityRequest = {
  type: "wayTools:syncChatwootInactivity",
  conversation: {
    accountId: 2,
    conversationId: 2468,
    customerName: "Cliente Inatividade",
    preview: "Mensagem anterior",
    url: "https://ia-nocodb.internetway.com.br/app/accounts/2/inbox-view/conversation/2468",
    lastActivityAt: Date.now() - 121_000
  },
  levels: {
    yellow: { minutes: 2, enabled: true },
    orange: { minutes: 5, enabled: true },
    red: { minutes: 10, enabled: true }
  },
  suppressPastLevels: false
};
const inactivitySyncResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0](inactivityRequest, trustedSender, resolvePromise);
});
assert.equal(inactivitySyncResponse.ok, true);
assert.ok(
  sessionStorage["wayTools.chatwootInactivityState.2.2468"],
  "A conversa monitorada precisa sobreviver ao encerramento do service worker."
);
assert.ok(
  scheduledNotificationAlarms.some(({ name }) =>
    name === "wayTools.chatwootInactivityAlarm.2.2468.yellow"
  ),
  "O nível amarelo precisa ser agendado no service worker."
);
const notificationsBeforeInactivity = createdNotifications.length;
backgroundAlarmListeners[0]({
  name: "wayTools.chatwootInactivityAlarm.2.2468.yellow"
});
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(createdNotifications.length, notificationsBeforeInactivity + 1);
assert.equal(createdNotifications.at(-1).options.title, "Cliente Inatividade");
assert.match(createdNotifications.at(-1).options.message, /2 minutos/);

notificationWindowFocused = true;
queriedNotificationTabs = [{
  id: 9,
  windowId: 1,
  active: true,
  url: "https://ia-nocodb.internetway.com.br/app/accounts/2/settings"
}];
const foregroundRequest = {
  ...inactivityRequest,
  conversation: {
    ...inactivityRequest.conversation,
    conversationId: 2469,
    lastActivityAt: Date.now() - 121_000
  }
};
await new Promise((resolvePromise) => {
  backgroundMessageListeners[0](foregroundRequest, trustedSender, resolvePromise);
});
const notificationsBeforeForegroundAlarm = createdNotifications.length;
backgroundAlarmListeners[0]({
  name: "wayTools.chatwootInactivityAlarm.2.2469.yellow"
});
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(
  createdNotifications.length,
  notificationsBeforeForegroundAlarm,
  "O alerta de inatividade deve respeitar a opção de não notificar em primeiro plano."
);
notificationWindowFocused = false;
queriedNotificationTabs = [];

const inactivityCancelResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    type: "wayTools:cancelChatwootInactivity",
    accountId: 2,
    conversationId: 2468
  }, trustedSender, resolvePromise);
});
assert.equal(inactivityCancelResponse.cancelled, true);
assert.equal(
  sessionStorage["wayTools.chatwootInactivityState.2.2468"],
  undefined,
  "Ao reatribuir a conversa, os alarmes antigos precisam ser cancelados."
);

backgroundClickListeners[0](firstNotificationResponse.notificationId);
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(updatedNotificationTabs.at(-1).tabId, trustedSender.tab.id);
assert.equal(updatedNotificationTabs.at(-1).options.active, true);
assert.equal(updatedNotificationTabs.at(-1).options.url, notificationRequest.url);
assert.equal(focusedNotificationWindows.at(-1).windowId, 1);
assert.equal(focusedNotificationWindows.at(-1).options.focused, true);

const closedTabDestinationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    conversationKey: "conversation:closed-tab-test",
    fingerprint: `${notificationRequest.fingerprint}|closed-tab-test`
  }, trustedSender, resolvePromise);
});
notificationTabExists = false;
backgroundClickListeners[0](closedTabDestinationResponse.notificationId);
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(
  createdNotificationTabs.at(-1).url,
  notificationRequest.url,
  "Ao clicar, a conversa deve abrir em uma nova aba quando a aba original não existir mais."
);

const externalDestinationResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    conversationKey: "conversation:external-test",
    fingerprint: `${notificationRequest.fingerprint}|external-test`,
    url: "https://example.com/nao-autorizado"
  }, trustedSender, resolvePromise);
});
backgroundClickListeners[0](externalDestinationResponse.notificationId);
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(
  createdNotificationTabs.at(-1).url,
  trustedSender.url,
  "Destinos externos devem ser substituídos pela página confiável do ChatWoot."
);
assert.doesNotMatch(backgroundServiceWorkerSource, /IA_NOCO_DB_ORIGIN/);
assert.match(backgroundServiceWorkerSource, /function isAllowedDestination\(/);
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
assert.match(erpScriptSource, /\[Way ERP\] Copiar Dados v1\.6 ativo\./);
assert.match(erpScriptSource, /function localizarCampoBarraSuperior\(/);
assert.match(erpScriptSource, /'span, p, label'/);
assert.match(erpScriptSource, /'way-erp-copy-layer'/);
assert.match(erpScriptSource, /'way-erp-copy-floating'/);
assert.match(erpScriptSource, /function executarConfiguracao\(/);
assert.match(erpScriptSource, /wayErpCopyBarra/);
assert.match(erpScriptSource, /function existeModalVisivel\(/);
assert.match(erpScriptSource, /function atualizarVisibilidadeCamadaBarra\(/);
assert.match(erpScriptSource, /\.MuiModal-root:not\(\.MuiPopover-root\)/);
assert.match(erpScriptSource, /wayErpCopyModal/);
assert.match(compactInterfaceSource, /WayToolsRuntime\.run\("way-interface-compacta"/);
assert.match(compactInterfaceSource, /const GM_getValue = storage\.getValue/);
assert.match(compactInterfaceSource, /const GM_setValue = storage\.setValue/);
assert.match(compactInterfaceSource, /registerMenuCommand\("way-interface-compacta"/);
assert.match(compactInterfaceSource, /\[Way Interface\] Interface Compacta 3\.4 ativa\./);
assert.doesNotMatch(compactInterfaceSource, /Matrix|matrixdobrasil|way-matrix-theme/);
assert.doesNotMatch(compactInterfaceSource, /Way ERP Theme|way-erp-theme-dark/);
assert.match(erpThemeSource, /WayToolsRuntime\.run\("way-erp-temas"/);
assert.match(erpThemeSource, /registerMenuCommand\("way-erp-temas"/);
assert.match(
  erpThemeSource,
  /window\.location\.hostname\s*===\s*"erp\.internetway\.com\.br"/,
  "O tema do ERP precisa ficar protegido pelo domínio correspondente."
);
assert.match(erpThemeSource, /\[Way ERP Theme\] Light\/Dark Mode 1\.0 ativo\./);
assert.match(erpThemeSource, /const STORAGE_THEME_ERP\s*=\s*'way-erp-theme'/);
assert.match(erpThemeSource, /way-erp-theme-light/);
assert.match(erpThemeSource, /way-erp-theme-dark/);
assert.match(erpThemeSource, /\.MuiPaper-root:not\(\.MuiAlert-root\)/);
assert.match(erpThemeSource, /\.modal-content/);
assert.match(erpThemeSource, /EH_FRAME_PRINCIPAL/);
assert.match(erpThemeSource, /ul\.font-indicators\.tasks-list/);
assert.match(erpThemeSource, /\.panel-content/);
assert.match(erpThemeSource, /table\.synsuite-datatable/);
assert.match(erpThemeSource, /\.dataTables_toolbar/);
assert.match(erpThemeSource, /\.MuiDialogContent-root/);
assert.match(erpThemeSource, /div\[role="presentation"\]\s*>\s*\.MuiBox-root/);
assert.match(matrixMessagesSource, /WayToolsRuntime\.run\("matrix-mensagens"/);
assert.match(matrixMessagesSource, /\.faketextbox\.pastable\[contenteditable="true"\]/);
assert.match(matrixMessagesSource, /div\[id\^="message-"\]\[contenteditable="true"\]/);
assert.match(matrixMessagesSource, /const TOOLBAR_SELECTOR\s*=\s*"\.acoes-agente"/);
assert.match(matrixMessagesSource, /document\.querySelector\("#user_info"\)/);
assert.match(matrixMessagesSource, /\.split\(\/\\s\+\/\)\[0\]/);
assert.match(matrixMessagesSource, /"\.contato-nome"/);
assert.match(matrixMessagesSource, /"\.contato-telefone"/);
assert.match(matrixMessagesSource, /"\.contato-email"/);
assert.match(matrixMessagesSource, /"\.contato-cpf"/);
assert.match(matrixMessagesSource, /"\.atendimento-protocolo"/);
assert.match(matrixMessagesSource, /chrome\.runtime\.getURL\("128\.png"\)/);
assert.match(matrixMessagesSource, /function showAutocomplete\(/);
assert.match(matrixMessagesSource, /const CATEGORY_LABELS = Object\.freeze\(/);
assert.match(matrixMessagesSource, /function getCategories\(/);
assert.match(matrixMessagesSource, /function showCategories\(/);
assert.match(matrixMessagesSource, /function openCategory\(/);
assert.match(matrixMessagesSource, /function selectCurrentAutocompleteItem\(/);
assert.match(matrixMessagesSource, /autocomplete\.mode === "categories"/);
assert.match(matrixMessagesSource, /autocomplete\.mode === "category"/);
assert.match(matrixMessagesSource, /Enter abrir/);
assert.match(matrixMessagesSource, /← Categorias/);
assert.match(matrixMessagesSource, /new KeyboardEvent\("keyup"/);
assert.match(matrixMessagesSource, /const blockedCommandEnter = new WeakMap\(\)/);
assert.match(matrixMessagesSource, /event\.stopImmediatePropagation\(\)/);
assert.match(matrixMessagesSource, /document\.addEventListener\("keypress", blockCommandEnterContinuation, true\)/);
assert.match(matrixMessagesSource, /document\.addEventListener\("keyup", blockCommandEnterContinuation, true\)/);
assert.match(matrixMessagesSource, /Enter inserir sem enviar/);
assert.match(matrixMessagesSource, /function openConfig\(/);
assert.match(matrixMessagesSource, /function openAvailability\(/);
assert.match(matrixMessagesSource, /function openVisit\(/);
assert.match(matrixMessagesSource, /Exportar JSON/);
assert.match(matrixMessagesSource, /Importar JSON/);
assert.doesNotMatch(matrixMessagesSource, /ia-nocodb|ProseMirror|conversation-panel/i);
assert.match(scriptSource, /const ENTER_COMANDO_BLOQUEADO\s*=\s*new WeakMap\(\)/);
assert.match(scriptSource, /function bloquearContinuacaoEnterComando\(/);
assert.match(scriptSource, /event\.stopImmediatePropagation\(\)/);
assert.match(scriptSource, /inserir sem enviar/);
assert.match(matrixInterfaceSource, /WayToolsRuntime\.run\("matrix-interface-compacta"/);
assert.match(matrixInterfaceSource, /registerMenuCommand\("matrix-interface-compacta"/);
assert.match(matrixInterfaceSource, /@match\s+https:\/\/wayinternet\.matrixdobrasil\.ai\/\*/);
assert.match(matrixInterfaceSource, /\[Way Interface\] Interface Compacta 3\.4 ativa\./);
assert.doesNotMatch(matrixInterfaceSource, /Way Matrix Theme|way-matrix-theme|matrix-temas/);
assert.doesNotMatch(matrixInterfaceSource, /erp\.internetway\.com\.br|way-erp-theme/i);
assert.match(matrixThemeSource, /WayToolsRuntime\.run\("matrix-temas"/);
assert.match(matrixThemeSource, /registerMenuCommand\("matrix-temas"/);
assert.match(matrixThemeSource, /@match\s+https:\/\/wayinternet\.matrixdobrasil\.ai\/\*/);
assert.match(matrixThemeSource, /\[Way Matrix Theme\] Light\/Dark Mode 1\.1 ativo\./);
assert.match(matrixThemeSource, /const STORAGE_THEME\s*=\s*'way-matrix-theme'/);
assert.doesNotMatch(matrixThemeSource, /erp\.internetway\.com\.br|way-erp-theme/i);
assert.match(matrixPasteSource, /WayToolsRuntime\.run\("matrix-corrigir-colagem"/);
assert.match(matrixPasteSource, /@match\s+https:\/\/wayinternet\.matrixdobrasil\.ai\/\*/);
assert.match(matrixPasteSource, /function limparHTML\(/);
assert.match(matrixPasteSource, /function corrigirCampo\(/);
assert.match(matrixPasteSource, /new MutationObserver\(/);
assert.doesNotMatch(matrixPasteSource, /erp\.internetway\.com\.br|way-interface-compacta|way-erp/i);
assert.match(erpThemeSource, /\.ReactTable/);
assert.match(erpThemeSource, /\.ReactTable \.rt-td/);
assert.match(erpThemeSource, /\.dx-htmleditor/);
assert.match(erpThemeSource, /\.dx-quill-container/);
assert.match(erpThemeSource, /\.way-erp-adaptive-surface/);
assert.match(erpThemeSource, /\.way-erp-adaptive-text/);
assert.match(erpThemeSource, /function interpretarCorErp\(/);
assert.match(erpThemeSource, /function normalizarElementoErp\(/);
assert.match(erpThemeSource, /new MutationObserver\(/);
assert.match(erpThemeSource, /window\.getComputedStyle\(elemento\)/);
assert.match(erpThemeSource, /observarNovasTelasErp\(\)/);
assert.match(erpThemeSource, /\.error-color/);
assert.match(erpThemeSource, /\.alert-color/);
assert.match(erpThemeSource, /\.blue-color/);
assert.match(spellingScriptSource, /WayToolsRuntime\.run\("way-corretor-ortografico-pro"/);
assert.match(spellingScriptSource, /const localStorage = Object\.freeze/);
assert.match(spellingScriptSource, /\[Way AutoCorrect PRO\] iniciado\./);
assert.match(spellingScriptSource, /WAY_TOOLS_SPELLING_DICTIONARY/);
assert.match(spellingScriptSource, /WayToolsSpellingEngine/);
assert.match(
  spellingScriptSource,
  /\.ProseMirror\[contenteditable="true"\]/,
  "O corretor precisa reconhecer o editor ProseMirror usado no chat do ChatWoot."
);
assert.match(
  spellingScriptSource,
  /\.faketextbox\.pastable\[contenteditable="true"\]/,
  "O corretor precisa reconhecer o editor clássico usado no Matrix."
);
assert.match(
  spellingScriptSource,
  /\.dx-htmleditor \.ql-editor\.dx-htmleditor-content\[contenteditable="true"\]/,
  "O corretor precisa reconhecer o editor DevExtreme/Quill usado no ERP."
);
assert.match(
  spellingScriptSource,
  /\.dx-quill-container \.ql-editor\[contenteditable="true"\]/,
  "O corretor precisa reconhecer variações do editor Quill usadas no ERP."
);
assert.match(popupHtmlSource, /id="personal-dictionary"/);
assert.match(popupHtmlSource, /id="correction-form"/);
assert.match(popupHtmlSource, /id="ignored-form"/);
assert.match(popupHtmlSource, /id="notification-duration"/);
assert.match(popupHtmlSource, /id="notification-when-focused"/);
for (const duration of ["disabled", "windows", "1", "2", "5", "10", "30", "60", "persistent"]) {
  assert.match(
    popupHtmlSource,
    new RegExp(`<option value="${duration}">`),
    `A duração ${duration} precisa aparecer no painel.`
  );
}
assert.match(popupSource, /wayTools\.notifications\.duration/);
assert.match(popupSource, /notificationDurationDefault\s*=\s*"5"/);
assert.match(popupSource, /wayTools\.notifications\.whenFocused/);
assert.match(popupSource, /notificationWhenFocusedDefault\s*=\s*false/);
assert.doesNotMatch(popupSource, /Recarregue a página do sistema/);
assert.match(spellingScriptSource, /storage\.onValueChanged\?\.\(/);
assert.match(spellingScriptSource, /function atualizarDicionarioPessoal\(/);
assert.match(spellingScriptSource, /let MOTOR\s*=/);
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
  "Os metadados do corretor devem documentar o suporte ao ChatWoot."
);
assert.match(
  spellingScriptSource,
  /@match\s+https:\/\/wayinternet\.matrixdobrasil\.ai\/\*/,
  "Os metadados do corretor devem documentar o suporte ao Matrix."
);
assert.ok(
  catalogContext.WAY_TOOLS_SCRIPTS
    .find((script) => script.id === "way-corretor-ortografico-pro")
    .matches
    .includes("https://ia-nocodb.internetway.com.br/*"),
  "O catálogo deve informar que o corretor funciona no ChatWoot."
);
assert.ok(
  catalogContext.WAY_TOOLS_SCRIPTS
    .find((script) => script.id === "way-corretor-ortografico-pro")
    .matches
    .includes("https://wayinternet.matrixdobrasil.ai/*"),
  "O catálogo deve informar que o corretor funciona no Matrix."
);
assert.ok(
  manifest.content_scripts.some((entry) =>
    entry.matches.includes("https://erp.internetway.com.br/*") &&
    entry.js.includes("scripts/way-erp-copiar-dados.js")
  ),
  "O script de cópia precisa estar registrado somente no domínio do ERP."
);
const matrixEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://wayinternet.matrixdobrasil.ai/*")
);
assert.equal(matrixEntries.length, 1, "O Matrix deve carregar uma única instância isolada do runtime.");
assert.ok(manifest.host_permissions.includes("https://wayinternet.matrixdobrasil.ai/*"));
assert.ok(matrixEntries[0].js.includes("config/default-messages.js"));
assert.ok(matrixEntries[0].js.includes("config/spelling-dictionary.js"));
assert.ok(matrixEntries[0].js.includes("content/spelling-engine.js"));
assert.ok(matrixEntries[0].js.includes("scripts/matrix-mensagens.js"));
assert.ok(matrixEntries[0].js.includes("scripts/matrix-interface-compacta.js"));
assert.ok(matrixEntries[0].js.includes("scripts/matrix-temas.js"));
assert.ok(matrixEntries[0].js.includes("scripts/matrix-corrigir-colagem.js"));
assert.ok(matrixEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
assert.ok(!matrixEntries[0].js.includes("scripts/way-interface-compacta.js"));
assert.ok(!matrixEntries[0].js.includes("scripts/way-erp-temas.js"));
assert.ok(!matrixEntries[0].js.includes("scripts/way-erp-copiar-dados.js"));
assert.ok(!matrixEntries[0].js.includes("scripts/way-erp-gerador-relato.js"));
assert.ok(
  manifest.web_accessible_resources.some((entry) =>
    entry.resources.includes("128.png") &&
    entry.matches.includes("https://wayinternet.matrixdobrasil.ai/*")
  ),
  "O ícone do Way Tools precisa estar acessível ao botão inserido no Matrix."
);
assert.match(privacyPolicySource, /ChatWoot, ERP Way e Matrix/);
const chatwootEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://ia-nocodb.internetway.com.br/*")
);
assert.equal(chatwootEntries.length, 2, "O ChatWoot deve carregar a ponte MAIN e uma única instância do runtime isolado.");
assert.equal(
  chatwootEntries.filter((entry) => entry.js.includes("scripts/way-mensagens.js")).length,
  1,
  "O Way Mensagens não pode ser iniciado duas vezes."
);
assert.ok(chatwootRuntimeEntry.js.includes("scripts/way-mensagens.js"));
assert.ok(chatwootRuntimeEntry.js.includes("scripts/way-corretor-ortografico-pro.js"));
const erpEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://erp.internetway.com.br/*")
);
assert.equal(erpEntries.length, 1, "O ERP deve carregar apenas uma instância do runtime.");
assert.equal(erpEntries[0].all_frames, true, "O ERP precisa executar as ferramentas também nos quadros internos.");
assert.equal(erpEntries[0].match_about_blank, true, "Quadros internos criados pelo ERP também precisam receber as ferramentas.");
assert.ok(erpEntries[0].js.includes("scripts/way-erp-copiar-dados.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-erp-gerador-relato.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-interface-compacta.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-erp-temas.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
assert.ok(!erpEntries[0].js.some((file) => /matrix/i.test(file)));

assert.match(erpReportGeneratorSource, /WayToolsRuntime\.run\("way-erp-gerador-relato"/);
assert.match(erpReportGeneratorSource, /\.dx-htmleditor \.ql-editor\.dx-htmleditor-content\[contenteditable="true"\]/);
assert.match(erpReportGeneratorSource, /const PRODUCTS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /const CHECKS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /const ACTIONS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /const VISIT_REASONS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /const OUTCOME_VALIDATION = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /function selectedProductIds\(/);
assert.match(erpReportGeneratorSource, /function routeAllows\(/);
assert.match(erpReportGeneratorSource, /data-route-products=/);
assert.match(erpReportGeneratorSource, /data-route-summary/);
assert.match(erpReportGeneratorSource, /way-report-optional/);
assert.match(erpReportGeneratorSource, /Selecione pelo menos um produto ou serviço para montar a rota do relato/);
assert.doesNotMatch(erpReportGeneratorSource, /name="visit_date"|name="visit_period"|name="address_confirmed"|name="phone_confirmed"|DADOS DO AGENDAMENTO/);
assert.match(erpReportGeneratorSource, /function generateReport\(/);
assert.match(erpReportGeneratorSource, /function insertReport\(/);
assert.match(erpReportGeneratorSource, /Abrir Gerador de Relato/);
assert.match(erpReportGeneratorSource, /Inserir relato no campo/);
assert.doesNotMatch(erpReportGeneratorSource, /matrixdobrasil|ia-nocodb|ProseMirror/i);

assert.match(runtimeSource, /registerMenuCommand\(scriptId, label, callback\)/);
assert.match(runtimeSource, /function sharedDataKey\(key\)/);
assert.match(runtimeSource, /`wayTools\.shared\.\$\{key\}`/);
assert.match(runtimeSource, /getSharedValue\(key, fallbackValue\)/);
assert.match(runtimeSource, /setSharedValue\(key, value\)/);
assert.match(runtimeSource, /onSharedValueChanged\(key, callback\)/);

const runtimeListeners = [];
const runtimeStorageListeners = [];
const runtimeContext = {
  chrome: {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => undefined
      },
      onChanged: {
        addListener: (listener) => runtimeStorageListeners.push(listener),
        removeListener: (listener) => {
          const index = runtimeStorageListeners.indexOf(listener);
          if (index >= 0) {
            runtimeStorageListeners.splice(index, 1);
          }
        }
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

let runtimeStorageAdapter;
await runtimeContext.WayToolsRuntime.run(
  "way-corretor-ortografico-pro",
  (storage) => {
    runtimeStorageAdapter = storage;
  }
);
let observedDictionaryChange;
const stopObservingDictionary = runtimeStorageAdapter.onValueChanged(
  "way-corretor-dicionario-pessoal-v1",
  (newValue, oldValue) => {
    observedDictionaryChange = { newValue, oldValue };
  }
);
const runtimeDictionaryKey =
  "wayTools.data.way-corretor-ortografico-pro.way-corretor-dicionario-pessoal-v1";
runtimeStorageListeners[0](
  {
    [runtimeDictionaryKey]: {
      oldValue: "dicionário antigo",
      newValue: "dicionário atualizado"
    }
  },
  "local"
);
assert.deepEqual(
  observedDictionaryChange,
  { newValue: "dicionário atualizado", oldValue: "dicionário antigo" }
);
assert.equal(
  runtimeStorageAdapter.getValue("way-corretor-dicionario-pessoal-v1", null),
  "dicionário atualizado",
  "A página aberta deve receber imediatamente o novo dicionário pessoal."
);
stopObservingDictionary();
assert.equal(runtimeStorageListeners.length, 0);

let chatwootStorageAdapter;
let matrixStorageAdapter;
await runtimeContext.WayToolsRuntime.run("way-mensagens", (storage) => {
  chatwootStorageAdapter = storage;
});
await runtimeContext.WayToolsRuntime.run("matrix-mensagens", (storage) => {
  matrixStorageAdapter = storage;
});

let observedSharedCatalog;
const stopObservingSharedCatalog = matrixStorageAdapter.onSharedValueChanged(
  "messages.catalog.v1",
  (newValue) => {
    observedSharedCatalog = newValue;
  }
);
const sharedCatalog = [{ id: "shared-test", comando: "teste" }];
chatwootStorageAdapter.setSharedValue("messages.catalog.v1", sharedCatalog);
runtimeStorageListeners[0](
  {
    "wayTools.shared.messages.catalog.v1": {
      oldValue: undefined,
      newValue: sharedCatalog
    }
  },
  "local"
);
assert.deepEqual(observedSharedCatalog, sharedCatalog);
assert.deepEqual(
  matrixStorageAdapter.getSharedValue("messages.catalog.v1", null),
  sharedCatalog,
  "ChatWoot e Matrix devem acessar o mesmo catálogo de mensagens."
);
stopObservingSharedCatalog();
assert.equal(runtimeStorageListeners.length, 0);

assert.match(scriptSource, /const SHARED_MESSAGES_KEY\s*=\s*['"]messages\.catalog\.v1['"]/);
assert.match(matrixMessagesSource, /const SHARED_MESSAGES_KEY\s*=\s*['"]messages\.catalog\.v1['"]/);
assert.match(scriptSource, /storage\.setSharedValue\(\s*SHARED_MESSAGES_KEY/);
assert.match(matrixMessagesSource, /storage\.setSharedValue\(SHARED_MESSAGES_KEY/);
assert.match(scriptSource, /storage\.onSharedValueChanged\(\s*SHARED_MESSAGES_KEY/);
assert.match(matrixMessagesSource, /storage\.onSharedValueChanged\(SHARED_MESSAGES_KEY/);

const javascriptFiles = [
  "config/scripts.js",
  "config/default-messages.js",
  "config/spelling-dictionary.js",
  "content/runtime.js",
  "content/chatwoot-realtime-bridge.js",
  "content/message-notification-policy.js",
  "content/spelling-engine.js",
  "background/service-worker.js",
  "popup/popup.js",
  "scripts/way-mensagens.js",
  "scripts/matrix-mensagens.js",
  "scripts/matrix-interface-compacta.js",
  "scripts/matrix-temas.js",
  "scripts/matrix-corrigir-colagem.js",
  "scripts/way-erp-copiar-dados.js",
  "scripts/way-erp-gerador-relato.js",
  "scripts/way-interface-compacta.js",
  "scripts/way-erp-temas.js",
  "scripts/way-corretor-ortografico-pro.js"
];

for (const relativePath of javascriptFiles) {
  execFileSync(process.execPath, ["--check", resolve(extensionRoot, relativePath)], {
    stdio: "pipe"
  });
}

console.log(`Way Tools validado: Manifest V${manifest.manifest_version}, ${javascriptFiles.length} arquivos JavaScript e ${new Set(referencedFiles).size} recursos conferidos.`);
