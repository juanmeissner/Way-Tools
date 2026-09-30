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
  let personalDictionary = {
    corrections: {},
    ignored: []
  };

  extensionVersion.textContent = `v${chrome.runtime.getManifest().version}`;

  function enabledKey(scriptId) {
    return `wayTools.scripts.${scriptId}.enabled`;
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

  initialize().catch((error) => {
      console.error("[Way Tools] Falha ao abrir o painel:", error);
      pageStatusTitle.textContent = "Não foi possível carregar o painel";
      pageStatusDescription.textContent = "Feche e abra o Way Tools novamente.";
    });
})();
