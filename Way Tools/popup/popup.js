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
  const correctionForm = document.querySelector("#correction-form");
  const correctionSource = document.querySelector("#correction-source");
  const correctionTarget = document.querySelector("#correction-target");
  const correctionsList = document.querySelector("#corrections-list");
  const ignoredForm = document.querySelector("#ignored-form");
  const ignoredWord = document.querySelector("#ignored-word");
  const ignoredList = document.querySelector("#ignored-list");
  const dictionaryStatus = document.querySelector("#dictionary-status");
  const notificationDuration = document.querySelector("#notification-duration");
  const notificationDurationDescription = document.querySelector("#notification-duration-description");
  const notificationWhenFocused = document.querySelector("#notification-when-focused");
  const notificationWhenFocusedDescription = document.querySelector("#notification-when-focused-description");
  const notificationSettingsStatus = document.querySelector("#notification-settings-status");
  const tabButtons = [...document.querySelectorAll("[data-tab-target]")];
  const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
  const compatibleScriptsList = document.querySelector("#compatible-scripts-list");
  const compatibleCount = document.querySelector("#compatible-count");
  const openToolsButton = document.querySelector("#open-tools");
  const openSettingsButton = document.querySelector("#open-settings");

  const personalDictionaryStorageKey =
    "wayTools.data.way-corretor-ortografico-pro.way-corretor-dicionario-pessoal-v1";
  const notificationDurationStorageKey = "wayTools.notifications.duration";
  const notificationDurationDefault = "5";
  const notificationWhenFocusedStorageKey = "wayTools.notifications.whenFocused";
  const notificationWhenFocusedDefault = false;
  const notificationDurationDescriptions = Object.freeze({
    disabled: "Não exibir notificações de novas mensagens.",
    windows: "Usar o tempo definido pelo Windows e manter o aviso na Central de Notificações.",
    "1": "Remover completamente a notificação após 1 segundo.",
    "2": "Remover completamente a notificação após 2 segundos.",
    "5": "Remover completamente a notificação após 5 segundos.",
    "10": "Remover completamente a notificação após 10 segundos.",
    "30": "Remover completamente a notificação após aproximadamente 30 segundos.",
    "60": "Remover completamente a notificação após aproximadamente 1 minuto.",
    persistent: "Manter a notificação até você clicar nela ou fechá-la."
  });
  const maxPersonalEntries = 200;

  let activeTabId = null;
  let activeUrl = "";
  let compatibleScripts = [];
  const scriptEnabledState = new Map();
  let personalDictionary = {
    corrections: {},
    ignored: []
  };

  extensionVersion.textContent = `v${chrome.runtime.getManifest().version}`;

  function enabledKey(scriptId) {
    return `wayTools.scripts.${scriptId}.enabled`;
  }

  function activateTab(tabName, focusTab = false) {
    const selectedButton = tabButtons.find((button) => button.dataset.tabTarget === tabName);

    if (!selectedButton) {
      return;
    }

    for (const button of tabButtons) {
      const selected = button === selectedButton;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    }

    for (const panel of tabPanels) {
      const selected = panel.dataset.tabPanel === tabName;
      panel.classList.toggle("active", selected);
      panel.hidden = !selected;
    }

    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });

    if (focusTab) {
      selectedButton.focus();
    }
  }

  function normalizeNotificationDuration(value) {
    return Object.prototype.hasOwnProperty.call(notificationDurationDescriptions, value)
      ? value
      : notificationDurationDefault;
  }

  function updateNotificationDurationDescription(value) {
    notificationDurationDescription.textContent =
      notificationDurationDescriptions[normalizeNotificationDuration(value)];
  }

  async function loadNotificationDuration() {
    const stored = await chrome.storage.local.get({
      [notificationDurationStorageKey]: notificationDurationDefault
    });
    const value = normalizeNotificationDuration(stored[notificationDurationStorageKey]);
    notificationDuration.value = value;
    updateNotificationDurationDescription(value);
  }

  function updateNotificationWhenFocusedDescription(enabled) {
    notificationWhenFocusedDescription.textContent = enabled
      ? "Ativado: também avisa enquanto o ChatWoot estiver visível e em foco."
      : "Desativado: avisa somente quando o ChatWoot estiver em outra aba ou minimizado.";
  }

  async function loadNotificationWhenFocused() {
    const stored = await chrome.storage.local.get({
      [notificationWhenFocusedStorageKey]: notificationWhenFocusedDefault
    });
    const enabled = stored[notificationWhenFocusedStorageKey] === true;
    notificationWhenFocused.checked = enabled;
    updateNotificationWhenFocusedDescription(enabled);
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

  function getScriptPlatform(script) {
    const matches = script.matches.join(" ");

    if (matches.includes("ia-nocodb.internetway.com.br")) {
      return { id: "chatwoot", label: "ChatWoot" };
    }

    if (matches.includes("erp.internetway.com.br")) {
      return { id: "erp", label: "ERP Way" };
    }

    if (matches.includes("wayinternet.matrixdobrasil.ai")) {
      return { id: "matrix", label: "Matrix" };
    }

    return { id: "general", label: "Geral" };
  }

  function updateScriptVisualState(article, state, enabled) {
    article.classList.toggle("disabled", !enabled);
    state.textContent = enabled ? "Ativo" : "Desativado";
  }

  function createScriptCard(script, enabled) {
    const article = document.createElement("article");
    article.className = `script-card${enabled ? "" : " disabled"}`;
    article.dataset.scriptId = script.id;

    const top = document.createElement("div");
    top.className = "script-card-top";

    const content = document.createElement("div");
    const titleRow = document.createElement("div");
    titleRow.className = "script-title-row";

    const title = document.createElement("h3");
    title.textContent = script.name;

    const version = document.createElement("span");
    version.className = "script-version";
    version.textContent = `v${script.version}`;

    titleRow.append(title, version);

    if (script.badge) {
      const badge = document.createElement("span");
      badge.className = "script-badge";
      badge.textContent = script.badge;
      titleRow.append(badge);
    }

    const meta = document.createElement("div");
    meta.className = "script-meta";

    const platform = getScriptPlatform(script);
    const platformBadge = document.createElement("span");
    platformBadge.className = `platform-badge ${platform.id}`;
    platformBadge.textContent = platform.label;

    const state = document.createElement("span");
    state.className = "script-state";

    meta.append(platformBadge, state);
    content.append(titleRow, meta);

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

    const details = document.createElement("details");
    details.className = "script-details";

    const summary = document.createElement("summary");
    summary.textContent = "Ver detalhes";

    const description = document.createElement("p");
    description.textContent = script.description;

    const site = document.createElement("span");
    site.className = "script-site";
    site.textContent = getDisplayHost(script.matches[0]);

    details.append(summary, description, site);

    toggle.addEventListener("change", async () => {
      await chrome.storage.local.set({ [enabledKey(script.id)]: toggle.checked });
      scriptEnabledState.set(script.id, toggle.checked);
      updateScriptVisualState(article, state, toggle.checked);
      renderCompatibleScripts();
      changeNote.hidden = false;
    });

    updateScriptVisualState(article, state, enabled);
    article.append(top, details);
    return article;
  }

  function createScriptGroup(platform, groupScripts) {
    const section = document.createElement("section");
    section.className = "script-group";

    const heading = document.createElement("div");
    heading.className = "script-group-heading";

    const title = document.createElement("span");
    title.textContent = platform.label;

    const count = document.createElement("span");
    count.textContent = `${groupScripts.length} recurso${groupScripts.length === 1 ? "" : "s"}`;

    const items = document.createElement("div");
    items.className = "script-group-items";
    items.append(
      ...groupScripts.map((script) =>
        createScriptCard(script, scriptEnabledState.get(script.id) === true)
      )
    );

    heading.append(title, count);
    section.append(heading, items);
    return section;
  }

  function focusScriptCard(scriptId) {
    activateTab("tools");
    const article = scriptsList.querySelector(`[data-script-id="${CSS.escape(scriptId)}"]`);

    if (!article) {
      return;
    }

    article.scrollIntoView({ behavior: "smooth", block: "center" });
    article.classList.add("highlight");
    window.setTimeout(() => article.classList.remove("highlight"), 1100);
  }

  function renderCompatibleScripts() {
    compatibleCount.textContent = String(compatibleScripts.length);

    if (compatibleScripts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "compatible-empty";
      empty.textContent = "Nenhuma ferramenta é executada neste endereço. Abra o ChatWoot, o ERP Way ou o Matrix.";
      compatibleScriptsList.replaceChildren(empty);
      return;
    }

    compatibleScriptsList.replaceChildren(
      ...compatibleScripts.map((script) => {
        const item = document.createElement("div");
        item.className = "compatible-item";

        const copy = document.createElement("div");
        copy.className = "compatible-copy";

        const name = document.createElement("strong");
        name.textContent = script.name;

        const enabled = scriptEnabledState.get(script.id) === true;
        const state = document.createElement("small");
        state.className = enabled ? "" : "off";
        state.textContent = enabled ? "● Ativo nesta página" : "○ Desativado";

        const manage = document.createElement("button");
        manage.type = "button";
        manage.className = "compatible-manage";
        manage.textContent = "Gerenciar";
        manage.addEventListener("click", () => focusScriptCard(script.id));

        copy.append(name, state);
        item.append(copy, manage);
        return item;
      })
    );
  }

  function normalizePersonalWord(value) {
    return String(value || "").trim().toLocaleLowerCase("pt-BR");
  }

  function isValidPersonalWord(value) {
    return /^[\p{L}\p{N}][\p{L}\p{N}\p{M}-]*$/u.test(value);
  }

  function setDictionaryStatus(message, type = "success") {
    dictionaryStatus.textContent = message;
    dictionaryStatus.className = `dictionary-status ${type}`;
  }

  function parsePersonalDictionary(rawValue) {
    try {
      const value = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
      const corrections = value?.corrections && typeof value.corrections === "object" && !Array.isArray(value.corrections)
        ? Object.fromEntries(
            Object.entries(value.corrections)
              .map(([source, target]) => [normalizePersonalWord(source), String(target).trim()])
              .filter(([source, target]) => isValidPersonalWord(source) && target)
          )
        : {};
      const ignored = Array.isArray(value?.ignored)
        ? [...new Set(value.ignored.map(normalizePersonalWord).filter(isValidPersonalWord))]
        : [];
      return { corrections, ignored };
    } catch {
      return { corrections: {}, ignored: [] };
    }
  }

  async function savePersonalDictionary(message) {
    await chrome.storage.local.set({
      [personalDictionaryStorageKey]: JSON.stringify(personalDictionary)
    });
    renderPersonalDictionary();
    setDictionaryStatus(message);
    changeNote.hidden = false;
  }

  function createDictionaryItem(label, removeLabel, onRemove) {
    const item = document.createElement("div");
    item.className = "dictionary-item";

    const text = document.createElement("span");
    text.textContent = label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remover";
    remove.setAttribute("aria-label", removeLabel);
    remove.addEventListener("click", onRemove);

    item.append(text, remove);
    return item;
  }

  function renderPersonalDictionary() {
    const correctionEntries = Object.entries(personalDictionary.corrections)
      .sort(([left], [right]) => left.localeCompare(right, "pt-BR"));
    const ignoredEntries = [...personalDictionary.ignored]
      .sort((left, right) => left.localeCompare(right, "pt-BR"));

    if (correctionEntries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dictionary-empty";
      empty.textContent = "Nenhuma correção pessoal cadastrada.";
      correctionsList.replaceChildren(empty);
    } else {
      correctionsList.replaceChildren(
        ...correctionEntries.map(([source, target]) =>
          createDictionaryItem(
            `${source} → ${target}`,
            `Remover correção de ${source}`,
            async () => {
              delete personalDictionary.corrections[source];
              await savePersonalDictionary("Correção removida e aplicada às páginas abertas.");
            }
          )
        )
      );
    }

    if (ignoredEntries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dictionary-empty";
      empty.textContent = "Nenhuma exceção pessoal cadastrada.";
      ignoredList.replaceChildren(empty);
    } else {
      ignoredList.replaceChildren(
        ...ignoredEntries.map((word) =>
          createDictionaryItem(
            word,
            `Remover exceção ${word}`,
            async () => {
              personalDictionary.ignored = personalDictionary.ignored.filter((item) => item !== word);
              await savePersonalDictionary("Exceção removida e aplicada às páginas abertas.");
            }
          )
        )
      );
    }
  }

  async function loadPersonalDictionary() {
    const stored = await chrome.storage.local.get(personalDictionaryStorageKey);
    personalDictionary = parsePersonalDictionary(stored[personalDictionaryStorageKey]);
    renderPersonalDictionary();
  }

  async function renderScripts() {
    const defaults = Object.fromEntries(
      scripts.map((script) => [enabledKey(script.id), script.defaultEnabled !== false])
    );
    const stored = await chrome.storage.local.get(defaults);

    for (const script of scripts) {
      scriptEnabledState.set(script.id, stored[enabledKey(script.id)] === true);
    }

    const platformOrder = ["chatwoot", "erp", "matrix", "general"];
    const groups = platformOrder
      .map((platformId) => {
        const groupScripts = scripts.filter((script) => getScriptPlatform(script).id === platformId);
        return groupScripts.length > 0
          ? createScriptGroup(getScriptPlatform(groupScripts[0]), groupScripts)
          : null;
      })
      .filter(Boolean);

    scriptsList.replaceChildren(...groups);
    scriptCount.textContent = String(scripts.length);
    renderCompatibleScripts();
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
    compatibleScripts = scripts.filter((script) => scriptMatchesUrl(script, activeUrl));
    renderCompatibleScripts();

    if (compatibleScripts.length > 0) {
      pageStatus.classList.add("compatible");
      pageStatusTitle.textContent = "Way Tools disponível nesta página";
      pageStatusDescription.textContent = `${compatibleScripts.length} ${compatibleScripts.length === 1 ? "script compatível" : "scripts compatíveis"}.`;
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

  for (const [index, button] of tabButtons.entries()) {
    button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
    button.addEventListener("keydown", (event) => {
      let nextIndex = null;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabButtons.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabButtons.length - 1;
      }

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();
      activateTab(tabButtons[nextIndex].dataset.tabTarget, true);
    });
  }

  openToolsButton.addEventListener("click", () => activateTab("tools", true));
  openSettingsButton.addEventListener("click", () => activateTab("settings", true));

  reloadButton.addEventListener("click", async () => {
    if (activeTabId === null || !activeUrl) {
      return;
    }

    await chrome.tabs.reload(activeTabId);
    window.close();
  });

  correctionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = normalizePersonalWord(correctionSource.value);
    const target = correctionTarget.value.trim();

    if (!isValidPersonalWord(source)) {
      setDictionaryStatus("Informe apenas uma palavra de origem, sem espaços ou símbolos.", "error");
      return;
    }

    if (!target) {
      setDictionaryStatus("Informe o texto que substituirá a palavra.", "error");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(personalDictionary.corrections, source) &&
        Object.keys(personalDictionary.corrections).length >= maxPersonalEntries) {
      setDictionaryStatus(`Limite de ${maxPersonalEntries} correções pessoais atingido.`, "error");
      return;
    }

    personalDictionary.corrections[source] = target;
    personalDictionary.ignored = personalDictionary.ignored.filter((item) => item !== source);
    correctionForm.reset();
    await savePersonalDictionary("Correção salva e aplicada às páginas abertas.");
  });

  ignoredForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const word = normalizePersonalWord(ignoredWord.value);

    if (!isValidPersonalWord(word)) {
      setDictionaryStatus("Informe apenas uma palavra para a exceção.", "error");
      return;
    }

    if (!personalDictionary.ignored.includes(word) && personalDictionary.ignored.length >= maxPersonalEntries) {
      setDictionaryStatus(`Limite de ${maxPersonalEntries} exceções pessoais atingido.`, "error");
      return;
    }

    delete personalDictionary.corrections[word];
    personalDictionary.ignored = [...new Set([...personalDictionary.ignored, word])];
    ignoredForm.reset();
    await savePersonalDictionary("Exceção salva e aplicada às páginas abertas.");
  });

  notificationDuration.addEventListener("change", async () => {
    const value = normalizeNotificationDuration(notificationDuration.value);
    notificationDuration.disabled = true;

    try {
      await chrome.storage.local.set({ [notificationDurationStorageKey]: value });
      updateNotificationDurationDescription(value);
      notificationSettingsStatus.textContent = "Configuração salva. As próximas notificações já usarão esta duração.";
    } catch (error) {
      console.error("[Way Tools] Falha ao salvar duração das notificações:", error);
      notificationSettingsStatus.textContent = "Não foi possível salvar a configuração.";
    } finally {
      notificationDuration.disabled = false;
    }
  });

  notificationWhenFocused.addEventListener("change", async () => {
    const enabled = notificationWhenFocused.checked;
    notificationWhenFocused.disabled = true;

    try {
      await chrome.storage.local.set({ [notificationWhenFocusedStorageKey]: enabled });
      updateNotificationWhenFocusedDescription(enabled);
      notificationSettingsStatus.textContent = enabled
        ? "Configuração salva. O ChatWoot também poderá avisar quando estiver em primeiro plano."
        : "Configuração salva. Os avisos aparecerão somente em outra aba ou com a janela minimizada.";
    } catch (error) {
      console.error("[Way Tools] Falha ao salvar preferência de primeiro plano:", error);
      notificationWhenFocused.checked = !enabled;
      updateNotificationWhenFocusedDescription(!enabled);
      notificationSettingsStatus.textContent = "Não foi possível salvar a configuração.";
    } finally {
      notificationWhenFocused.disabled = false;
    }
  });

  async function initialize() {
    await Promise.all([
      renderScripts(),
      inspectActiveTab(),
      loadPersonalDictionary(),
      loadNotificationDuration(),
      loadNotificationWhenFocused()
    ]);
    await renderPageCommands();
  }

  activateTab("home");
  initialize().catch((error) => {
      console.error("[Way Tools] Falha ao abrir o painel:", error);
      pageStatusTitle.textContent = "Não foi possível carregar o painel";
      pageStatusDescription.textContent = "Feche e abra o Way Tools novamente.";
    });
})();
