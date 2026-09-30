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
const compactInterfaceSource = readFileSync(resolve(extensionRoot, "scripts/way-interface-compacta.js"), "utf8");
const pasteFixSource = readFileSync(resolve(extensionRoot, "scripts/matrix-corrigir-colagem.js"), "utf8");
const spellingScriptSource = readFileSync(resolve(extensionRoot, "scripts/way-corretor-ortografico-pro.js"), "utf8");
const spellingDictionarySource = readFileSync(resolve(extensionRoot, "config/spelling-dictionary.js"), "utf8");
const spellingEngineSource = readFileSync(resolve(extensionRoot, "content/spelling-engine.js"), "utf8");
const runtimeSource = readFileSync(resolve(extensionRoot, "content/runtime.js"), "utf8");
const messageNotificationPolicySource = readFileSync(resolve(extensionRoot, "content/message-notification-policy.js"), "utf8");
const backgroundServiceWorkerSource = readFileSync(resolve(extensionRoot, "background/service-worker.js"), "utf8");
const popupSource = readFileSync(resolve(extensionRoot, "popup/popup.js"), "utf8");
const popupHtmlSource = readFileSync(resolve(extensionRoot, "popup/popup.html"), "utf8");
const privacyPolicySource = readFileSync(resolve(root, "docs/index.html"), "utf8");
assert.match(privacyPolicySource, /<code>notifications<\/code>/);
assert.match(privacyPolicySource, /<code>alarms<\/code>/);
assert.match(privacyPolicySource, /chrome\.storage\.session/);
assert.match(privacyPolicySource, /Central de Notificações ou na tela bloqueada/);
assert.doesNotMatch(privacyPolicySource, /devem ser substituídos pelas informações reais/);
assert.match(catalogSource, /id:\s*"way-mensagens"/);
assert.match(catalogSource, /id:\s*"way-mensagens"[\s\S]*?version:\s*"3\.5"/);
assert.match(catalogSource, /id:\s*"way-erp-copiar-dados"/);
assert.match(catalogSource, /version:\s*"1\.6"/);
assert.match(catalogSource, /id:\s*"way-interface-compacta"/);
assert.match(catalogSource, /name:\s*"Interface Compacta \+ Temas"/);
assert.match(catalogSource, /version:\s*"3\.4 \+ 1\.2"/);
assert.match(catalogSource, /id:\s*"matrix-corrigir-colagem"/);
assert.match(catalogSource, /version:\s*"3\.5"/);
assert.match(catalogSource, /id:\s*"way-corretor-ortografico-pro"/);
assert.match(catalogSource, /version:\s*"3\.2"/);

