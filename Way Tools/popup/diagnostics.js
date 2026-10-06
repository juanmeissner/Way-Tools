(() => {
  "use strict";

  async function render(options) {
    const {
      statusElement,
      listElement,
      activeTabId,
      activeUrl,
      scripts,
      scriptEnabledState,
      messageSectorStorageKey,
      messageCatalogStorageKeys,
      normalizeMessageSector
    } = options;
    statusElement.textContent = "Verificando…";
    const manifest = chrome.runtime.getManifest();
    const storageKeys = [
      messageSectorStorageKey,
      messageCatalogStorageKeys.n2,
      messageCatalogStorageKeys.sac,
      "wayTools.shared.messages.experience.n2.v1",
      "wayTools.shared.messages.experience.sac.v1"
    ];
    const stored = await chrome.storage.local.get(storageKeys);
    const sector = normalizeMessageSector(stored[messageSectorStorageKey]);
    const enabledCount = [...scriptEnabledState.values()].filter(Boolean).length;
    const n2Count = Array.isArray(stored[messageCatalogStorageKeys.n2])
      ? stored[messageCatalogStorageKeys.n2].length
      : 0;
    const sacCount = Array.isArray(stored[messageCatalogStorageKeys.sac])
      ? stored[messageCatalogStorageKeys.sac].length
      : 0;
    const experienceKey = `wayTools.shared.messages.experience.${sector}.v1`;
    const lastSync = Number(stored[experienceKey]?.updatedAt) || 0;
    let pageDiagnostics = null;

    if (activeTabId && activeUrl.includes("ia-nocodb.internetway.com.br")) {
      try {
        pageDiagnostics = await chrome.tabs.sendMessage(activeTabId, { type: "wayTools:getDiagnostics" });
      } catch {
        pageDiagnostics = null;
      }
    }

    const duplicateLabel = pageDiagnostics?.duplicateInstallation
      ? "⚠ Outra instalação do Way Tools foi detectada"
      : "✓ Nenhum conflito entre instalações detectado";
    const realtimeLabel = pageDiagnostics
      ? pageDiagnostics.realtimeActive
        ? "✓ Eventos em tempo real ativos"
        : "⚠ Eventos em tempo real ainda não conectados"
      : "Informação em tempo real disponível ao abrir o ChatWoot";
    listElement.innerHTML = `
      <div><span>Versão instalada</span><strong>${manifest.version}</strong></div>
      <div><span>Perfil ativo</span><strong>${sector.toUpperCase()}</strong></div>
      <div><span>Módulos ativos</span><strong>${enabledCount} de ${scripts.length}</strong></div>
      <div><span>Catálogos</span><strong>N2: ${n2Count} · SAC: ${sacCount}</strong></div>
      <div><span>Última alteração compartilhada</span><strong>${lastSync ? new Date(lastSync).toLocaleString("pt-BR") : "Ainda não registrada"}</strong></div>
      <div class="${pageDiagnostics?.duplicateInstallation ? "warning" : "ok"}"><span>Conflitos</span><strong>${duplicateLabel}</strong></div>
      <div class="${pageDiagnostics && !pageDiagnostics.realtimeActive ? "warning" : "ok"}"><span>ChatWoot</span><strong>${realtimeLabel}</strong></div>
    `;
    statusElement.textContent = "Diagnóstico atualizado.";
  }

  globalThis.WayToolsPopupDiagnostics = Object.freeze({ render });
})();
