(() => {
  "use strict";

  const scripts = globalThis.WAY_TOOLS_SCRIPTS || [];
  const scriptsList = document.querySelector("#scripts-list");
  const scriptCount = document.querySelector("#script-count");
  const pageStatus = document.querySelector(".page-status");
  const pageStatusTitle = document.querySelector("#page-status-title");
  const pageStatusDescription = document.querySelector("#page-status-description");
  const changeNote = document.querySelector("#change-note");
  const reloadButton = document.querySelector("#reload-page");
  const extensionVersion = document.querySelector("#extension-version");
  const pageCommands = document.querySelector("#page-commands");
  const commandsList = document.querySelector("#commands-list");

  let activeTabId = null;
  let activeUrl = "";

  extensionVersion.textContent = `v${chrome.runtime.getManifest().version}`;

  function enabledKey(scriptId) {
    return `wayTools.scripts.${scriptId}.enabled`;
  }

  function wildcardMatches(pattern, url) {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`).test(url);
  }

  function scriptMatchesUrl(script, url) {
    return script.matches.some((pattern) => wildcardMatches(pattern, url));
  }

  function getDisplayHost(pattern) {
    try {
      return new URL(pattern.replace("*", "pagina")).host;
    } catch {
      return pattern;
    }
  }

  function createScriptCard(script, enabled) {
    const article = document.createElement("article");
    article.className = `script-card${enabled ? "" : " disabled"}`;

    const top = document.createElement("div");
    top.className = "script-card-top";

    const content = document.createElement("div");
    const titleRow = document.createElement("div");
    titleRow.className = "script-title-row";

    const title = document.createElement("h2");
    title.textContent = script.name;

    const version = document.createElement("span");
    version.className = "script-version";
    version.textContent = `v${script.version}`;

    titleRow.append(title, version);
    content.append(titleRow);

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "switch";
    toggleLabel.title = `Ativar ou desativar ${script.name}`;

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = enabled;
    toggle.setAttribute("aria-label", `Ativar ${script.name}`);

    const track = document.createElement("span");
    track.className = "switch-track";
    toggleLabel.append(toggle, track);
    top.append(content, toggleLabel);

    const description = document.createElement("p");
    description.textContent = script.description;

    const site = document.createElement("span");
    site.className = "script-site";
    site.textContent = getDisplayHost(script.matches[0]);

    toggle.addEventListener("change", async () => {
      await chrome.storage.local.set({ [enabledKey(script.id)]: toggle.checked });
      article.classList.toggle("disabled", !toggle.checked);
      changeNote.hidden = false;
    });

    article.append(top, description, site);
    return article;
  }

  async function renderScripts() {
    const defaults = Object.fromEntries(
      scripts.map((script) => [enabledKey(script.id), script.defaultEnabled !== false])
    );
    const stored = await chrome.storage.local.get(defaults);

    scriptsList.replaceChildren(
      ...scripts.map((script) => createScriptCard(script, stored[enabledKey(script.id)] === true))
    );
    scriptCount.textContent = String(scripts.length);
  }

  async function inspectActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      pageStatusTitle.textContent = "Página não identificada";
      pageStatusDescription.textContent = "Abra o sistema da Way para usar os scripts.";
      return;
    }

    activeTabId = tab.id;
    activeUrl = tab.url || "";
    const compatibleScripts = scripts.filter((script) => scriptMatchesUrl(script, activeUrl));

    if (compatibleScripts.length > 0) {
      pageStatus.classList.add("compatible");
      pageStatusTitle.textContent = "Way Tools disponível nesta página";
      pageStatusDescription.textContent = `${compatibleScripts.length} script${compatibleScripts.length === 1 ? "" : "s"} compatível${compatibleScripts.length === 1 ? "" : "is"}.`;
      reloadButton.disabled = false;
      return;
    }

    pageStatusTitle.textContent = "Nenhum script para esta página";
    pageStatusDescription.textContent = "As ferramentas só acessam os sites cadastrados.";
  }

  async function renderPageCommands() {
    if (activeTabId === null) {
      return;
    }

    let response;

    try {
      response = await chrome.tabs.sendMessage(activeTabId, {
        type: "wayTools:listMenuCommands"
      });
    } catch {
      return;
    }

    const commands = Array.isArray(response?.commands) ? response.commands : [];

    if (commands.length === 0) {
      return;
    }

    const buttons = commands.map((command) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-button";
      button.textContent = command.label;
      button.addEventListener("click", async () => {
        button.disabled = true;

        try {
          const result = await chrome.tabs.sendMessage(activeTabId, {
            type: "wayTools:executeMenuCommand",
            commandId: command.id
          });

          if (result?.ok) {
            window.close();
            return;
          }
        } catch (error) {
          console.error("[Way Tools] Falha ao executar ação:", error);
        }

        button.disabled = false;
      });
      return button;
    });

    commandsList.replaceChildren(...buttons);
    pageCommands.hidden = false;
  }

  reloadButton.addEventListener("click", async () => {
    if (activeTabId === null || !activeUrl) {
      return;
    }

    await chrome.tabs.reload(activeTabId);
    window.close();
  });

  async function initialize() {
    await Promise.all([renderScripts(), inspectActiveTab()]);
    await renderPageCommands();
  }

  initialize().catch((error) => {
      console.error("[Way Tools] Falha ao abrir o painel:", error);
      pageStatusTitle.textContent = "Não foi possível carregar o painel";
      pageStatusDescription.textContent = "Feche e abra o Way Tools novamente.";
    });
})();