const catalogContext = {};
vm.runInNewContext(catalogSource, catalogContext);
assert.equal(catalogContext.WAY_TOOLS_SCRIPTS.length, 5, "O painel precisa listar os cinco scripts nativos.");
assert.deepEqual(
  JSON.parse(JSON.stringify(catalogContext.WAY_TOOLS_SCRIPTS.map((script) => script.id))),
  [
    "way-mensagens",
    "way-erp-copiar-dados",
    "way-interface-compacta",
    "matrix-corrigir-colagem",
    "way-corretor-ortografico-pro"
  ]
);
assert.ok(Object.isFrozen(catalogContext.WAY_TOOLS_SCRIPTS), "O catálogo de scripts precisa ser imutável.");
assert.match(runtimeSource, /onValueChanged\(key, callback\)/);
assert.match(runtimeSource, /chrome\.storage\.onChanged\.addListener\(listener\)/);
assert.match(runtimeSource, /snapshot\[namespacedKey\]\s*=\s*change\.newValue/);
assert.match(scriptSource, /WayToolsRuntime\.run\("way-mensagens"/);
assert.match(scriptSource, /const GM_getValue = storage\.getValue/);
assert.match(scriptSource, /const GM_setValue = storage\.setValue/);
assert.match(scriptSource, /\[Way Mensagens\] v3\.5 ativa\./);
assert.match(scriptSource, /function monitorarNovasMensagens\(/);
assert.match(scriptSource, /function monitorarNotificacaoInatividade\(/);
assert.match(scriptSource, /function abaConversasMinhasEstaAtiva\(/);
assert.match(scriptSource, /localizarAbaConversas\(\s*'Minhas'\s*\)/);
assert.match(scriptSource, /classList\.contains\(\s*'after:bg-n-brand'\s*\)/);
assert.match(scriptSource, /classList\.contains\(\s*'after:opacity-100'\s*\)/);
assert.match(scriptSource, /const cardsParaNotificacoes\s*=/);
assert.match(scriptSource, /atualizarTituloMensagensNaoLidas\(\s*cardsParaNotificacoes\s*\)/);
assert.match(scriptSource, /monitorarNovasMensagens\(\s*cardsParaNotificacoes\s*\)/);
assert.match(scriptSource, /const ESTADO_NOTIFICACOES_INATIVIDADE/);
assert.match(scriptSource, /notificarAmarelo:\s*false/);
assert.match(scriptSource, /notificarLaranja:\s*false/);
assert.match(scriptSource, /notificarVermelho:\s*false/);
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
assert.match(backgroundServiceWorkerSource, /title:\s*customerName/);
assert.doesNotMatch(backgroundServiceWorkerSource, /title:\s*`Nova mensagem/);
assert.doesNotMatch(backgroundServiceWorkerSource, /contextMessage:/);
assert.match(backgroundServiceWorkerSource, /chrome\.notifications\.onClicked/);
assert.match(scriptSource, /wayTools\.notifications\.whenFocused/);
assert.match(scriptSource, /notificarEmPrimeiroPlano:\s*false/);
assert.match(scriptSource, /!PREFERENCIAS_NOTIFICACOES[\s\S]*?\.notificarEmPrimeiroPlano\s*&&[\s\S]*?paginaChatWootEstaEmUso\(\)/);
assert.ok(
  manifest.content_scripts[0].js.includes("content/message-notification-policy.js"),
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
const createdNotifications = [];
const scheduledNotificationTimeouts = [];
const scheduledNotificationAlarms = [];
const updatedNotificationTabs = [];
const createdNotificationTabs = [];
const focusedNotificationWindows = [];
const sessionStorage = {};
let notificationDurationSetting = "windows";
let notificationTabExists = true;
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
      }
    },
    storage: {
      local: {
        get: (defaults, callback) => callback({
          ...defaults,
          "wayTools.notifications.duration": notificationDurationSetting
        })
      },
      session: {
        get: async (key) => ({ [key]: sessionStorage[key] }),
        set: async (values) => Object.assign(sessionStorage, values),
        remove: async (key) => delete sessionStorage[key]
      }
    },
    alarms: {
      clear: (_name, callback) => callback?.(true),
      create: (name, options, callback) => {
        scheduledNotificationAlarms.push({ name, options });
        callback?.();
      },
      onAlarm: {
        addListener: (listener) => backgroundAlarmListeners.push(listener)
      }
    },
    notifications: {
      create: (id, options, callback) => {
        createdNotifications.push({ id, options });
        callback(id);
      },
      clear: (_id, callback) => callback?.(true),
      onClicked: {
        addListener: (listener) => backgroundClickListeners.push(listener)
      },
      onClosed: {
        addListener: (listener) => backgroundCloseListeners.push(listener)
      }
    },
    tabs: {
      get: async () => {
        if (!notificationTabExists) {
          throw new Error("A aba foi fechada.");
        }
        return { windowId: 1 };
      },
      update: async (tabId, options) => updatedNotificationTabs.push({ tabId, options }),
      create: async (options) => createdNotificationTabs.push(options)
    },
    windows: {
      update: async (windowId, options) => focusedNotificationWindows.push({ windowId, options })
    }
  }
};
vm.createContext(backgroundContext);
vm.runInContext(backgroundServiceWorkerSource, backgroundContext);
assert.equal(backgroundMessageListeners.length, 1);
assert.equal(backgroundClickListeners.length, 1);
assert.equal(backgroundCloseListeners.length, 1);
assert.equal(backgroundAlarmListeners.length, 1);

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

backgroundClickListeners[0](firstNotificationResponse.notificationId);
await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
assert.equal(updatedNotificationTabs.at(-1).tabId, trustedSender.tab.id);
assert.equal(updatedNotificationTabs.at(-1).options.active, true);
assert.equal(focusedNotificationWindows.at(-1).windowId, 1);
assert.equal(focusedNotificationWindows.at(-1).options.focused, true);

notificationTabExists = false;
backgroundClickListeners[0](firstNotificationResponse.notificationId);
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
assert.match(compactInterfaceSource, /\[Way Matrix Theme\] Light\/Dark Mode 1\.1 ativo\./);
assert.match(
  compactInterfaceSource,
  /window\.location\.hostname\s*===\s*"wayinternet\.matrixdobrasil\.ai"/,
  "O tema do Matrix precisa ficar protegido pelo domínio correspondente."
);
assert.match(
  compactInterfaceSource,
  /window\.location\.hostname\s*===\s*"erp\.internetway\.com\.br"/,
  "O tema do ERP precisa ficar protegido pelo domínio correspondente."
);
assert.match(compactInterfaceSource, /\[Way ERP Theme\] Light\/Dark Mode 1\.0 ativo\./);
assert.match(compactInterfaceSource, /const STORAGE_THEME_ERP\s*=\s*'way-erp-theme'/);
assert.match(compactInterfaceSource, /way-erp-theme-light/);
assert.match(compactInterfaceSource, /way-erp-theme-dark/);
assert.match(compactInterfaceSource, /\.MuiPaper-root:not\(\.MuiAlert-root\)/);
assert.match(compactInterfaceSource, /\.modal-content/);
assert.match(compactInterfaceSource, /EH_FRAME_PRINCIPAL/);
assert.match(compactInterfaceSource, /ul\.font-indicators\.tasks-list/);
assert.match(compactInterfaceSource, /\.panel-content/);
assert.match(compactInterfaceSource, /table\.synsuite-datatable/);
assert.match(compactInterfaceSource, /\.dataTables_toolbar/);
assert.match(compactInterfaceSource, /\.MuiDialogContent-root/);
assert.match(compactInterfaceSource, /div\[role="presentation"\]\s*>\s*\.MuiBox-root/);
assert.match(compactInterfaceSource, /\.ReactTable/);
assert.match(compactInterfaceSource, /\.ReactTable \.rt-td/);
assert.match(compactInterfaceSource, /\.dx-htmleditor/);
assert.match(compactInterfaceSource, /\.dx-quill-container/);
assert.match(compactInterfaceSource, /\.way-erp-adaptive-surface/);
assert.match(compactInterfaceSource, /\.way-erp-adaptive-text/);
assert.match(compactInterfaceSource, /function interpretarCorErp\(/);
assert.match(compactInterfaceSource, /function normalizarElementoErp\(/);
assert.match(compactInterfaceSource, /new MutationObserver\(/);
assert.match(compactInterfaceSource, /window\.getComputedStyle\(elemento\)/);
assert.match(compactInterfaceSource, /observarNovasTelasErp\(\)/);
assert.match(compactInterfaceSource, /\.error-color/);
assert.match(compactInterfaceSource, /\.alert-color/);
assert.match(compactInterfaceSource, /\.blue-color/);
assert.match(pasteFixSource, /WayToolsRuntime\.run\("matrix-corrigir-colagem"/);
assert.match(pasteFixSource, /@version\s+3\.5/);
assert.match(pasteFixSource, /\.faketextbox\.pastable\[contenteditable="true"\]/);
assert.match(pasteFixSource, /function limparHTML\(/);
assert.match(pasteFixSource, /function clipboardTemImagem\(/);
assert.match(pasteFixSource, /event\.preventDefault\(\)/);
assert.match(pasteFixSource, /event\.stopImmediatePropagation\(\)/);
assert.doesNotMatch(
  pasteFixSource,
  /@match\s+https:\/\/erp\.internetway\.com\.br/,
  "O corretor de colagem solicitado deve executar somente no Matrix."
);
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
assert.ok(
  catalogContext.WAY_TOOLS_SCRIPTS
    .find((script) => script.id === "way-corretor-ortografico-pro")
    .matches
    .includes("https://ia-nocodb.internetway.com.br/*"),
  "O catálogo deve informar que o corretor funciona no ChatWoot."
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
assert.ok(matrixEntries[0].js.includes("scripts/matrix-corrigir-colagem.js"));
assert.ok(matrixEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
const chatwootEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://ia-nocodb.internetway.com.br/*")
);
assert.equal(chatwootEntries.length, 1, "O ChatWoot deve carregar apenas uma instância do runtime.");
assert.ok(chatwootEntries[0].js.includes("scripts/way-mensagens.js"));
assert.ok(chatwootEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
const erpEntries = manifest.content_scripts.filter((entry) =>
  entry.matches.includes("https://erp.internetway.com.br/*")
);
assert.equal(erpEntries.length, 1, "O ERP deve carregar apenas uma instância do runtime.");
assert.equal(erpEntries[0].all_frames, true, "O ERP precisa executar as ferramentas também nos quadros internos.");
assert.equal(erpEntries[0].match_about_blank, true, "Quadros internos criados pelo ERP também precisam receber as ferramentas.");
assert.ok(erpEntries[0].js.includes("scripts/way-erp-copiar-dados.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-interface-compacta.js"));
assert.ok(erpEntries[0].js.includes("scripts/way-corretor-ortografico-pro.js"));
assert.ok(!erpEntries[0].js.includes("scripts/matrix-corrigir-colagem.js"));
assert.ok(
  !manifest.content_scripts.some((entry) => entry.js.includes("scripts/way-matrix-theme.js")),
  "O tema deve permanecer incorporado ao módulo da Interface Compacta."
);

assert.match(runtimeSource, /registerMenuCommand\(scriptId, label, callback\)/);

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

const javascriptFiles = [
  "config/scripts.js",
  "config/default-messages.js",
  "config/spelling-dictionary.js",
  "content/runtime.js",
  "content/message-notification-policy.js",
  "content/spelling-engine.js",
  "background/service-worker.js",
  "popup/popup.js",
  "scripts/way-mensagens.js",
  "scripts/way-erp-copiar-dados.js",
  "scripts/matrix-corrigir-colagem.js",
  "scripts/way-interface-compacta.js",
  "scripts/way-corretor-ortografico-pro.js"
];

for (const relativePath of javascriptFiles) {
  execFileSync(process.execPath, ["--check", resolve(extensionRoot, relativePath)], {
    stdio: "pipe"
  });
}

console.log(`Way Tools validado: Manifest V${manifest.manifest_version}, ${javascriptFiles.length} arquivos JavaScript e ${new Set(referencedFiles).size} recursos conferidos.`);
