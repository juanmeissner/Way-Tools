/*
 * Way Tools - Matrix Mensagens Personalizadas v1.0
 * Comandos, tags e configuração de mensagens para o modelo clássico do Matrix.
 */

globalThis.WayToolsRuntime.run("matrix-mensagens", (storage) => {
  "use strict";

  const LEGACY_STORAGE_KEY = "way-matrix-mensagens-personalizadas-v1";
  const SHARED_MESSAGES_KEY = "messages.catalog.v1";
  const FIELD_SELECTOR =
    '.faketextbox.pastable[contenteditable="true"], div[id^="message-"][contenteditable="true"]';
  const TOOLBAR_SELECTOR = ".acoes-agente";
  const BUTTON_CLASS = "way-matrix-messages-button";
  const CONFIG_ROOT_ID = "way-matrix-messages-config-root";
  const SPECIAL_ROOT_ID = "way-matrix-messages-special-root";
  const AUTOCOMPLETE_ID = "way-matrix-messages-autocomplete";
  const STYLE_ID = "way-matrix-messages-style";
  const UNCATEGORIZED_ID = "__sem_categoria__";
  const CATEGORY_LABELS = Object.freeze({
    abertura: "👋 Abertura de atendimento",
    diagnostico: "🔎 Diagnóstico inicial",
    ajustes: "🛠️ Ajustes na conexão",
    agendamento: "📅 Agendamento de visita técnica",
    ausencia: "⏳ Gestão de ausência",
    encerramento: "✅ Encerramento de atendimento",
    iptv: "📺 IPTV",
    cameras: "🎥 Câmeras",
    documentos: "📄 Solicitação de documentos",
    velocidade: "🚀 Teste de velocidade",
    orientacoes: "📡 Orientações"
  });
  const nativeMessages = Array.isArray(globalThis.WAY_TOOLS_NATIVE_MESSAGES)
    ? globalThis.WAY_TOOLS_NATIVE_MESSAGES
    : [];
  const autocomplete = {
    field: null,
    popup: null,
    mode: "categories",
    categories: [],
    category: "",
    messages: [],
    index: 0
  };
  const blockedCommandEnter = new WeakMap();
  let refreshOpenConfig = null;
  let messages = loadMessages();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function normalizeCommand(value) {
    return normalizeText(value)
      .replace(/^!+/, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9_-]/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeMessage(raw = {}) {
    const type = ["texto", "disponibilidade", "visita"].includes(raw.tipo)
      ? raw.tipo
      : "texto";
    return {
      id: normalizeText(raw.id) || `matrix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      comando: normalizeCommand(raw.comando),
      categoria: normalizeText(raw.categoria) || "geral",
      tipo: type,
      variacaoHorario: type === "texto" && raw.variacaoHorario === true,
      mensagem: String(raw.mensagem ?? ""),
      manha: String(raw.manha ?? ""),
      tarde: String(raw.tarde ?? ""),
      noite: String(raw.noite ?? ""),
      templateVisita: String(raw.templateVisita ?? "")
    };
  }

  function validMessages(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    const commands = new Set();
    return list
      .map(normalizeMessage)
      .filter((message) => {
        if (!message.comando || commands.has(message.comando)) {
          return false;
        }
        commands.add(message.comando);
        return true;
      });
  }

  function loadMessages() {
    const shared = storage.getSharedValue(SHARED_MESSAGES_KEY, null);
    if (Array.isArray(shared)) {
      return validMessages(shared);
    }

    const legacy = storage.getValue(LEGACY_STORAGE_KEY, null);
    if (Array.isArray(legacy)) {
      return validMessages(legacy);
    }

    return validMessages(clone(nativeMessages));
  }

  function saveMessages(nextMessages) {
    messages = validMessages(nextMessages);
    storage.setSharedValue(SHARED_MESSAGES_KEY, clone(messages));
  }

  storage.onSharedValueChanged(SHARED_MESSAGES_KEY, (nextMessages) => {
    if (!Array.isArray(nextMessages)) {
      return;
    }

    messages = validMessages(nextMessages);
    closeAutocomplete();
    refreshOpenConfig?.();
  });

  function visible(element) {
    return Boolean(element && element.isConnected && element.getClientRects().length);
  }

  function getAttendanceId(element) {
    const field = element?.matches?.(FIELD_SELECTOR)
      ? element
      : element?.closest?.(".conversa, .tab-pane, [data-atendimento]")?.querySelector?.(FIELD_SELECTOR);
    const fieldId = field?.id?.match(/^message-(\d+)$/)?.[1];
    if (fieldId) {
      return fieldId;
    }
    return element?.closest?.(TOOLBAR_SELECTOR)
      ?.querySelector?.("[data-atendimento]")
      ?.getAttribute("data-atendimento") || "";
  }

  function findScope(element) {
    return element?.closest?.(
      ".conversa, .tab-pane, .atendimento, [id^='atendimento-'], [data-atendimento-container]"
    ) || document;
  }

  function findFieldFromToolbar(toolbar) {
    const attendanceId = getAttendanceId(toolbar);
    if (attendanceId) {
      const exact = document.getElementById(`message-${attendanceId}`);
      if (exact?.matches(FIELD_SELECTOR)) {
        return exact;
      }
    }
    const scoped = findScope(toolbar).querySelector(FIELD_SELECTOR);
    if (scoped) {
      return scoped;
    }
    return [...document.querySelectorAll(FIELD_SELECTOR)].find(visible) || null;
  }

  function findHeader(element) {
    const scoped = findScope(element).querySelector(".cabecalho_msg");
    if (scoped) {
      return scoped;
    }
    const attendanceId = getAttendanceId(element);
    const field = attendanceId ? document.getElementById(`message-${attendanceId}`) : null;
    const nearby = field ? findScope(field).querySelector(".cabecalho_msg") : null;
    return nearby || [...document.querySelectorAll(".cabecalho_msg")].find(visible) || null;
  }

  function valueAfterLabel(element) {
    if (!element) {
      return "";
    }
    const copy = element.cloneNode(true);
    copy.querySelectorAll("button, script, style").forEach((item) => item.remove());
    return normalizeText(copy.textContent).replace(/^[^:]{1,80}:\s*/, "");
  }

  function valueFromHeader(header, selectors, labels = []) {
    for (const selector of selectors) {
      const value = valueAfterLabel(header?.querySelector(selector));
      if (value) {
        return value;
      }
    }
    const normalizedLabels = labels.map((label) => label.toLocaleLowerCase("pt-BR"));
    for (const item of header?.querySelectorAll("small") || []) {
      const label = normalizeText(item.querySelector("strong")?.textContent)
        .replace(/:$/, "")
        .toLocaleLowerCase("pt-BR");
      if (normalizedLabels.includes(label)) {
        return valueAfterLabel(item);
      }
    }
    return "";
  }

  function firstAgentName() {
    const userInfo = document.querySelector("#user_info");
    if (!userInfo) {
      return "";
    }
    const copy = userInfo.cloneNode(true);
    copy.querySelectorAll("i, strong, [title]").forEach((item) => item.remove());
    return normalizeText(copy.textContent).split(/\s+/)[0] || "";
  }

  function getClientData(element) {
    const header = findHeader(element);
    return {
      nome: firstAgentName(),
      nomecliente: valueFromHeader(header, [".contato-nome"], ["Nome"]),
      email: valueFromHeader(header, [".contato-email"], ["E-mail", "Email"]),
      telefone: valueFromHeader(header, [".contato-telefone"], ["Telefone", "Celular"]),
      cpf: valueFromHeader(header, [".contato-cpf"], ["CPF Cliente", "CPF", "CNPJ"]),
      endereco: valueFromHeader(
        header,
        [".contato-endereco", ".variavel-endereco", "[class*='endereco']"],
        ["Endereço", "Endereco"]
      ),
      protocolo: valueFromHeader(
        header,
        [".atendimento-protocolo"],
        ["Número de protocolo", "Protocolo"]
      ),
      contrato: valueFromHeader(header, [".variavel-contrato"], ["Contrato"]),
      codigo: valueFromHeader(header, [".atendimento-codigo"], ["Cod.", "Código"])
    };
  }

  function applyTags(text, element, extra = {}) {
    const values = { ...getClientData(element), ...extra };
    return String(text ?? "").replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, tag) => {
      const value = values[String(tag).toLocaleLowerCase("pt-BR")];
      return normalizeText(value) ? String(value) : match;
    });
  }

  function currentPeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "manha";
    }
    if (hour >= 12 && hour < 18) {
      return "tarde";
    }
    return "noite";
  }

  function messageText(message, field) {
    const text = message.variacaoHorario
      ? message[currentPeriod()] || ""
      : message.mensagem || "";
    return applyTags(text, field);
  }

  function markdownToHtml(text) {
    return escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function placeCaretAtEnd(field) {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(field);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function setFieldText(field, text) {
    if (!field) {
      return;
    }
    field.focus();
    field.innerHTML = markdownToHtml(text);
    field.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text
    }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent("keyup", {
      bubbles: true,
      key: "Process"
    }));
    placeCaretAtEnd(field);
  }

  function getQuery(field) {
    const text = normalizeText(field?.textContent);
    if (!text.startsWith("!") || /\s/.test(text)) {
      return null;
    }
    const query = text.slice(1).toLocaleLowerCase("pt-BR");
    return /^[a-z0-9_-]*$/.test(query) ? query : null;
  }

  function getMatches(query) {
    return messages
      .filter((message) => message.comando.startsWith(query))
      .sort((a, b) => a.comando.localeCompare(b.comando, "pt-BR"))
      .slice(0, 30);
  }

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] || "⚪ Sem categoria";
  }

  function belongsToCategory(message, category) {
    if (category === UNCATEGORIZED_ID) {
      return !message.categoria || !CATEGORY_LABELS[message.categoria];
    }
    return message.categoria === category;
  }

  function getCategories() {
    const categories = Object.entries(CATEGORY_LABELS)
      .map(([id, label]) => {
        const commands = messages
          .filter((message) => belongsToCategory(message, id))
          .sort((a, b) => a.comando.localeCompare(b.comando, "pt-BR"));
        return { id, label, commands };
      })
      .filter((category) => category.commands.length > 0);
    const uncategorized = messages
      .filter((message) => belongsToCategory(message, UNCATEGORIZED_ID))
      .sort((a, b) => a.comando.localeCompare(b.comando, "pt-BR"));
    if (uncategorized.length) {
      categories.push({
        id: UNCATEGORIZED_ID,
        label: "⚪ Sem categoria",
        commands: uncategorized
      });
    }
    return categories;
  }

  function getCategoryMessages(category) {
    return messages
      .filter((message) => belongsToCategory(message, category))
      .sort((a, b) => a.comando.localeCompare(b.comando, "pt-BR"));
  }

  function preview(message) {
    if (message.tipo === "disponibilidade") {
      return "Selecionar data e períodos disponíveis";
    }
    if (message.tipo === "visita") {
      return "Preencher dados da visita técnica";
    }
    return normalizeText(messageText(message, autocomplete.field)).slice(0, 140);
  }

  function closeAutocomplete() {
    autocomplete.popup?.remove();
    autocomplete.field = null;
    autocomplete.popup = null;
    autocomplete.mode = "categories";
    autocomplete.categories = [];
    autocomplete.category = "";
    autocomplete.messages = [];
    autocomplete.index = 0;
  }

  function positionAutocomplete() {
    if (!autocomplete.popup || !autocomplete.field) {
      return;
    }
    const rect = autocomplete.field.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom;
    autocomplete.popup.style.left = `${Math.max(8, rect.left)}px`;
    autocomplete.popup.style.width = `${Math.max(320, Math.min(rect.width, 620))}px`;
    if (availableBelow >= 260) {
      autocomplete.popup.style.top = `${rect.bottom + 6}px`;
      autocomplete.popup.style.bottom = "auto";
    } else {
      autocomplete.popup.style.top = "auto";
      autocomplete.popup.style.bottom = `${window.innerHeight - rect.top + 6}px`;
    }
  }

  function refreshSelection() {
    autocomplete.popup?.querySelectorAll("[data-way-matrix-selectable]").forEach((item, index) => {
      item.classList.toggle("active", index === autocomplete.index);
    });
    autocomplete.popup?.querySelector(".active")?.scrollIntoView({ block: "nearest" });
  }

  function showCategories(field) {
    const categories = getCategories();
    if (!categories.length) {
      closeAutocomplete();
      return;
    }

    closeAutocomplete();
    const popup = document.createElement("div");
    popup.id = AUTOCOMPLETE_ID;
    popup.innerHTML = `
      <div class="way-matrix-ac-header">
        <strong>💬 Mensagens Personalizadas</strong>
        <span>${categories.length} ${categories.length === 1 ? "categoria" : "categorias"}</span>
      </div>
      <div class="way-matrix-ac-list way-matrix-ac-categories"></div>
      <div class="way-matrix-ac-footer">↑ ↓ navegar · Enter abrir · Esc fechar</div>
    `;
    autocomplete.field = field;
    autocomplete.popup = popup;
    autocomplete.mode = "categories";
    autocomplete.categories = categories;
    autocomplete.category = "";
    autocomplete.messages = [];
    autocomplete.index = 0;

    const list = popup.querySelector(".way-matrix-ac-list");
    categories.forEach((category, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.dataset.wayMatrixSelectable = "category";
      item.className = `way-matrix-ac-category${index === 0 ? " active" : ""}`;
      const commands = category.commands.slice(0, 5).map((message) => `!${message.comando}`).join(" · ");
      item.innerHTML = `
        <span><strong>${escapeHtml(category.label)}</strong><small>${escapeHtml(commands)}</small></span>
        <em>${category.commands.length}</em>
      `;
      item.addEventListener("mouseenter", () => {
        autocomplete.index = index;
        refreshSelection();
      });
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCategory(category.id, field);
      });
      list.appendChild(item);
    });

    document.body.appendChild(popup);
    positionAutocomplete();
  }

  function showCommands(field, matches, options = {}) {
    if (!matches.length) {
      closeAutocomplete();
      return;
    }

    const mode = options.mode || "search";
    const category = options.category || "";
    closeAutocomplete();
    const popup = document.createElement("div");
    popup.id = AUTOCOMPLETE_ID;
    autocomplete.field = field;
    autocomplete.popup = popup;
    autocomplete.mode = mode;
    autocomplete.categories = [];
    autocomplete.category = category;
    autocomplete.messages = matches;
    autocomplete.index = 0;
    const title = mode === "category"
      ? categoryLabel(category)
      : `Way Tools — !${escapeHtml(options.query || "")}`;
    const backButton = mode === "category"
      ? '<button type="button" class="way-matrix-ac-back">← Categorias</button>'
      : "";
    popup.innerHTML = `
      <div class="way-matrix-ac-header">
        <div>${backButton}<strong>${title}</strong></div>
        <span>${matches.length} ${matches.length === 1 ? "comando" : "comandos"}</span>
      </div>
      <div class="way-matrix-ac-list"></div>
      <div class="way-matrix-ac-footer">↑ ↓ navegar · Enter inserir sem enviar · Esc ${mode === "category" ? "voltar" : "fechar"}</div>
    `;
    popup.querySelector(".way-matrix-ac-back")?.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showCategories(field);
    });
    const list = popup.querySelector(".way-matrix-ac-list");
    matches.forEach((message, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.dataset.wayMatrixCommand = message.id;
      item.dataset.wayMatrixSelectable = "command";
      item.className = index === 0 ? "active" : "";
      item.innerHTML = `
        <strong>!${escapeHtml(message.comando)}</strong>
        <span>${escapeHtml(preview(message))}</span>
        <small>${escapeHtml(categoryLabel(message.categoria))}</small>
      `;
      item.addEventListener("mouseenter", () => {
        autocomplete.index = index;
        refreshSelection();
      });
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        executeMessage(message, field);
      });
      list.appendChild(item);
    });
    document.body.appendChild(popup);
    positionAutocomplete();
  }

  function openCategory(category, field) {
    showCommands(field, getCategoryMessages(category), {
      mode: "category",
      category
    });
  }

  function showAutocomplete(field) {
    const query = getQuery(field);
    if (query === null) {
      closeAutocomplete();
      return;
    }
    if (query === "") {
      showCategories(field);
      return;
    }
    showCommands(field, getMatches(query), { mode: "search", query });
  }

  function selectCurrentAutocompleteItem() {
    if (autocomplete.mode === "categories") {
      const category = autocomplete.categories[autocomplete.index];
      if (!category) {
        return;
      }
      openCategory(category.id, autocomplete.field);
      return;
    }

    const message = autocomplete.messages[autocomplete.index];
    if (message) {
      executeMessage(message, autocomplete.field);
    }
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
    const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(year, month - 1, day);
    const days = Math.round((target - today) / 86400000);
    return `${days === 0 ? "**HOJE**, " : days === 1 ? "**AMANHÃ**, " : ""}**${label}**`;
  }

  function todayInput() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function openSpecialModal(innerHtml, onConfirm) {
    document.getElementById(SPECIAL_ROOT_ID)?.remove();
    const root = document.createElement("div");
    root.id = SPECIAL_ROOT_ID;
    root.innerHTML = `<div class="way-matrix-overlay"><section class="way-matrix-special">${innerHtml}</section></div>`;
    document.body.appendChild(root);
    root.querySelectorAll("[data-way-close]").forEach((button) => {
      button.addEventListener("click", () => root.remove());
    });
    root.querySelector("[data-way-confirm]")?.addEventListener("click", () => onConfirm(root));
    root.querySelector(".way-matrix-overlay")?.addEventListener("mousedown", (event) => {
      if (event.target === event.currentTarget) {
        root.remove();
      }
    });
    return root;
  }

  function openAvailability(field) {
    const periods = {
      manha: { name: "manhã", start: "08", end: "12" },
      tarde: { name: "tarde", start: "13", end: "17" },
      noite: { name: "noite", start: "18", end: "20" }
    };
    openSpecialModal(`
      <header><h2>📅 Disponibilidade</h2><button type="button" data-way-close>×</button></header>
      <label>Data<input type="date" name="date" value="${todayInput()}"></label>
      <fieldset><legend>Períodos disponíveis</legend>
        <label><input type="checkbox" name="period" value="manha" checked> Manhã — 08 às 12</label>
        <label><input type="checkbox" name="period" value="tarde"> Tarde — 13 às 17</label>
        <label><input type="checkbox" name="period" value="noite"> Noite — 18 às 20</label>
      </fieldset>
      <footer><button type="button" data-way-close>Cancelar</button><button type="button" class="primary" data-way-confirm>Inserir mensagem</button></footer>
    `, (root) => {
      const date = root.querySelector('[name="date"]').value;
      const selected = [...root.querySelectorAll('[name="period"]:checked')].map((input) => periods[input.value]);
      if (!date || !selected.length) {
        window.alert("Selecione a data e pelo menos um período.");
        return;
      }
      const pieces = selected.map((period) => `da **${period.name}**, das **${period.start} às ${period.end}**`);
      const list = pieces.length === 1
        ? `no período ${pieces[0]}`
        : `nos períodos ${pieces.slice(0, -1).join(", ")}, ou ${pieces.at(-1)}`;
      const question = selected.length === 1
        ? "Esse período seria conveniente para você?"
        : "Qual desses períodos seria mais conveniente para você?";
      setFieldText(field, `Temos disponibilidade para atendimento ${formatDate(date)} ${list}. 😊 ${question}\n\nA previsão para realização do atendimento é dentro do período informado, não sendo possível definir um horário específico.`);
      root.remove();
    });
  }

  function openVisit(field, message) {
    const data = getClientData(field);
    openSpecialModal(`
      <header><h2>🛠 Visita técnica</h2><button type="button" data-way-close>×</button></header>
      <div class="way-matrix-grid">
        <label>Nome do cliente<input name="nomecliente" value="${escapeHtml(data.nomecliente)}"></label>
        <label>Telefone<input name="telefone" value="${escapeHtml(data.telefone)}"></label>
        <label>Endereço<input name="endereco" value="${escapeHtml(data.endereco)}"></label>
        <label>Protocolo<input name="protocolo" value="${escapeHtml(data.protocolo)}"></label>
        <label>Data<input type="date" name="data" value="${todayInput()}"></label>
        <label>Período<select name="periodo"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label>
        <label class="wide">Previsão de atendimento<input name="horario" placeholder="Ex.: das 08 às 12"></label>
      </div>
      <footer><button type="button" data-way-close>Cancelar</button><button type="button" class="primary" data-way-confirm>Inserir mensagem</button></footer>
    `, (root) => {
      const values = Object.fromEntries(
        [...root.querySelectorAll("input[name], select[name]")].map((input) => [input.name, input.value])
      );
      values.data = formatDate(values.data).replace(/^\*\*(HOJE|AMANHÃ)\*\*,\s*/, "").replace(/^\*\*|\*\*$/g, "");
      const template = message.templateVisita || "";
      setFieldText(field, applyTags(template, field, values));
      root.remove();
    });
  }

  function executeMessage(message, field) {
    closeAutocomplete();
    if (message.tipo === "disponibilidade") {
      setFieldText(field, "");
      openAvailability(field);
      return;
    }
    if (message.tipo === "visita") {
      setFieldText(field, "");
      openVisit(field, message);
      return;
    }
    setFieldText(field, messageText(message, field));
  }

  function onInput(event) {
    const field = event.target?.closest?.(FIELD_SELECTOR);
    if (field) {
      showAutocomplete(field);
    }
  }

  function onKeydown(event) {
    if (!autocomplete.popup || event.target !== autocomplete.field) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      const total = autocomplete.mode === "categories"
        ? autocomplete.categories.length
        : autocomplete.messages.length;
      if (!total) {
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      autocomplete.index = (autocomplete.index + direction + total) % total;
      refreshSelection();
      return;
    }
    if (event.key === "ArrowRight" && autocomplete.mode === "categories") {
      event.preventDefault();
      event.stopPropagation();
      selectCurrentAutocompleteItem();
      return;
    }
    if (event.key === "ArrowLeft" && autocomplete.mode === "category") {
      event.preventDefault();
      event.stopPropagation();
      showCategories(autocomplete.field);
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.key === "Enter") {
        blockedCommandEnter.set(event.target, Date.now() + 1000);
      }
      selectCurrentAutocompleteItem();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (autocomplete.mode === "category") {
        showCategories(autocomplete.field);
      } else {
        closeAutocomplete();
      }
    }
  }

  function blockCommandEnterContinuation(event) {
    if (event.key !== "Enter") {
      return;
    }

    const field = event.target?.closest?.(FIELD_SELECTOR);
    const blockedUntil = field ? blockedCommandEnter.get(field) : 0;
    if (!blockedUntil) {
      return;
    }

    if (blockedUntil < Date.now()) {
      blockedCommandEnter.delete(field);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.type === "keyup") {
      blockedCommandEnter.delete(field);
    }
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({
      aplicativo: "Way Tools - Mensagens Personalizadas",
      versaoBackup: 1,
      exportadoEm: new Date().toISOString(),
      mensagens: messages
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `way-tools-mensagens-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openConfig(field) {
    refreshOpenConfig = null;
    document.getElementById(CONFIG_ROOT_ID)?.remove();
    const data = getClientData(field);
    const root = document.createElement("div");
    root.id = CONFIG_ROOT_ID;
    root.innerHTML = `
      <div class="way-matrix-overlay">
        <section class="way-matrix-config">
          <header>
            <div><h2>💬 Mensagens Personalizadas — Matrix</h2><p>Catálogo compartilhado com o ChatWoot: alterações feitas aqui ficam disponíveis nos dois sistemas.</p></div>
            <button type="button" data-way-close>×</button>
          </header>
          <div class="way-matrix-detected">
            <span><strong>{{nome}}</strong> ${escapeHtml(data.nome || "Não identificado")}</span>
            <span><strong>{{nomecliente}}</strong> ${escapeHtml(data.nomecliente || "Não identificado")}</span>
            <span><strong>{{telefone}}</strong> ${escapeHtml(data.telefone || "Não identificado")}</span>
            <span><strong>{{email}}</strong> ${escapeHtml(data.email || "Não identificado")}</span>
            <span><strong>{{cpf}}</strong> ${escapeHtml(data.cpf || "Não identificado")}</span>
            <span><strong>{{endereco}}</strong> ${escapeHtml(data.endereco || "Não identificado")}</span>
            <span><strong>{{protocolo}}</strong> ${escapeHtml(data.protocolo || "Não identificado")}</span>
          </div>
          <div class="way-matrix-config-actions">
            <button type="button" data-way-new>+ Nova mensagem</button>
            <button type="button" data-way-export>Exportar JSON</button>
            <label class="button">Importar JSON<input type="file" accept="application/json" data-way-import hidden></label>
            <button type="button" class="danger-text" data-way-restore>Restaurar padrões</button>
          </div>
          <div class="way-matrix-config-body">
            <aside data-way-list></aside>
            <form data-way-form>
              <input type="hidden" name="id">
              <div class="way-matrix-grid">
                <label>Comando<input name="comando" required placeholder="ex.: bomdia"></label>
                <label>Categoria<input name="categoria" required placeholder="ex.: abertura"></label>
                <label>Tipo<select name="tipo"><option value="texto">Mensagem de texto</option><option value="disponibilidade">Agenda</option><option value="visita">Visita técnica</option></select></label>
                <label class="checkbox"><input type="checkbox" name="variacaoHorario"> Variar conforme manhã, tarde e noite</label>
              </div>
              <label>Mensagem<textarea name="mensagem" rows="7"></textarea></label>
              <div class="way-matrix-grid way-matrix-periods">
                <label>Manhã<textarea name="manha" rows="5"></textarea></label>
                <label>Tarde<textarea name="tarde" rows="5"></textarea></label>
                <label>Noite<textarea name="noite" rows="5"></textarea></label>
              </div>
              <label>Template da visita<textarea name="templateVisita" rows="9"></textarea></label>
              <footer><button type="button" class="danger" data-way-delete>Excluir</button><button type="submit" class="primary">Salvar mensagem</button></footer>
            </form>
          </div>
        </section>
      </div>
    `;
    document.body.appendChild(root);
    const form = root.querySelector("[data-way-form]");
    const list = root.querySelector("[data-way-list]");
    let formDirty = false;

    function fillForm(message = {}) {
      form.elements.id.value = message.id || "";
      form.elements.comando.value = message.comando || "";
      form.elements.categoria.value = message.categoria || "geral";
      form.elements.tipo.value = message.tipo || "texto";
      form.elements.variacaoHorario.checked = message.variacaoHorario === true;
      for (const name of ["mensagem", "manha", "tarde", "noite", "templateVisita"]) {
        form.elements[name].value = message[name] || "";
      }
      form.querySelector("[data-way-delete]").disabled = !message.id;
      formDirty = false;
    }

    function renderList(selectedId = "") {
      list.replaceChildren();
      [...messages].sort((a, b) => a.comando.localeCompare(b.comando, "pt-BR")).forEach((message) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = message.id === selectedId ? "active" : "";
        button.innerHTML = `<strong>!${escapeHtml(message.comando)}</strong><span>${escapeHtml(message.categoria)}</span>`;
        button.addEventListener("click", () => {
          fillForm(message);
          renderList(message.id);
        });
        list.appendChild(button);
      });
    }

    refreshOpenConfig = () => {
      if (!root.isConnected) {
        refreshOpenConfig = null;
        return;
      }

      const selectedId = form.elements.id.value;
      const selectedMessage = messages.find((message) => message.id === selectedId);
      renderList(selectedMessage?.id || "");

      if (selectedId && !selectedMessage) {
        fillForm();
      } else if (selectedMessage && !formDirty) {
        fillForm(selectedMessage);
      }
    };

    root.querySelectorAll("[data-way-close]").forEach((button) => button.addEventListener("click", () => {
      refreshOpenConfig = null;
      root.remove();
    }));
    root.querySelector("[data-way-new]").addEventListener("click", () => {
      fillForm();
      renderList();
      form.elements.comando.focus();
    });
    form.addEventListener("input", () => {
      formDirty = true;
    });
    form.addEventListener("change", () => {
      formDirty = true;
    });
    root.querySelector("[data-way-export]").addEventListener("click", downloadBackup);
    root.querySelector("[data-way-import]").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      try {
        const parsed = JSON.parse(await file.text());
        const imported = validMessages(parsed.mensagens || parsed);
        if (!imported.length) {
          throw new Error("Nenhuma mensagem válida encontrada.");
        }
        saveMessages(imported);
        fillForm();
        renderList();
      } catch (error) {
        window.alert(`Não foi possível importar: ${error.message}`);
      }
      event.target.value = "";
    });
    root.querySelector("[data-way-restore]").addEventListener("click", () => {
      if (window.confirm("Restaurar todas as mensagens nativas do Way Tools?")) {
        saveMessages(clone(nativeMessages));
        fillForm();
        renderList();
      }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      values.variacaoHorario = form.elements.variacaoHorario.checked;
      const normalized = normalizeMessage(values);
      normalized.id = values.id || normalized.id;
      if (!normalized.comando) {
        window.alert("Informe um comando válido.");
        return;
      }
      if (messages.some((item) => item.comando === normalized.comando && item.id !== normalized.id)) {
        window.alert(`O comando !${normalized.comando} já existe.`);
        return;
      }
      const index = messages.findIndex((item) => item.id === normalized.id);
      const next = [...messages];
      if (index >= 0) {
        next[index] = normalized;
      } else {
        next.push(normalized);
      }
      saveMessages(next);
      fillForm(normalized);
      renderList(normalized.id);
    });
    form.querySelector("[data-way-delete]").addEventListener("click", () => {
      const id = form.elements.id.value;
      if (id && window.confirm("Excluir esta mensagem?")) {
        saveMessages(messages.filter((message) => message.id !== id));
        fillForm();
        renderList();
      }
    });
    renderList();
    fillForm(messages[0]);
    if (messages[0]) {
      renderList(messages[0].id);
    }
  }

  function configureToolbar(toolbar) {
    if (!toolbar || toolbar.querySelector(`.${BUTTON_CLASS}`)) {
      return;
    }
    const button = document.createElement("a");
    button.href = "#";
    button.className = `btn btn-circle btn-xlarge btn-primary ${BUTTON_CLASS}`;
    button.title = "Way Tools — Mensagens personalizadas";
    button.innerHTML = `<img src="${escapeHtml(chrome.runtime.getURL("128.png"))}" alt="Way Tools">`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openConfig(findFieldFromToolbar(toolbar));
    });
    toolbar.appendChild(button);
  }

  function configureAll() {
    document.querySelectorAll(TOOLBAR_SELECTOR).forEach(configureToolbar);
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${BUTTON_CLASS} img{width:24px;height:24px;border-radius:6px;display:block;margin:auto}
      #${AUTOCOMPLETE_ID}{position:fixed;z-index:2147483646;background:#0b1f3a;color:#f8fafc;border:1px solid #2c5480;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.38);overflow:hidden;font:13px/1.35 Arial,sans-serif}
      #${AUTOCOMPLETE_ID} .way-matrix-ac-header,#${AUTOCOMPLETE_ID} .way-matrix-ac-footer{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:#07172b;color:#b9d6f5}
      #${AUTOCOMPLETE_ID} .way-matrix-ac-header>div{display:flex;align-items:center;gap:9px}#${AUTOCOMPLETE_ID} .way-matrix-ac-back{border:1px solid #365b7e;border-radius:6px;background:#12395f;color:#d9ecff;padding:4px 8px;cursor:pointer}
      #${AUTOCOMPLETE_ID} .way-matrix-ac-list{max-height:330px;overflow:auto;padding:6px}
      #${AUTOCOMPLETE_ID} [data-way-matrix-command]{display:grid;grid-template-columns:130px 1fr auto;gap:10px;align-items:center;width:100%;padding:10px;border:0;border-radius:8px;background:transparent;color:#fff;text-align:left}
      #${AUTOCOMPLETE_ID} [data-way-matrix-selectable]:hover,#${AUTOCOMPLETE_ID} [data-way-matrix-selectable].active{background:#164575}
      #${AUTOCOMPLETE_ID} [data-way-matrix-command]>strong{color:#72c8ff}#${AUTOCOMPLETE_ID} [data-way-matrix-command]>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#${AUTOCOMPLETE_ID} small{color:#9fb8d0;text-transform:capitalize}
      #${AUTOCOMPLETE_ID} .way-matrix-ac-category{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px;border:0;border-radius:8px;background:transparent;color:#fff;text-align:left}#${AUTOCOMPLETE_ID} .way-matrix-ac-category>span{display:flex;flex-direction:column;min-width:0;gap:3px}#${AUTOCOMPLETE_ID} .way-matrix-ac-category strong{color:#f8fafc}#${AUTOCOMPLETE_ID} .way-matrix-ac-category small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:none}#${AUTOCOMPLETE_ID} .way-matrix-ac-category em{display:grid;place-items:center;min-width:25px;height:25px;border-radius:999px;background:#087bd5;color:#fff;font-style:normal;font-weight:700}
      .way-matrix-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(1,8,18,.74);display:flex;align-items:center;justify-content:center;padding:18px;font:14px/1.45 Arial,sans-serif}
      .way-matrix-config,.way-matrix-special{width:min(1180px,96vw);max-height:94vh;overflow:auto;background:#0b1f3a;color:#eaf4ff;border:1px solid #2c5480;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
      .way-matrix-special{width:min(700px,96vw);padding-bottom:16px}.way-matrix-config>header,.way-matrix-special>header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:18px 20px;border-bottom:1px solid #294b70}.way-matrix-config h2,.way-matrix-special h2{margin:0}.way-matrix-config p{margin:4px 0 0;color:#aecaeb}
      .way-matrix-config header button,.way-matrix-special header button{font-size:28px;background:none;border:0;color:#fff}.way-matrix-detected{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;padding:12px 20px;background:#0e2a4b}.way-matrix-detected span{background:#08182b;padding:8px;border-radius:8px}.way-matrix-detected strong{display:block;color:#65c6ff}
      .way-matrix-config-actions{display:flex;flex-wrap:wrap;gap:8px;padding:12px 20px}.way-matrix-config button,.way-matrix-config .button,.way-matrix-special button{border:1px solid #41688f;border-radius:8px;background:#153e68;color:#fff;padding:9px 13px;cursor:pointer}.way-matrix-config .danger-text{color:#ff8da1}.way-matrix-config .primary,.way-matrix-special .primary{background:#087bd5;border-color:#249ae9}.way-matrix-config .danger{background:#7a1730;border-color:#b12b4b}
      .way-matrix-config-body{display:grid;grid-template-columns:260px 1fr;min-height:500px;border-top:1px solid #294b70}.way-matrix-config aside{padding:10px;border-right:1px solid #294b70;overflow:auto}.way-matrix-config aside button{display:flex;justify-content:space-between;width:100%;margin-bottom:5px;background:transparent}.way-matrix-config aside button.active{background:#164f82}.way-matrix-config aside span{color:#aecaeb;text-transform:capitalize}
      .way-matrix-config form,.way-matrix-special{padding:18px}.way-matrix-config form>label,.way-matrix-grid label,.way-matrix-special>label{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;color:#bcd3ea}.way-matrix-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.way-matrix-grid .wide{grid-column:1/-1}.way-matrix-grid .checkbox{flex-direction:row;align-items:center;margin-top:28px}.way-matrix-config input,.way-matrix-config select,.way-matrix-config textarea,.way-matrix-special input,.way-matrix-special select{width:100%;box-sizing:border-box;background:#071524;color:#fff;border:1px solid #365b7e;border-radius:8px;padding:9px;resize:vertical}.way-matrix-config footer,.way-matrix-special footer{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}.way-matrix-periods{grid-template-columns:repeat(3,minmax(0,1fr))}.way-matrix-special fieldset{border:1px solid #365b7e;border-radius:10px;margin:12px 0;padding:12px}.way-matrix-special fieldset label{display:block;margin:8px 0}.way-matrix-special fieldset input{width:auto;margin-right:8px}
      @media(max-width:760px){.way-matrix-config-body{grid-template-columns:1fr}.way-matrix-config aside{max-height:180px;border-right:0;border-bottom:1px solid #294b70}.way-matrix-grid,.way-matrix-periods{grid-template-columns:1fr}}
    `;
    document.documentElement.appendChild(style);
  }

  function init() {
    addStyles();
    configureAll();
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKeydown, true);
    document.addEventListener("keypress", blockCommandEnterContinuation, true);
    document.addEventListener("keyup", blockCommandEnterContinuation, true);
    document.addEventListener("mousedown", (event) => {
      if (autocomplete.popup && !autocomplete.popup.contains(event.target) && event.target !== autocomplete.field) {
        closeAutocomplete();
      }
    }, true);
    window.addEventListener("resize", positionAutocomplete);
    window.addEventListener("scroll", positionAutocomplete, true);
    new MutationObserver(configureAll).observe(document.documentElement, { childList: true, subtree: true });
    console.info("[Way Matrix Mensagens] v1.0 ativa no modelo clássico.");
  }

  if (document.documentElement) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  }
});
