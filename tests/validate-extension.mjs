import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import vm from "node:vm";
import {
  loadNativeMessageCatalog,
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
assert.ok(
  chatwootRuntimeEntry.js.indexOf("config/default-messages.js") <
    chatwootRuntimeEntry.js.indexOf("content/message-catalog-manager.js") &&
    chatwootRuntimeEntry.js.indexOf("content/message-catalog-manager.js") <
      chatwootRuntimeEntry.js.indexOf("content/message-experience.js") &&
    chatwootRuntimeEntry.js.indexOf("content/message-experience.js") <
      chatwootRuntimeEntry.js.indexOf("scripts/way-mensagens.js"),
  "Os módulos de catálogo e experiência precisam carregar antes do ChatWoot."
);
assert.ok(
  chatwootRuntimeEntry.js.indexOf("content/instance-coordinator.js") <
    chatwootRuntimeEntry.js.indexOf("scripts/way-mensagens.js"),
  "A coordenação entre instalações precisa iniciar antes das notificações."
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
  ...manifest.content_scripts.flatMap((entry) => [...entry.js, ...(entry.css || [])])
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
const messageCatalogManagerSource = readFileSync(
  resolve(extensionRoot, "content/message-catalog-manager.js"),
  "utf8"
);
const messageExperienceSource = readFileSync(resolve(extensionRoot, "content/message-experience.js"), "utf8");
const backupManagerSource = readFileSync(resolve(extensionRoot, "content/backup-manager.js"), "utf8");
const scriptSource = readFileSync(resolve(extensionRoot, "scripts/way-mensagens.js"), "utf8");
const wayMessagesStyleSource = readFileSync(resolve(extensionRoot, "styles/way-mensagens.css"), "utf8");
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
const instanceCoordinatorSource = readFileSync(resolve(extensionRoot, "content/instance-coordinator.js"), "utf8");
const chatwootRealtimeBridgeSource = readFileSync(
  resolve(extensionRoot, "content/chatwoot-realtime-bridge.js"),
  "utf8"
);
const messageNotificationPolicySource = readFileSync(resolve(extensionRoot, "content/message-notification-policy.js"), "utf8");
const backgroundServiceWorkerSource = readFileSync(resolve(extensionRoot, "background/service-worker.js"), "utf8");
const popupSource = readFileSync(resolve(extensionRoot, "popup/popup.js"), "utf8");
const popupDiagnosticsSource = readFileSync(resolve(extensionRoot, "popup/diagnostics.js"), "utf8");
const popupHtmlSource = readFileSync(resolve(extensionRoot, "popup/popup.html"), "utf8");
const developerPreviewHtmlSource = readFileSync(
  resolve(extensionRoot, "developer/report-generator-preview.html"),
  "utf8"
);
const developerPreviewSource = readFileSync(
  resolve(extensionRoot, "developer/report-generator-preview.js"),
  "utf8"
);
const sacDraft = JSON.parse(readFileSync(resolve(extensionRoot, "data/mensagens-sac-rascunho.json"), "utf8"));
const sacReviewHtmlSource = readFileSync(resolve(extensionRoot, "developer/sac-catalog-review.html"), "utf8");
const sacReviewSource = readFileSync(resolve(extensionRoot, "developer/sac-catalog-review.js"), "utf8");
const privacyPolicySource = readFileSync(resolve(root, "docs/index.html"), "utf8");
const extensionPrivacyPolicySource = readFileSync(resolve(extensionRoot, "docs/index.html"), "utf8");
assert.equal(
  extensionPrivacyPolicySource,
  privacyPolicySource,
  "A página pública precisa estar sincronizada com a política principal da extensão."
);
assert.match(popupHtmlSource, /<img class="brand-mark" src="\.\.\/128\.png"/);
assert.match(popupHtmlSource, /src="\.\.\/content\/message-catalog-manager\.js"/);
assert.match(popupHtmlSource, /src="\.\.\/content\/backup-manager\.js"/);
assert.match(popupHtmlSource, /src="diagnostics\.js"/);
assert.doesNotMatch(popupHtmlSource, /<span class="brand-mark"[^>]*>W<\/span>/);
for (const tabName of ["home", "tools", "settings"]) {
  assert.match(popupHtmlSource, new RegExp(`data-tab-target="${tabName}"`));
  assert.match(popupHtmlSource, new RegExp(`data-tab-panel="${tabName}"`));
}
assert.match(popupHtmlSource, /id="compatible-scripts-list"/);
assert.match(popupHtmlSource, /id="active-profile-badge"/);
assert.match(popupHtmlSource, /id="diagnostics-center"/);
assert.match(popupHtmlSource, /href="\.\.\/docs\/index\.html"/);
assert.match(popupHtmlSource, />\s*Política de Privacidade\s*</);
assert.match(popupHtmlSource, /id="refresh-diagnostics"/);
assert.match(popupHtmlSource, /id="export-backup"/);
assert.match(popupHtmlSource, /id="backup-mode"/);
assert.match(popupHtmlSource, /id="undo-backup-import"/);
assert.match(popupSource, /function activateTab\(/);
assert.match(popupSource, /function renderCompatibleScripts\(/);
assert.match(popupSource, /function createScriptGroup\(/);
assert.match(popupSource, /label:\s*"ChatWoot"/);
assert.match(popupSource, /label:\s*"ERP Way"/);
assert.match(popupSource, /label:\s*"Matrix"/);
assert.match(popupHtmlSource, /id="developer-settings"[^>]*hidden/);
assert.match(popupHtmlSource, /id="test-report-generator"/);
assert.match(popupHtmlSource, /id="review-sac-catalog"/);
assert.match(popupHtmlSource, /id="disable-developer-mode"/);
assert.match(popupSource, /developerModeClickTarget\s*=\s*7/);
assert.match(popupSource, /wayTools\.developerMode\.enabled/);
assert.match(popupSource, /chrome\.runtime\.getURL\("developer\/report-generator-preview\.html"\)/);
assert.match(popupSource, /chrome\.runtime\.getURL\("developer\/sac-catalog-review\.html"\)/);
assert.match(sacReviewHtmlSource, /id="first-package-only"/);
for (const elementId of [
  "save-draft",
  "import-json",
  "copy-json",
  "download-draft",
  "profile-version",
  "category-list",
  "add-category",
  "message-list",
  "add-message",
  "category-dialog",
  "message-dialog",
  "message-time-variant",
  "message-visit-template",
  "editor-tags",
  "catalog-audit"
]) {
  assert.match(sacReviewHtmlSource, new RegExp(`id="${elementId}"`));
}
assert.match(sacReviewSource, /mensagens-sac-rascunho\.json/);
assert.match(sacReviewSource, /data\/mensagens-nativas\.json/);
assert.match(sacReviewSource, /wayTools\.developer\.messageCatalogDraft\.v1/);
assert.match(sacReviewSource, /chrome\.storage\.local\.set/);
assert.match(sacReviewSource, /function mergeLegacySacDraft\(/);
assert.match(sacReviewSource, /function auditCatalog\(/);
assert.match(sacReviewSource, /function openCategoryEditor\(/);
assert.match(sacReviewSource, /function openMessageEditor\(/);
assert.match(sacReviewSource, /function saveCategory\(/);
assert.match(sacReviewSource, /function saveMessage\(/);
assert.match(sacReviewSource, /function importJson\(/);
assert.match(sacReviewSource, /function exportJson\(/);
assert.match(sacReviewSource, /navigator\.clipboard\.writeText/);
assert.match(sacReviewSource, /new Blob\(/);
assert.match(sacReviewSource, /variacaoHorario/);
assert.match(sacReviewSource, /templateVisita/);
assert.match(developerPreviewHtmlSource, /class="ql-editor dx-htmleditor-content" contenteditable="true"/);
assert.match(developerPreviewHtmlSource, /src="\.\.\/scripts\/way-erp-gerador-relato\.js"/);
for (const elementId of [
  "stage-list",
  "categories-list",
  "stage-preview-content",
  "add-category",
  "export-json",
  "copy-json",
  "reset-catalog",
  "catalog-audit",
  "catalog-editor-dialog",
  "editor-relations-field",
  "relation-products-options",
  "relation-contacts-options",
  "relation-requests-options",
  "relation-issues-options",
  "editor-order",
  "editor-priority-enabled",
  "editor-priority-order"
]) {
  assert.match(developerPreviewHtmlSource, new RegExp(`id="${elementId}"`));
}
assert.match(developerPreviewSource, /globalThis\.WayToolsRuntime\s*=\s*\{/);
assert.match(developerPreviewSource, /scriptId\s*===\s*"way-erp-gerador-relato"/);
assert.match(developerPreviewSource, /wayTools\.developer\.reportGeneratorCatalog\.v1/);
assert.match(developerPreviewSource, /function renderStageList\(/);
assert.match(developerPreviewSource, /function renderCategories\(/);
assert.match(developerPreviewSource, /function renderPreview\(/);
assert.match(developerPreviewSource, /function auditCatalog\(/);
assert.match(developerPreviewSource, /function saveEditor\(/);
assert.match(developerPreviewSource, /function renderRelations\(/);
assert.match(developerPreviewSource, /function relationCapabilities\(/);
assert.match(developerPreviewSource, /function orderedOptionEntries\(/);
assert.match(developerPreviewSource, /function mergeCatalogWithBaseline\(/);
assert.match(developerPreviewSource, /baselineProducts\.includes\("way_vision"\)/);
assert.match(developerPreviewSource, /move-option-up/);
assert.match(developerPreviewSource, /move-option-down/);
assert.match(developerPreviewSource, /WAY_TOOLS_REPORT_GENERATOR_DEVELOPER_OVERRIDE/);
assert.match(developerPreviewSource, /searchParams\.set\("simulate", "1"\)/);
assert.match(developerPreviewSource, /function exportJson\(/);
assert.match(developerPreviewSource, /function copyJson\(/);
assert.match(developerPreviewSource, /localStorage\.setItem\(STORAGE_KEY/);
assert.match(developerPreviewSource, /new Blob\(/);
assert.match(developerPreviewSource, /referencia verificação inexistente/);
assert.match(developerPreviewSource, /referencia solicitação inexistente/);
assert.match(developerPreviewSource, /referencia problema inexistente/);
assert.match(privacyPolicySource, /<code>notifications<\/code>/);
assert.match(privacyPolicySource, /<code>alarms<\/code>/);
assert.match(privacyPolicySource, /chrome\.storage\.session/);
assert.match(privacyPolicySource, /localStorage/);
assert.match(privacyPolicySource, /Última atualização: 5 de outubro de 2026/);
assert.match(privacyPolicySource, /chrome\.storage\.sync/);
assert.match(privacyPolicySource, /somente o identificador do perfil/);
assert.match(privacyPolicySource, /https:\/\/wayinternet\.matrixdobrasil\.ai\/\*/);
assert.match(privacyPolicySource, /perfis N2 e SAC/);
assert.match(privacyPolicySource, /Gerador de Relato/);
assert.match(privacyPolicySource, /mensagens oficiais editadas ou excluídas/);
assert.match(privacyPolicySource, /favoritos, atalhos usados/);
assert.match(privacyPolicySource, /até 20 versões anteriores do catálogo/);
assert.match(privacyPolicySource, /Backup completo/);
assert.match(privacyPolicySource, /arquivo JSON/);
assert.match(privacyPolicySource, /Dados temporários do/);
assert.match(privacyPolicySource, /não aceita chaves que/);
assert.match(privacyPolicySource, /Central de Notificações ou na tela bloqueada/);
assert.doesNotMatch(privacyPolicySource, /devem ser substituídos pelas informações reais/);
assert.match(catalogSource, /id:\s*"way-mensagens"/);
assert.match(catalogSource, /id:\s*"way-mensagens"[\s\S]*?version:\s*"3\.10"/);
assert.match(catalogSource, /id:\s*"way-erp-copiar-dados"/);
assert.match(catalogSource, /version:\s*"1\.6"/);
assert.match(catalogSource, /id:\s*"way-erp-gerador-relato"/);
assert.match(catalogSource, /name:\s*"ERP — Gerador de Relato"/);
assert.match(catalogSource, /id:\s*"way-erp-gerador-relato"[\s\S]*?version:\s*"1\.13"/);
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
  true,
  "Matrix — Tema Claro/Escuro precisa iniciar ativado por padrão."
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
assert.deepEqual(chatwootRuntimeEntry.css, ["styles/way-mensagens.css"]);
assert.match(scriptSource, /--way-autocomplete-max-height/);
assert.match(wayMessagesStyleSource, /var\(--way-autocomplete-max-height, 320px\)/);
assert.match(wayMessagesStyleSource, /\.way-msg-modal/);
assert.match(scriptSource, /const GM_getValue = storage\.getValue/);
assert.match(scriptSource, /const GM_setValue = storage\.setValue/);
assert.match(scriptSource, /\[Way Mensagens\] v3\.10 ativa\./);
assert.match(scriptSource, /Perfil ativo:/);
assert.match(scriptSource, /function obterExperienciaMensagens\(/);
assert.match(scriptSource, /function abrirPreviewMensagemAutocomplete\(/);
assert.match(scriptSource, /function abrirSeletorGeneroMensagem\(/);
assert.match(scriptSource, /data-way-genero/);
assert.match(scriptSource, /resolverVariacaoGenero/);
assert.match(wayMessagesStyleSource, /\.way-gender-options/);
assert.match(scriptSource, /function abrirOrganizadorCategorias\(/);
assert.match(scriptSource, /way-msg-undo/);
assert.match(scriptSource, /way-msg-duplicate/);
assert.match(scriptSource, /data-way-favorite/);
assert.match(scriptSource, /name="sinonimos"/);
assert.match(scriptSource, /name="palavrasChave"/);
assert.match(scriptSource, /wayTools:getDiagnostics/);
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
assert.match(scriptSource, /somenteUltimaMensagemAgente:\s*true/);
assert.match(scriptSource, /alertaVisualSomenteUltimaMensagemAgente:\s*false/);
assert.match(scriptSource, /padrao\.notificarAmarelo/);
assert.match(scriptSource, /padrao\.notificarLaranja/);
assert.match(scriptSource, /padrao\.notificarVermelho/);
assert.match(scriptSource, /name="notificarAmarelo"/);
assert.match(scriptSource, /name="notificarLaranja"/);
assert.match(scriptSource, /name="notificarVermelho"/);
assert.match(scriptSource, /name="somenteUltimaMensagemAgente"/);
assert.match(scriptSource, /Notificar somente após mensagem do agente/);
assert.match(scriptSource, /name="alertaVisualSomenteUltimaMensagemAgente"/);
assert.match(scriptSource, /Alertas visuais somente após mensagem do agente/);
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
assert.match(scriptSource, /wayTools:reconcileChatwootInactivity/);
assert.match(scriptSource, /function erroIndicaContextoInvalidado\(/);
assert.match(scriptSource, /function invalidarContextoExtensao\(/);
assert.match(scriptSource, /O Way Tools foi atualizado\. Recarregue esta página/);
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
assert.equal(bridgeRealtimeMessage?.message.payload.lastMessageFromAgent, false);
assert.equal(
  bridgeRealtimeMessage?.message.payload.url,
  "https://ia-nocodb.internetway.com.br/app/accounts/2/conversations/4504"
);

bridgeSocket.emit("message", JSON.stringify({
  identifier: JSON.stringify({
    channel: "RoomChannel",
    account_id: 2,
    user_id: 78
  }),
  message: {
    event: "message.created",
    data: {
      id: 119783,
      account_id: 2,
      conversation_id: 4504,
      message_type: 1,
      sender_type: "User",
      private: false,
      content: "Orientação enviada pelo atendente",
      created_at: 1_790_879_170,
      conversation: {
        assignee_id: 78,
        unread_count: 0,
        last_activity_at: 1_790_879_170
      },
      sender: {
        id: 78,
        name: "Atendente Teste",
        type: "user"
      }
    }
  }
}));
const bridgeOutgoingMessage = [...bridgePostedMessages].reverse().find(
  ({ message }) =>
    message.type === "event" &&
    message.payload?.messageId === 119783
);
assert.equal(bridgeOutgoingMessage?.message.payload.lastMessageFromAgent, true);

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

const legacyBridgeMessages = [];
const legacyBridgeAttributes = new Map();
const legacyBridgeContext = {
  document: {
    documentElement: {
      setAttribute: (name, value) => legacyBridgeAttributes.set(name, value)
    }
  },
  window: {
    WebSocket: function WayToolsWebSocket() {},
    postMessage: (message, targetOrigin) => {
      legacyBridgeMessages.push({ message, targetOrigin });
    }
  }
};
vm.createContext(legacyBridgeContext);
vm.runInContext(chatwootRealtimeBridgeSource, legacyBridgeContext);
assert.ok(
  legacyBridgeMessages.some(({ message }) => message.type === "legacy-duplicate"),
  "A versão nova precisa reconhecer uma ponte legada já instalada."
);
assert.equal(
  legacyBridgeAttributes.get("data-way-tools-legacy-duplicate"),
  "true",
  "O diagnóstico legado precisa sobreviver quando o aviso ocorrer antes do listener isolado."
);
assert.equal(
  legacyBridgeContext.window.WebSocket.name,
  "WayToolsWebSocket",
  "A ponte nova não deve empilhar outro interceptador sobre a versão legada."
);
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
assert.match(backgroundServiceWorkerSource, /wayTools:setChatwootNotificationOwner/);
assert.match(backgroundServiceWorkerSource, /async function clearNotificationArtifactsForThisInstallation\(/);
assert.match(backgroundServiceWorkerSource, /reason:\s*"duplicate-installation"/);
assert.match(instanceCoordinatorSource, /nmoechoifhbibhbekfdphmfipeamjged/);
assert.match(instanceCoordinatorSource, /data-way-tools-extension-instance/);
assert.match(scriptSource, /Outra instalação do Way Tools foi detectada/);
assert.match(scriptSource, /function iniciarCoordenacaoNotificacoes\(/);
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

const instanceCoordinatorContext = {
  chrome: {
    runtime: {
      id: "devwaytoolsaaaaaaaaaaaaaaaaaaaa",
      getManifest: () => ({ version: "0.7.0" })
    }
  }
};
vm.createContext(instanceCoordinatorContext);
vm.runInContext(instanceCoordinatorSource, instanceCoordinatorContext);
const instanceCoordinator = instanceCoordinatorContext.WayToolsInstanceCoordinator;
assert.equal(
  instanceCoordinator.chooseOwner([
    { extensionId: "devwaytoolsaaaaaaaaaaaaaaaaaaaa", version: "9.9.9" },
    { extensionId: "nmoechoifhbibhbekfdphmfipeamjged", version: "0.6.2" }
  ]).extensionId,
  "nmoechoifhbibhbekfdphmfipeamjged",
  "A instalação oficial deve ter prioridade mesmo quando a cópia manual é mais nova."
);
assert.equal(
  instanceCoordinator.chooseOwner([
    { extensionId: "devwaytoolsaaaaaaaaaaaaaaaaaaaa", version: "0.7.0" },
    { extensionId: "otherwaytoolsbbbbbbbbbbbbbbbbbb", version: "0.7.1" }
  ]).version,
  "0.7.1",
  "Sem a instalação oficial, a versão mais recente deve assumir as notificações."
);
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
      clear: async (name) => {
        const index = scheduledNotificationAlarms.findIndex((alarm) => alarm.name === name);

        if (index < 0) {
          return false;
        }

        scheduledNotificationAlarms.splice(index, 1);
        return true;
      },
      create: async (name, options) => {
        scheduledNotificationAlarms.push({ name, options });
      },
      getAll: async () => scheduledNotificationAlarms.map((alarm) => ({ ...alarm })),
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
    lastActivityAt: Date.now() - 121_000,
    lastMessageFromAgent: true
  },
  levels: {
    yellow: { minutes: 2, enabled: true },
    orange: { minutes: 5, enabled: true },
    red: { minutes: 10, enabled: true }
  },
  requireAgentLastMessage: true,
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

const customerLastMessageRequest = {
  ...inactivityRequest,
  conversation: {
    ...inactivityRequest.conversation,
    conversationId: 2470,
    lastMessageFromAgent: false
  }
};
const customerLastMessageResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0](customerLastMessageRequest, trustedSender, resolvePromise);
});
assert.equal(customerLastMessageResponse.ok, true);
assert.equal(customerLastMessageResponse.scheduled, false);
assert.equal(customerLastMessageResponse.reason, "last-message-not-from-agent");
assert.equal(
  sessionStorage["wayTools.chatwootInactivityState.2.2470"],
  undefined,
  "A última mensagem do cliente não pode manter alertas de inatividade agendados."
);

const staleInactivityRequest = {
  ...inactivityRequest,
  conversation: {
    ...inactivityRequest.conversation,
    conversationId: 2471
  }
};
await new Promise((resolvePromise) => {
  backgroundMessageListeners[0](staleInactivityRequest, trustedSender, resolvePromise);
});
const inactivityReconcileResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    type: "wayTools:reconcileChatwootInactivity",
    accountId: 2,
    conversationIds: [2468]
  }, trustedSender, resolvePromise);
});
assert.equal(inactivityReconcileResponse.ok, true);
assert.equal(inactivityReconcileResponse.removed, 1);
assert.ok(
  sessionStorage["wayTools.chatwootInactivityState.2.2468"],
  "A reconciliação deve preservar conversas que continuam atribuídas."
);
assert.equal(
  sessionStorage["wayTools.chatwootInactivityState.2.2471"],
  undefined,
  "A reconciliação deve remover alertas de conversas que não estão mais atribuídas."
);

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

notificationTabExists = true;
const duplicateGuardNotification = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    conversationKey: "conversation:duplicate-guard",
    fingerprint: `${notificationRequest.fingerprint}|duplicate-guard`
  }, trustedSender, resolvePromise);
});
await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...inactivityRequest,
    conversation: {
      ...inactivityRequest.conversation,
      conversationId: 2480
    }
  }, trustedSender, resolvePromise);
});
assert.ok(activeNotifications[duplicateGuardNotification.notificationId]);
assert.ok(sessionStorage["wayTools.chatwootInactivityState.2.2480"]);

const duplicateOwnerDisabledResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    type: "wayTools:setChatwootNotificationOwner",
    enabled: false
  }, trustedSender, resolvePromise);
});
assert.equal(duplicateOwnerDisabledResponse.ok, true);
assert.equal(duplicateOwnerDisabledResponse.enabled, false);
assert.equal(sessionStorage["wayTools.chatwootNotificationOwner.enabled"], false);
assert.equal(activeNotifications[duplicateGuardNotification.notificationId], undefined);
assert.equal(sessionStorage["wayTools.chatwootInactivityState.2.2480"], undefined);

const suppressedDuplicateNotification = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    ...notificationRequest,
    conversationKey: "conversation:suppressed-duplicate",
    fingerprint: `${notificationRequest.fingerprint}|suppressed-duplicate`
  }, trustedSender, resolvePromise);
});
assert.equal(suppressedDuplicateNotification.suppressed, true);
assert.equal(suppressedDuplicateNotification.reason, "duplicate-installation");

const duplicateOwnerEnabledResponse = await new Promise((resolvePromise) => {
  backgroundMessageListeners[0]({
    type: "wayTools:setChatwootNotificationOwner",
    enabled: true
  }, trustedSender, resolvePromise);
});
assert.equal(duplicateOwnerEnabledResponse.ok, true);
assert.equal(duplicateOwnerEnabledResponse.enabled, true);
assert.doesNotMatch(backgroundServiceWorkerSource, /IA_NOCO_DB_ORIGIN/);
assert.match(backgroundServiceWorkerSource, /function isAllowedDestination\(/);
assert.match(backgroundServiceWorkerSource, /function migrateLegacyMessageCatalog\(/);
assert.match(backgroundServiceWorkerSource, /wayTools\.shared\.messages\.catalog\.n2\.v1/);
assert.match(backgroundServiceWorkerSource, /wayTools\.shared\.messages\.catalog\.v1/);
assert.match(scriptSource, /function obterMensagensNativas\(/);
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
const nativeMessageCatalog = loadNativeMessageCatalog();
assert.equal(nativeMessageCatalog.schemaVersion, 2, "O catálogo nativo precisa usar o schema 2.");
assert.equal(nativeMessageCatalog.profiles.n2.version, 4);
assert.equal(nativeMessageCatalog.profiles.sac.version, 3);
assert.equal(nativeMessageCatalog.profiles.sac.messages.length, 2, "O SAC deve conter os comandos oficiais já aprovados.");
assert.ok(
  nativeMessageCatalog.categories.some((category) =>
    category.id === "financeiro" && category.setores.includes("sac")
  ),
  "As categorias do SAC precisam vir da fonte central."
);
assert.ok(
  nativeMessageCatalog.categories.some((category) =>
    category.id === "ajustes" && category.setores.includes("n2") && !category.setores.includes("sac")
  ),
  "As categorias devem poder ser limitadas por setor."
);
const plannedSacCommands = sacDraft.categories.flatMap((category) => category.commands || []);
assert.equal(plannedSacCommands.length, 42, "O estúdio precisa carregar os 42 comandos planejados para o SAC.");
assert.equal(
  plannedSacCommands.filter((command) => command.firstPackage === true).length,
  12,
  "O primeiro pacote SAC precisa manter suas 12 mensagens prioritárias."
);
assert.equal(
  new Set(plannedSacCommands.map((command) => command.command)).size,
  plannedSacCommands.length,
  "A proposta SAC não pode conter comandos duplicados."
);
for (const command of plannedSacCommands) {
  assert.ok(
    nativeMessageCatalog.categories.some((category) =>
      category.id === command.targetCategory && category.setores.includes("sac")
    ),
    `O comando SAC !${command.command} precisa apontar para uma categoria central disponível.`
  );
}
assert.equal(nativeMessages.length, 18, "O catálogo N2 precisa conter as 16 mensagens do backup e os dois novos comandos oficiais.");
const n2ImageMessage = nativeMessages.find((message) => message.comando === "enviarimagem");
const sacImageMessage = nativeMessageCatalog.profiles.sac.messages.find((message) => message.comando === "enviarimagem");
for (const imageMessage of [n2ImageMessage, sacImageMessage]) {
  assert.ok(imageMessage, "N2 e SAC precisam oferecer o comando !enviarimagem.");
  assert.equal(imageMessage.categoria, "orientacoes");
  assert.equal(imageMessage.tipo, "imagem");
  assert.equal(imageMessage.arquivoImagem, "assets/mensagens/enviarimagem.png");
}
const expectedOccurrenceText = "Identificamos uma ocorrência na região e já temos uma equipe técnica atuando para realizar a correção.\n\nA previsão é que a situação seja normalizada em até 4 horas.\n\nAgradecemos pela compreensão durante esse período.";
for (const occurrenceMessage of [
  nativeMessages.find((message) => message.comando === "ocorrencia"),
  nativeMessageCatalog.profiles.sac.messages.find((message) => message.comando === "ocorrencia")
]) {
  assert.ok(occurrenceMessage, "N2 e SAC precisam oferecer o comando !ocorrencia.");
  assert.equal(occurrenceMessage.categoria, "orientacoes");
  assert.equal(occurrenceMessage.tipo, "texto");
  assert.equal(occurrenceMessage.mensagem, expectedOccurrenceText);
}
const thanksMessage = nativeMessages.find((message) => message.comando === "agradecimento");
assert.ok(thanksMessage, "O catálogo N2 precisa manter o comando !agradecimento.");
assert.equal(thanksMessage.variacaoHorario, true);
for (const period of ["manha", "tarde", "noite"]) {
  assert.match(
    thanksMessage[period],
    /\{\{genero:ajudá-lo\|ajudá-la\}\}/,
    `A versão de ${period} do !agradecimento precisa oferecer masculino e feminino.`
  );
}
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
assert.ok(Object.isFrozen(nativeContext.WAY_TOOLS_MESSAGE_CATALOG), "A definição completa dos catálogos precisa ser imutável.");
assert.deepEqual(
  JSON.parse(JSON.stringify(nativeContext.WAY_TOOLS_NATIVE_CATALOGS.sac.messages)),
  nativeMessageCatalog.profiles.sac.messages,
  "O módulo gerado precisa expor o perfil SAC separadamente."
);

const messageCatalogContext = {};
vm.runInNewContext(nativeMessagesSource, messageCatalogContext);
vm.runInNewContext(messageCatalogManagerSource, messageCatalogContext);
vm.runInNewContext(messageExperienceSource, messageCatalogContext);
const messageCatalogManager = messageCatalogContext.WayToolsMessageCatalogs;
assert.ok(messageCatalogManager, "O gerenciador compartilhado de catálogos precisa ser carregado.");
for (const method of [
  "searchMessages",
  "experienceWithStorage",
  "toggleFavoriteWithStorage",
  "recordUseWithStorage",
  "recordHistoryWithStorage",
  "consumeUndoWithStorage",
  "moveCategoryWithStorage",
  "moveMessageWithStorage",
  "unresolvedTags"
]) {
  assert.equal(typeof messageCatalogManager[method], "function", `O gerenciador precisa expor ${method}.`);
}
assert.deepEqual(
  JSON.parse(JSON.stringify(Object.keys(messageCatalogManager.categoryMap("n2")))),
  nativeMessageCatalog.categories
    .filter((category) => category.setores.includes("n2"))
    .sort((left, right) => left.ordem - right.ordem)
    .map((category) => category.id)
);
assert.ok(messageCatalogManager.categoryMap("sac").financeiro);
assert.equal(messageCatalogManager.categoryMap("sac").ajustes, undefined);

const migratedCatalog = JSON.parse(JSON.stringify(nativeMessages));
migratedCatalog[0].mensagem = "Mensagem personalizada pelo usuário.";
const removedNativeId = migratedCatalog[1].id;
migratedCatalog.splice(1, 1);
migratedCatalog.push({
  id: "custom-sac-safe",
  comando: "personalizado",
  categoria: "abertura",
  tipo: "texto",
  variacaoHorario: false,
  mensagem: "Mensagem criada pelo usuário.",
  manha: "",
  tarde: "",
  noite: "",
  templateVisita: ""
});
const migratedResult = messageCatalogManager.resolve("n2", migratedCatalog, null);
assert.equal(migratedResult.messages[0].mensagem, "Mensagem personalizada pelo usuário.");
assert.ok(!migratedResult.messages.some((message) => message.id === removedNativeId));
assert.ok(migratedResult.messages.some((message) => message.id === "custom-sac-safe"));
assert.ok(migratedResult.state.deletedNativeIds.includes(removedNativeId));

const savedState = messageCatalogManager.deriveSavedState("n2", migratedCatalog, migratedResult.state);
const initialSacState = messageCatalogManager.resolve("sac", [], null).state;
const futureCatalog = JSON.parse(JSON.stringify(nativeMessageCatalog));
futureCatalog.profiles.n2.version = 2;
futureCatalog.profiles.n2.messages[0].mensagem = "Nova redação oficial que não deve substituir a personalização.";
futureCatalog.profiles.n2.messages.push({
  id: "native-future-n2",
  comando: "novidadeoficial",
  categoria: "abertura",
  tipo: "texto",
  variacaoHorario: false,
  mensagem: "Nova mensagem oficial.",
  manha: "",
  tarde: "",
  noite: "",
  templateVisita: ""
});
futureCatalog.profiles.sac.version = 2;
futureCatalog.profiles.sac.messages.push({
  id: "native-first-sac",
  comando: "aberturasac",
  categoria: "abertura",
  tipo: "texto",
  variacaoHorario: false,
  mensagem: "Primeira mensagem oficial do SAC.",
  manha: "",
  tarde: "",
  noite: "",
  templateVisita: ""
});
const futureMessageCatalogContext = {
  WAY_TOOLS_MESSAGE_CATALOG: futureCatalog
};
vm.runInNewContext(messageCatalogManagerSource, futureMessageCatalogContext);
const futureManager = futureMessageCatalogContext.WayToolsMessageCatalogs;
const futureN2Messages = futureManager.materialize("n2", savedState);
assert.equal(futureN2Messages.find((message) => message.id === nativeMessages[0].id).mensagem, "Mensagem personalizada pelo usuário.");
assert.ok(!futureN2Messages.some((message) => message.id === removedNativeId));
assert.ok(futureN2Messages.some((message) => message.id === "custom-sac-safe"));
assert.ok(futureN2Messages.some((message) => message.id === "native-future-n2"));
assert.ok(
  futureManager.materialize("sac", initialSacState)
    .some((message) => message.id === "native-first-sac"),
  "Uma atualização precisa acrescentar novas mensagens oficiais ao SAC já inicializado."
);
const sacCustomCollisionState = messageCatalogManager.deriveSavedState("sac", [{
  id: "native-first-sac",
  comando: "atalhopessoal",
  categoria: "abertura",
  tipo: "texto",
  variacaoHorario: false,
  mensagem: "Conteúdo pessoal anterior ao pacote oficial.",
  manha: "",
  tarde: "",
  noite: "",
  templateVisita: ""
}], null);
assert.equal(
  futureManager.materialize("sac", sacCustomCollisionState)
    .find((message) => message.id === "native-first-sac")?.comando,
  "atalhopessoal",
  "Uma mensagem pessoal precisa vencer até mesmo uma futura colisão de ID nativo."
);

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
assert.match(matrixMessagesSource, /function positionAutocomplete\(/);
assert.match(matrixMessagesSource, /window\.visualViewport/);
assert.match(matrixMessagesSource, /availableAbove >= naturalHeight \|\| availableAbove > availableBelow/);
assert.match(matrixMessagesSource, /viewportBottom - margin - height/);
assert.match(matrixMessagesSource, /MESSAGE_CATALOG_MANAGER = globalThis\.WayToolsMessageCatalogs/);
assert.match(matrixMessagesSource, /function categoryLabelsForSector\(/);
assert.match(matrixMessagesSource, /typeof definition === "string"/);
assert.match(matrixMessagesSource, /normalizeText\(definition\?\.label\) \|\| id/);
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
assert.match(matrixMessagesSource, /function openMessagePreview\(/);
assert.match(matrixMessagesSource, /function openGenderSelector\(/);
assert.match(matrixMessagesSource, /data-way-gender/);
assert.match(matrixMessagesSource, /resolveGenderVariant/);
assert.match(matrixMessagesSource, /Perfil ativo:/);
assert.match(matrixMessagesSource, /data-way-favorite/);
assert.match(matrixMessagesSource, /data-way-duplicate/);
assert.match(matrixMessagesSource, /data-way-undo/);
assert.match(matrixMessagesSource, /data-way-order-categories/);
assert.match(matrixMessagesSource, /name="sinonimos"/);
assert.match(matrixMessagesSource, /name="palavrasChave"/);
assert.match(matrixMessagesSource, /Exportar JSON/);
assert.match(matrixMessagesSource, /Importar JSON/);
assert.doesNotMatch(matrixMessagesSource, /ia-nocodb|ProseMirror|conversation-panel/i);
assert.match(scriptSource, /const ENTER_COMANDO_BLOQUEADO\s*=\s*new WeakMap\(\)/);
assert.match(scriptSource, /function bloquearContinuacaoEnterComando\(/);
assert.match(scriptSource, /event\.stopImmediatePropagation\(\)/);
assert.match(scriptSource, /inserir sem enviar/);
assert.match(scriptSource, /function posicionarAutocomplete\(/);
assert.match(scriptSource, /window\.visualViewport/);
assert.match(scriptSource, /espacoAcima >= alturaNatural \|\|/);
assert.match(scriptSource, /viewportBottom - margem - altura/);
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
assert.match(popupHtmlSource, /id="sector-onboarding"/);
assert.match(popupHtmlSource, /id="confirm-initial-sector"/);
assert.match(popupHtmlSource, /id="message-sector"/);
assert.match(popupHtmlSource, /config\/default-messages\.js/);
assert.match(popupSource, /function renderDiagnostics\(/);
assert.match(popupDiagnosticsSource, /wayTools:getDiagnostics/);
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
assert.match(popupSource, /wayTools\.shared\.messages\.sector\.v1/);
assert.match(popupSource, /wayTools\.preferences\.messageSector\.v1/);
assert.match(popupSource, /function validMessageSector\(/);
assert.match(popupSource, /function persistMessageSectorPreference\(/);
assert.match(popupSource, /function loadPersistedMessageSector\(/);
assert.match(popupSource, /chrome\.storage\.sync\.get\(messageSectorPreferenceStorageKey\)/);
assert.match(popupSource, /chrome\.storage\.sync\.set/);
assert.match(popupSource, /const selectedSector = await loadPersistedMessageSector\(\)/);
assert.match(
  popupSource,
  /\[messageSectorStorageKey\]: normalizedSector,[\s\S]*\[messageSectorPreferenceStorageKey\]: normalizedSector/,
  "A seleção de perfil precisa atualizar a chave usada pelos scripts e a preferência resiliente."
);
assert.match(popupSource, /wayTools\.shared\.messages\.catalog\.n2\.v1/);
assert.match(popupSource, /wayTools\.shared\.messages\.catalog\.sac\.v1/);
assert.match(popupSource, /wayTools\.data\.way-mensagens\.way-mensagens-personalizadas-v1/);
assert.match(popupSource, /wayTools\.data\.matrix-mensagens\.way-matrix-mensagens-personalizadas-v1/);
assert.match(popupSource, /function ensureMessageCatalogProfiles\(/);
assert.match(popupSource, /updates\[messageCatalogStorageKeys\.sac\]\s*=\s*cloneNativeMessages\("sac"\)/);
assert.match(popupSource, /WayToolsMessageCatalogs\.ensureWithChromeStorage\("n2"\)/);
assert.match(popupSource, /WayToolsMessageCatalogs\.ensureWithChromeStorage\("sac"\)/);
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
assert.match(erpReportGeneratorSource, /let PRODUCTS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /let CHECKS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /let ACTIONS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /let VISIT_REASONS = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /const NO_INTERACTION_CONTACT = "Chat sem interação"/);
assert.match(erpReportGeneratorSource, /value:\s*"",\s*label:\s*"Sem interação"/);
assert.match(erpReportGeneratorSource, /selectOptions\(NO_INTERACTION_OPTIONS\.attempts, ""\)/);
assert.match(erpReportGeneratorSource, /\.map\(normalizeText\)\.filter\(Boolean\)/);
assert.match(erpReportGeneratorSource, /let CHECK_RECOMMENDATION_RULES = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /function recommendedCheckIds\(/);
assert.match(erpReportGeneratorSource, /const SLOWNESS_ISSUE = "Lentidão"/);
assert.match(erpReportGeneratorSource, /name="slowness_connections" value="Wi-Fi" data-slowness-connection="wifi"/);
assert.match(erpReportGeneratorSource, /name="slowness_connections" value="Cabo de rede" data-slowness-connection="cable"/);
assert.match(erpReportGeneratorSource, /name="wifi_band"/);
for (const wifiBand of ["2,4 GHz", "5 GHz", "Ambas as frequências"]) {
  assert.match(erpReportGeneratorSource, new RegExp(wifiBand.replace(",", "\\,")));
}
for (const checkId of ["connection_type", "wifi_connected_band", "wifi_signal", "ethernet_link"]) {
  assert.match(erpReportGeneratorSource, new RegExp(`id: "${checkId}"`));
}
assert.match(erpReportGeneratorSource, /connectionIds\.has\("wifi"\)/);
assert.match(erpReportGeneratorSource, /connectionIds\.has\("cable"\)/);
assert.match(erpReportGeneratorSource, /Detalhes da lentidão:/);
assert.match(erpReportGeneratorSource, /\["ativo", "Será realizado contato ativo com o cliente", \["\*"\]\]/);
assert.match(erpReportGeneratorSource, /const DRAFT_STORAGE_PREFIX = "way-tools:erp-report-draft:v1:"/);
assert.match(erpReportGeneratorSource, /function serializeReportDraft\(/);
assert.match(erpReportGeneratorSource, /function saveReportDraft\(/);
assert.match(erpReportGeneratorSource, /function loadReportDraft\(/);
assert.match(erpReportGeneratorSource, /function restoreReportDraft\(/);
assert.match(erpReportGeneratorSource, /sessionStorage\.setItem\(storageKey/);
assert.match(erpReportGeneratorSource, /sessionStorage\.removeItem\(storageKey\)/);
assert.match(erpReportGeneratorSource, /data-reset>Resetar formulário/);
assert.match(erpReportGeneratorSource, /Rascunho restaurado/);
assert.match(erpReportGeneratorSource, /removeReportDraft\(draftStorageKey\);\s*root\.remove\(\)/);
assert.match(erpReportGeneratorSource, /function buildDeveloperCatalog\(/);
assert.match(erpReportGeneratorSource, /generatorVersion:\s*"1\.13"/);
for (const stageId of ["attendance", "problem", "checks", "actions", "finalization", "preview"]) {
  assert.match(erpReportGeneratorSource, new RegExp(`id: "${stageId}"`));
}
assert.match(erpReportGeneratorSource, /id:\s*"recommendations"/);
assert.match(erpReportGeneratorSource, /WayToolsReportGeneratorDeveloper/);
assert.match(erpReportGeneratorSource, /waytools:report-generator-developer-ready/);
assert.match(erpReportGeneratorSource, /location\.protocol !== "chrome-extension:"/);
assert.match(erpReportGeneratorSource, /Para o problema de lentidão, informe se ele ocorre no Wi-Fi, no cabo ou em ambos/);

function evaluateReportGeneratorCatalog(protocol, override = undefined) {
  const context = {
    console: { info() {}, warn() {}, error() {} },
    location: { protocol, pathname: "/developer/report-generator-preview.html" },
    document: {
      documentElement: { appendChild() {} },
      getElementById() { return null; },
      createElement() { return {}; },
      querySelectorAll() { return []; },
      addEventListener() {},
      dispatchEvent() {}
    },
    MutationObserver: class {
      observe() {}
    },
    CustomEvent: class {
      constructor(type) { this.type = type; }
    },
    WAY_TOOLS_REPORT_GENERATOR_DEVELOPER_OVERRIDE: override,
    WayToolsRuntime: {
      run(_scriptId, start) { start(); },
      registerMenuCommand() { return "report-generator-test"; }
    }
  };
  vm.runInNewContext(erpReportGeneratorSource, context);
  return context;
}

const reportDeveloperContext = evaluateReportGeneratorCatalog("chrome-extension:");
assert.ok(reportDeveloperContext.WayToolsReportGeneratorDeveloper, "O catálogo interno precisa ser exposto na página de desenvolvimento.");
const reportDeveloperCatalog = JSON.parse(JSON.stringify(
  reportDeveloperContext.WayToolsReportGeneratorDeveloper.getCatalog()
));
assert.equal(reportDeveloperCatalog.generatorVersion, "1.13");
assert.equal(reportDeveloperCatalog.schemaVersion, 3);
assert.deepEqual(
  reportDeveloperCatalog.stages.map((stage) => stage.id),
  ["attendance", "problem", "checks", "actions", "finalization", "preview"]
);
assert.ok(reportDeveloperCatalog.stages.every((stage) =>
  stage.categories.length > 0 && stage.categories.every((category) => Array.isArray(category.options))
));
assert.ok(
  reportDeveloperCatalog.stages.find((stage) => stage.id === "checks")
    .categories.find((category) => category.id === "recommendations").options.length > 0,
  "As regras de verificações importantes precisam fazer parte do JSON de desenvolvimento."
);
const nativeChecks = reportDeveloperCatalog.stages.find((stage) => stage.id === "checks")
  .categories.find((category) => category.id === "checks").options;
const selfieCheck = nativeChecks.find((option) => option.id === "selfie");
assert.deepEqual(selfieCheck, {
  id: "selfie",
  label: "Selfie com Documento",
  order: -1,
  products: ["internet", "roteador"],
  contacts: ["Solicitação"],
  triggers: { requests: ["wifi_password", "wifi_name"] },
  priority: { enabled: true, order: 1 }
}, "A verificação de selfie precisa fazer parte do catálogo nativo com a rota aprovada.");
const attendanceStage = reportDeveloperCatalog.stages.find((stage) => stage.id === "attendance");
const problemStage = reportDeveloperCatalog.stages.find((stage) => stage.id === "problem");
const checksStage = reportDeveloperCatalog.stages.find((stage) => stage.id === "checks");
const actionsStage = reportDeveloperCatalog.stages.find((stage) => stage.id === "actions");
const finalizationStage = reportDeveloperCatalog.stages.find((stage) => stage.id === "finalization");
const noInteractionAttempts = attendanceStage.categories
  .find((category) => category.id === "no_interaction_attempts").options;
assert.equal(noInteractionAttempts[0].value, "");
assert.equal(noInteractionAttempts[0].label, "Sem interação");
const internetSlowness = problemStage.categories
  .find((category) => category.id === "issues_internet").options
  .find((option) => option.id === "internet_slowness");
assert.equal(internetSlowness.label, "Lentidão");
const wifiBandGuidance = actionsStage.categories
  .find((category) => category.id === "actions").options
  .find((option) => option.id === "wifi_band_usage_guidance");
assert.deepEqual(wifiBandGuidance.products, ["internet"]);
assert.deepEqual(wifiBandGuidance.triggers.issues, ["internet_slowness"]);
assert.equal(wifiBandGuidance.priority.enabled, true);
const tvBoxRemoteRequest = problemStage.categories
  .find((category) => category.id === "requests").options
  .find((option) => option.id === "tv_box_remote_exchange_damage");
assert.equal(tvBoxRemoteRequest?.label, "Troca do controle remoto da TV Box por danos");
assert.deepEqual(tvBoxRemoteRequest?.products, ["tv_box"]);
const tvBoxRemoteDamageCheck = nativeChecks.find((option) => option.id === "tv_box_remote_damage");
assert.deepEqual(tvBoxRemoteDamageCheck?.products, ["tv_box"]);
assert.deepEqual(tvBoxRemoteDamageCheck?.contacts, ["Solicitação"]);
assert.deepEqual(tvBoxRemoteDamageCheck?.triggers?.requests, ["tv_box_remote_exchange_damage"]);
assert.equal(tvBoxRemoteDamageCheck?.priority?.enabled, true);
const radiusAuthenticationCheck = nativeChecks.find((option) => option.id === "radius_auth");
assert.equal(radiusAuthenticationCheck?.label, "Consultado o log RADIUS e verificada a autenticação da conexão");
assert.deepEqual(radiusAuthenticationCheck?.products, ["internet", "roteador"]);
assert.deepEqual(radiusAuthenticationCheck?.triggers?.issues, ["internet_no_access"]);
assert.equal(radiusAuthenticationCheck?.priority?.enabled, true);
assert.equal(radiusAuthenticationCheck?.priority?.order, 4);
const radiusRecommendation = checksStage.categories
  .find((category) => category.id === "recommendations").options
  .find((option) => option.product === "internet" && option.checks.includes("radius_auth"));
assert.deepEqual(radiusRecommendation?.issues, ["Sem acesso à internet"]);
assert.ok(radiusRecommendation?.checks.includes("nme_nce_link"));
const nmeNceLinkCheck = nativeChecks.find((option) => option.id === "nme_nce_link");
assert.equal(nmeNceLinkCheck?.label, "Verificado no NME/NCE se a conexão está linkando");
assert.deepEqual(nmeNceLinkCheck?.products, ["internet", "roteador"]);
assert.deepEqual(nmeNceLinkCheck?.triggers?.issues, ["internet_no_access"]);
assert.equal(nmeNceLinkCheck?.priority?.enabled, true);
assert.equal(nmeNceLinkCheck?.priority?.order, 5);
const reportProductIds = new Set(
  attendanceStage.categories.find((category) => category.id === "products").options.map((option) => option.id)
);
const reportContactLabels = new Set(
  attendanceStage.categories.find((category) => category.id === "contact_types").options.map((option) => option.label)
);
const reportRequestIds = new Set(
  problemStage.categories.find((category) => category.id === "requests").options.map((option) => option.id)
);
const reportIssueIds = new Set(
  problemStage.categories
    .filter((category) => category.id.startsWith("issues_"))
    .flatMap((category) => category.options.map((option) => option.id))
);
for (const stage of reportDeveloperCatalog.stages) {
  const categoryIds = stage.categories.map((category) => category.id);
  assert.equal(new Set(categoryIds).size, categoryIds.length, `A etapa ${stage.id} contém categorias duplicadas.`);
  for (const category of stage.categories) {
    const optionIds = category.options.map((option) => option.id).filter(Boolean);
    assert.equal(new Set(optionIds).size, optionIds.length, `A categoria ${category.id} contém IDs duplicados.`);
  }
}
for (const category of [
  ...checksStage.categories.filter((item) => ["checks", "measurements"].includes(item.id)),
  ...actionsStage.categories,
  ...finalizationStage.categories.filter((item) => ["outcomes", "visit_reasons"].includes(item.id))
]) {
  for (const option of category.options) {
    assert.ok((option.products || ["*"]).every((id) => id === "*" || reportProductIds.has(id)),
      `${category.id}/${option.id} referencia um produto inexistente.`);
    assert.ok((option.contacts || ["*"]).every((label) => label === "*" || reportContactLabels.has(label)),
      `${category.id}/${option.id} referencia um motivo de contato inexistente.`);
    assert.ok((option.triggers?.requests || []).every((id) => reportRequestIds.has(id)),
      `${category.id}/${option.id} referencia uma solicitação inexistente.`);
    assert.ok((option.triggers?.issues || []).every((id) => reportIssueIds.has(id)),
      `${category.id}/${option.id} referencia um problema inexistente.`);
  }
}
assert.ok(
  attendanceStage.categories.find((category) => category.id === "products")
    .options.some((option) => option.id === "way_vision" && option.label === "Way Vision"),
  "Way Vision precisa estar disponível como produto do relato."
);
const wayVisionIssues = problemStage.categories.find((category) => category.id === "issues_way_vision").options;
assert.equal(wayVisionIssues.length, 20, "Way Vision precisa oferecer o catálogo completo de problemas de câmera.");
for (const requestId of [
  "vision_installation", "vision_wifi_change", "vision_pairing", "vision_share",
  "vision_recording_guidance", "vision_notifications"
]) {
  assert.ok(
    problemStage.categories.find((category) => category.id === "requests")
      .options.some((option) => option.id === requestId && option.products.includes("way_vision")),
    `Solicitação ${requestId} precisa estar vinculada ao Way Vision.`
  );
}
const wayVisionCheckIds = [
  "vision_power", "vision_network", "vision_wifi", "vision_app", "vision_account",
  "vision_pairing", "vision_live", "vision_quality", "vision_night", "vision_recording",
  "vision_storage", "vision_motion", "vision_notifications", "vision_audio", "vision_datetime",
  "vision_firmware", "vision_remote", "vision_share", "vision_ptz", "vision_physical"
];
for (const checkId of wayVisionCheckIds) {
  assert.ok(nativeChecks.some((option) => option.id === checkId && option.products.includes("way_vision")),
    `Verificação ${checkId} precisa estar vinculada ao Way Vision.`);
}
const wayVisionRecommendations = checksStage.categories.find((category) => category.id === "recommendations")
  .options.filter((option) => option.product === "way_vision");
assert.equal(wayVisionRecommendations.length, 9, "Os problemas do Way Vision precisam possuir nove rotas de recomendações.");
const wayVisionIssueLabels = new Set(wayVisionIssues.map((option) => option.label));
const nativeCheckIds = new Set(nativeChecks.map((option) => option.id));
for (const rule of wayVisionRecommendations) {
  assert.ok(rule.issues.every((issue) => wayVisionIssueLabels.has(issue)),
    `A regra ${rule.id} não pode referenciar um problema inexistente do Way Vision.`);
  assert.ok(rule.checks.every((checkId) => nativeCheckIds.has(checkId)),
    `A regra ${rule.id} não pode referenciar uma verificação inexistente.`);
}
assert.ok(
  checksStage.categories.find((category) => category.id === "measurements")
    .options.filter((option) => option.products.includes("way_vision")).length >= 5,
  "Way Vision precisa possuir medições de rede, armazenamento e vídeo."
);
assert.ok(
  actionsStage.categories.find((category) => category.id === "actions")
    .options.filter((option) => option.products.includes("way_vision")).length >= 13,
  "Way Vision precisa possuir ações corretivas específicas."
);
assert.ok(
  finalizationStage.categories.find((category) => category.id === "visit_reasons")
    .options.filter((option) => option.products.includes("way_vision")).length >= 5,
  "Way Vision precisa possuir motivos específicos para visita técnica."
);
const linkedCatalog = JSON.parse(JSON.stringify(reportDeveloperCatalog));
linkedCatalog.stages.find((stage) => stage.id === "checks")
  .categories.find((category) => category.id === "checks").options.push({
    id: "wifi_credentials_confirmed",
    label: "Confirmados nome e senha da rede Wi-Fi",
    products: ["internet", "roteador"],
    contacts: ["Solicitação"],
    triggers: { requests: ["wifi_password", "wifi_name"] },
    order: 15,
    priority: { enabled: true, order: 5 }
  });
const reportOverrideContext = evaluateReportGeneratorCatalog("chrome-extension:", linkedCatalog);
const overriddenChecks = reportOverrideContext.WayToolsReportGeneratorDeveloper.getCatalog()
  .stages.find((stage) => stage.id === "checks")
  .categories.find((category) => category.id === "checks").options;
assert.ok(overriddenChecks.some((option) =>
  option.id === "wifi_credentials_confirmed" &&
  option.triggers.requests.includes("wifi_password") &&
  option.triggers.requests.includes("wifi_name") &&
  option.order === 15 &&
  option.priority.enabled === true &&
  option.priority.order === 5
), "O simulador precisa compilar vínculos visuais salvos no catálogo local.");
assert.equal(
  overriddenChecks.findIndex((option) => option.id === "wifi_credentials_confirmed"),
  2,
  "A ordem configurada precisa reposicionar a opção entre os itens 10 e 20."
);
const reportProductionContext = evaluateReportGeneratorCatalog("https:");
assert.equal(
  reportProductionContext.WayToolsReportGeneratorDeveloper,
  undefined,
  "A API do estúdio não pode ser exposta dentro do ERP."
);
assert.match(erpReportGeneratorSource, /function generateNoInteractionReport\(/);
assert.match(erpReportGeneratorSource, /data-no-interaction-section/);
assert.match(erpReportGeneratorSource, /Gerar relato rápido/);
assert.match(erpReportGeneratorSource, /way-report-check\.recommended/);
assert.match(erpReportGeneratorSource, /Marque somente o que foi realmente verificado/);
assert.match(erpReportGeneratorSource, /Chat sem interação → relato rápido/);
assert.match(erpReportGeneratorSource, /let OUTCOME_VALIDATION = Object\.freeze\(/);
assert.match(erpReportGeneratorSource, /function selectedProductIds\(/);
assert.match(erpReportGeneratorSource, /function selectedOptionIds\(/);
assert.match(erpReportGeneratorSource, /function selectedIssueIds\(/);
assert.match(erpReportGeneratorSource, /function routeAllows\(/);
assert.match(erpReportGeneratorSource, /function orderedEntries\(/);
assert.match(erpReportGeneratorSource, /data-route-products=/);
assert.match(erpReportGeneratorSource, /data-route-requests=/);
assert.match(erpReportGeneratorSource, /data-route-issues=/);
assert.match(erpReportGeneratorSource, /data-option-order=/);
assert.match(erpReportGeneratorSource, /data-priority-enabled=/);
assert.match(erpReportGeneratorSource, /-100000 \+ priorityOrder/);
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
  "messages.catalog.n2.v1",
  (newValue) => {
    observedSharedCatalog = newValue;
  }
);
const sharedCatalog = [{ id: "shared-test", comando: "teste" }];
chatwootStorageAdapter.setSharedValue("messages.catalog.n2.v1", sharedCatalog);
runtimeStorageListeners[0](
  {
    "wayTools.shared.messages.catalog.n2.v1": {
      oldValue: undefined,
      newValue: sharedCatalog
    }
  },
  "local"
);
assert.deepEqual(observedSharedCatalog, sharedCatalog);
assert.deepEqual(
  matrixStorageAdapter.getSharedValue("messages.catalog.n2.v1", null),
  sharedCatalog,
  "ChatWoot e Matrix devem acessar o mesmo catálogo N2."
);
stopObservingSharedCatalog();
assert.equal(runtimeStorageListeners.length, 0);

const sacCatalog = [{ id: "sac-test", comando: "sac" }];
chatwootStorageAdapter.setSharedValue("messages.catalog.sac.v1", sacCatalog);
chatwootStorageAdapter.setSharedValue("messages.sector.v1", "sac");
assert.deepEqual(matrixStorageAdapter.getSharedValue("messages.catalog.sac.v1", null), sacCatalog);
assert.equal(matrixStorageAdapter.getSharedValue("messages.sector.v1", null), "sac");
assert.deepEqual(
  matrixStorageAdapter.getSharedValue("messages.catalog.n2.v1", null),
  sharedCatalog,
  "A troca para SAC não deve sobrescrever o catálogo N2."
);

for (const source of [scriptSource, matrixMessagesSource]) {
  assert.match(source, /LEGACY_SHARED_MESSAGES_KEY\s*=\s*['"]messages\.catalog\.v1['"]/);
  assert.match(source, /MESSAGE_SECTOR_KEY\s*=\s*['"]messages\.sector\.v1['"]/);
  assert.match(source, /n2:\s*['"]messages\.catalog\.n2\.v1['"]/);
  assert.match(source, /sac:\s*['"]messages\.catalog\.sac\.v1['"]/);
  assert.match(source, /onSharedValueChanged\(\s*MESSAGE_SECTOR_KEY/);
}
assert.match(scriptSource, /setorMensagensAtivo\s*===\s*'n2'/);
assert.match(matrixMessagesSource, /activeSector\s*===\s*"n2"/);

const javascriptFiles = [
  "config/scripts.js",
  "config/default-messages.js",
  "config/spelling-dictionary.js",
  "content/instance-coordinator.js",
  "content/message-catalog-manager.js",
  "content/message-experience.js",
  "content/backup-manager.js",
  "content/runtime.js",
  "content/chatwoot-realtime-bridge.js",
  "content/message-notification-policy.js",
  "content/spelling-engine.js",
  "background/service-worker.js",
  "popup/popup.js",
  "popup/diagnostics.js",
  "developer/report-generator-preview.js",
  "developer/sac-catalog-review.js",
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
