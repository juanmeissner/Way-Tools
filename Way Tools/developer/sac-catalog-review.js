(() => {
  "use strict";

  const STORAGE_KEY = "wayTools.developer.messageCatalogDraft.v1";
  const PROFILES = ["sac", "n2"];
  const TAGS = ["nome", "nomecliente", "email", "telefone", "cpf", "endereco", "protocolo", "data", "periodo", "horario"];
  const TAG_SAMPLES = Object.freeze({
    nome: "Ana",
    nomecliente: "Cliente de Teste",
    email: "cliente@exemplo.com",
    telefone: "(14) 99999-9999",
    cpf: "000.000.000-00",
    endereco: "Rua de Exemplo, 123",
    protocolo: "2580000000000000",
    data: "10/10/2026",
    periodo: "Tarde",
    horario: "13:00 às 18:00"
  });
  const STATUS_LABELS = Object.freeze({
    planejado: "PLANEJADO",
    aguardando_aprovacao: "AGUARDANDO APROVAÇÃO",
    aprovado: "APROVADO"
  });

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    saveDraft: $("#save-draft"),
    importJson: $("#import-json"),
    importFile: $("#import-file"),
    copyJson: $("#copy-json"),
    downloadDraft: $("#download-draft"),
    resetDraft: $("#reset-draft"),
    profileButtons: [...document.querySelectorAll("[data-profile]")],
    profileVersion: $("#profile-version"),
    profileVersionBadge: $("#profile-version-badge"),
    categorySearch: $("#category-search"),
    categoryList: $("#category-list"),
    categoryCount: $("#category-count"),
    messageCount: $("#message-count"),
    catalogAudit: $("#catalog-audit"),
    addCategory: $("#add-category"),
    moveCategoryUp: $("#move-category-up"),
    moveCategoryDown: $("#move-category-down"),
    editCategory: $("#edit-category"),
    addMessage: $("#add-message"),
    workspaceTitle: $("#workspace-title"),
    workspaceDescription: $("#workspace-description"),
    messageSearch: $("#message-search"),
    firstPackageOnly: $("#first-package-only"),
    messageList: $("#message-list"),
    emptyState: $("#empty-state"),
    previewTitle: $("#preview-title"),
    previewMeta: $("#preview-meta"),
    previewWarning: $("#preview-warning"),
    previewContent: $("#preview-content"),
    previewPeriods: $("#preview-periods"),
    availableTags: $("#available-tags"),
    studioStatus: $("#studio-status"),
    categoryDialog: $("#category-dialog"),
    categoryForm: $("#category-form"),
    categoryDialogTitle: $("#category-dialog-title"),
    categoryOriginalId: $("#category-original-id"),
    categoryId: $("#category-id"),
    categoryLabel: $("#category-label"),
    categoryOrder: $("#category-order"),
    categorySectorSac: $("#category-sector-sac"),
    categorySectorN2: $("#category-sector-n2"),
    categoryError: $("#category-error"),
    deleteCategory: $("#delete-category"),
    messageDialog: $("#message-dialog"),
    messageForm: $("#message-form"),
    messageDialogTitle: $("#message-dialog-title"),
    messageOriginalId: $("#message-original-id"),
    messageId: $("#message-id"),
    messageCommand: $("#message-command"),
    messageCategory: $("#message-category"),
    messageType: $("#message-type"),
    messageTitle: $("#message-title"),
    messageSynonyms: $("#message-synonyms"),
    messageKeywords: $("#message-keywords"),
    messageStatus: $("#message-status"),
    messageFirstPackage: $("#message-first-package"),
    textOptions: $("#text-options"),
    messageTimeVariant: $("#message-time-variant"),
    normalMessageField: $("#normal-message-field"),
    timeMessageFields: $("#time-message-fields"),
    messageText: $("#message-text"),
    messageMorning: $("#message-morning"),
    messageAfternoon: $("#message-afternoon"),
    messageNight: $("#message-night"),
    availabilityOptions: $("#availability-options"),
    visitOptions: $("#visit-options"),
    messageVisitTemplate: $("#message-visit-template"),
    imageOptions: $("#image-options"),
    messageImageFile: $("#message-image-file"),
    editorTags: $("#editor-tags"),
    editorPreviewWarning: $("#editor-preview-warning"),
    editorPreviewContent: $("#editor-preview-content"),
    messageError: $("#message-error"),
    deleteMessage: $("#delete-message"),
    duplicateMessage: $("#duplicate-message")
  };

  let catalog = null;
  let baselineCatalog = null;
  let activeProfile = "sac";
  let activeCategoryId = "";
  let selectedMessageId = "";
  let lastFocusedTextArea = null;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function normalizeSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeId(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeCommand(value) {
    return normalizeId(String(value || "").replace(/^!+/, "")).replace(/-/g, "");
  }

  function normalizeList(value) {
    return [...new Set(String(value || "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
  }

  function createMessageId(command) {
    const prefix = activeProfile === "sac" ? "sac" : "n2";
    const base = normalizeId(command) || "mensagem";
    const known = new Set(PROFILES.flatMap((profile) => profileMessages(profile).map((message) => message.id)));
    let id = `${prefix}-${base}`;
    let suffix = 2;
    while (known.has(id)) id = `${prefix}-${base}-${suffix++}`;
    return id;
  }

  function profileData(profile = activeProfile) {
    return catalog.perfis[profile];
  }

  function profileMessages(profile = activeProfile) {
    return Array.isArray(catalog?.perfis?.[profile]?.mensagens) ? catalog.perfis[profile].mensagens : [];
  }

  function categoriesForProfile(profile = activeProfile) {
    return [...catalog.categorias]
      .filter((category) => category.setores.includes(profile))
      .sort((left, right) => Number(left.ordem || 0) - Number(right.ordem || 0));
  }

  function currentCategory() {
    return catalog.categorias.find((category) => category.id === activeCategoryId) || null;
  }

  function selectedMessage() {
    return profileMessages().find((message) => message.id === selectedMessageId) || null;
  }

  function messageText(message, period = "mensagem") {
    if (!message) return "";
    if (message.tipo === "disponibilidade") return "A agenda de disponibilidade será aberta.";
    if (message.tipo === "visita") return message.templateVisita || "";
    if (message.tipo === "imagem") return `A imagem ${message.arquivoImagem || "PNG configurada"} será anexada ao atendimento.`;
    if (message.variacaoHorario) return message[period] || "";
    return message.mensagem || "";
  }

  function replaceTags(value) {
    return String(value || "").replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, tag) => TAG_SAMPLES[tag] || match);
  }

  function unresolvedTags(value) {
    return [...new Set([...String(value || "").matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)]
      .map((match) => match[1]).filter((tag) => !TAGS.includes(tag)))];
  }

  function setStatus(message, tone = "success") {
    elements.studioStatus.textContent = message;
    elements.studioStatus.dataset.tone = tone;
  }

  function showError(element, message) {
    element.textContent = message || "";
    element.hidden = !message;
  }

  function updateQuantities(target = catalog) {
    for (const profile of PROFILES) {
      target.perfis[profile].quantidade = target.perfis[profile].mensagens.length;
    }
  }

  async function persistDraft(message = "Rascunho salvo neste navegador.") {
    updateQuantities();
    catalog.metadadosDesenvolvimento = {
      ...(catalog.metadadosDesenvolvimento || {}),
      schemaVersion: 1,
      atualizadoEm: new Date().toISOString()
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: clone(catalog) });
    setStatus(message);
  }

  function isNativeCatalog(value) {
    return value && value.schemaVersion === 2 && Array.isArray(value.categorias) && value.perfis?.n2 && value.perfis?.sac;
  }

  function draftCommandToMessage(command) {
    const timeVariant = command.type === "time_variant";
    return {
      id: createUniqueDraftId(`sac-${normalizeId(command.command) || "mensagem"}`),
      comando: normalizeCommand(command.command),
      categoria: String(command.targetCategory || "").trim(),
      tipo: "texto",
      sinonimos: Array.isArray(command.aliases) ? command.aliases : [],
      palavrasChave: Array.isArray(command.keywords) ? command.keywords : [],
      variacaoHorario: timeVariant,
      mensagem: timeVariant ? "" : String(command.text || ""),
      manha: timeVariant ? String(command.morning || "") : "",
      tarde: timeVariant ? String(command.afternoon || "") : "",
      noite: timeVariant ? String(command.night || "") : "",
      templateVisita: "",
      titulo: String(command.title || ""),
      statusProposta: String(command.status || "planejado"),
      primeiroPacote: command.firstPackage === true
    };
  }

  const draftIds = new Set();
  function createUniqueDraftId(base) {
    let id = base;
    let suffix = 2;
    while (draftIds.has(id)) id = `${base}-${suffix++}`;
    draftIds.add(id);
    return id;
  }

  function mergeLegacySacDraft(nativeCatalog, sacDraft) {
    const merged = clone(nativeCatalog);
    draftIds.clear();
    PROFILES.flatMap((profile) => merged.perfis[profile].mensagens).forEach((message) => draftIds.add(message.id));
    if (merged.perfis.sac.mensagens.length === 0 && Array.isArray(sacDraft?.categories)) {
      merged.perfis.sac.mensagens = sacDraft.categories
        .flatMap((category) => Array.isArray(category.commands) ? category.commands : [])
        .map(draftCommandToMessage)
        .filter((message) => message.comando && merged.categorias.some((category) =>
          category.id === message.categoria && category.setores.includes("sac")
        ));
      merged.perfis.sac.quantidade = merged.perfis.sac.mensagens.length;
    }
    merged.metadadosDesenvolvimento = {
      schemaVersion: 1,
      origem: "catalogo-nativo-e-proposta-sac",
      aviso: sacDraft?.notice || "Proposta sujeita à aprovação interna."
    };
    return merged;
  }

  function normalizeImportedCatalog(value) {
    if (!isNativeCatalog(value)) {
      if (Array.isArray(value?.categories) && value.categories.some((category) => Array.isArray(category.commands))) {
        return mergeLegacySacDraft(baselineCatalog, value);
      }
      throw new Error("O arquivo não contém categorias e perfis N2/SAC compatíveis.");
    }
    const normalized = clone(value);
    normalized.categorias = normalized.categorias
      .filter((category) => category && typeof category === "object")
      .map((category, index) => ({
        id: normalizeId(category.id),
        label: String(category.label || "").trim(),
        ordem: Number.isFinite(Number(category.ordem)) ? Number(category.ordem) : (index + 1) * 10,
        setores: [...new Set((Array.isArray(category.setores) ? category.setores : []).filter((sector) => PROFILES.includes(sector)))]
      }));
    for (const profile of PROFILES) {
      const source = normalized.perfis[profile] || {};
      normalized.perfis[profile] = {
        versaoCatalogo: Math.max(1, Number.parseInt(source.versaoCatalogo, 10) || 1),
        idsNativosLegados: Array.isArray(source.idsNativosLegados) ? source.idsNativosLegados.map(String) : [],
        quantidade: 0,
        mensagens: (Array.isArray(source.mensagens) ? source.mensagens : []).map((message) => ({
          ...message,
          id: String(message.id || "").trim(),
          comando: normalizeCommand(message.comando),
          categoria: String(message.categoria || "").trim(),
          tipo: ["texto", "disponibilidade", "visita", "imagem"].includes(message.tipo) ? message.tipo : "texto",
          sinonimos: Array.isArray(message.sinonimos) ? message.sinonimos : [],
          palavrasChave: Array.isArray(message.palavrasChave) ? message.palavrasChave : [],
          variacaoHorario: message.variacaoHorario === true,
          mensagem: String(message.mensagem || ""),
          manha: String(message.manha || ""),
          tarde: String(message.tarde || ""),
          noite: String(message.noite || ""),
          templateVisita: String(message.templateVisita || ""),
          arquivoImagem: String(message.arquivoImagem || "").trim().replace(/^\/+/, "")
        }))
      };
    }
    updateQuantities(normalized);
    return normalized;
  }

  function auditCatalog() {
    const errors = [];
    const warnings = [];
    const categoryIds = new Set();
    for (const category of catalog.categorias) {
      if (!category.id || !category.label) errors.push("Existe uma categoria sem ID ou nome.");
      if (categoryIds.has(category.id)) errors.push(`Categoria duplicada: ${category.id}.`);
      if (!category.setores.length) errors.push(`A categoria ${category.id || "sem ID"} não pertence a nenhum perfil.`);
      categoryIds.add(category.id);
    }
    for (const profile of PROFILES) {
      const ids = new Set();
      const commands = new Set();
      for (const message of profileMessages(profile)) {
        if (!message.id || ids.has(message.id)) errors.push(`${profile.toUpperCase()}: ID inválido ou duplicado em ${message.id || "mensagem sem ID"}.`);
        if (!message.comando || commands.has(message.comando)) errors.push(`${profile.toUpperCase()}: comando inválido ou duplicado !${message.comando || "?"}.`);
        const category = catalog.categorias.find((item) => item.id === message.categoria);
        if (!category || !category.setores.includes(profile)) errors.push(`${profile.toUpperCase()}: !${message.comando} usa uma categoria indisponível.`);
        if (message.tipo === "imagem" && !/^assets\/mensagens\/[a-z0-9_-]+\.png$/.test(message.arquivoImagem || "")) {
          errors.push(`${profile.toUpperCase()}: !${message.comando} não possui um caminho PNG válido.`);
        }
        const texts = message.variacaoHorario
          ? [message.manha, message.tarde, message.noite]
          : [message.tipo === "visita" ? message.templateVisita : message.mensagem];
        if (!["disponibilidade", "imagem"].includes(message.tipo) && texts.some((text) => !String(text || "").trim())) {
          warnings.push(`${profile.toUpperCase()}: !${message.comando} ainda possui texto pendente.`);
        }
        ids.add(message.id);
        commands.add(message.comando);
      }
    }
    return { errors, warnings };
  }

  function renderAudit() {
    const { errors, warnings } = auditCatalog();
    elements.catalogAudit.className = "catalog-audit";
    if (errors.length) {
      elements.catalogAudit.classList.add("error");
      elements.catalogAudit.textContent = `⛔ ${errors.length} erro(s) estrutural(is). ${errors[0]}`;
    } else if (warnings.length) {
      elements.catalogAudit.classList.add("warning");
      elements.catalogAudit.textContent = `⚠ ${warnings.length} mensagem(ns) ainda têm conteúdo pendente. O rascunho pode ser exportado.`;
    } else {
      elements.catalogAudit.classList.add("ok");
      elements.catalogAudit.textContent = "✓ Catálogo pronto para revisão e implementação.";
    }
  }

  function ensureActiveCategory() {
    const available = categoriesForProfile();
    if (!available.some((category) => category.id === activeCategoryId)) {
      activeCategoryId = available[0]?.id || "";
      selectedMessageId = "";
    }
  }

  function renderCategories() {
    ensureActiveCategory();
    const query = normalizeSearch(elements.categorySearch.value);
    const categories = categoriesForProfile();
    const visible = categories.filter((category) => normalizeSearch(`${category.label} ${category.id}`).includes(query));
    elements.categoryList.replaceChildren(...visible.map((category) => {
      const button = document.createElement("button");
      const count = profileMessages().filter((message) => message.categoria === category.id).length;
      button.type = "button";
      button.className = `category-button${category.id === activeCategoryId ? " active" : ""}`;
      button.dataset.categoryId = category.id;
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      const id = document.createElement("small");
      const badge = document.createElement("b");
      name.textContent = category.label;
      id.textContent = category.id;
      badge.textContent = count;
      copy.append(name, id);
      button.append(copy, badge);
      return button;
    }));
    elements.categoryCount.textContent = `${categories.length} categorias`;
    elements.messageCount.textContent = `${profileMessages().length} mensagens`;
  }

  function searchableMessageText(message) {
    return normalizeSearch([
      message.comando, message.titulo, ...(message.sinonimos || []), ...(message.palavrasChave || []),
      message.mensagem, message.manha, message.tarde, message.noite, message.templateVisita
    ].join(" "));
  }

  function renderMessages() {
    const category = currentCategory();
    elements.workspaceTitle.textContent = category?.label || "Nenhuma categoria disponível";
    elements.workspaceDescription.textContent = category
      ? `${activeProfile.toUpperCase()} • ${category.id} • ordem ${category.ordem}`
      : "Crie uma categoria para começar.";
    for (const control of [elements.moveCategoryUp, elements.moveCategoryDown, elements.editCategory, elements.addMessage]) {
      control.disabled = !category;
    }
    const query = normalizeSearch(elements.messageSearch.value);
    const messages = category
      ? profileMessages().filter((message) => message.categoria === category.id)
      : [];
    const visible = messages.filter((message) =>
      (!elements.firstPackageOnly.checked || message.primeiroPacote === true) &&
      (!query || searchableMessageText(message).includes(query))
    );
    elements.messageList.replaceChildren(...visible.map((message, visibleIndex) => {
      const article = document.createElement("article");
      article.className = `message-card${message.id === selectedMessageId ? " selected" : ""}`;
      article.dataset.messageId = message.id;
      const body = document.createElement("button");
      body.type = "button";
      body.className = "message-select";
      body.dataset.selectMessage = message.id;
      const heading = document.createElement("div");
      heading.className = "message-heading";
      const command = document.createElement("code");
      command.textContent = `!${message.comando}`;
      const badge = document.createElement("span");
      badge.className = `status-badge ${message.statusProposta || "planejado"}`;
      badge.textContent = STATUS_LABELS[message.statusProposta] || "PLANEJADO";
      heading.append(command, badge);
      if (message.primeiroPacote) {
        const first = document.createElement("span");
        first.className = "first-badge";
        first.textContent = "PRIMEIRO PACOTE";
        heading.append(first);
      }
      const title = document.createElement("strong");
      title.textContent = message.titulo || messageText(message) || "Texto ainda não elaborado";
      const excerpt = document.createElement("p");
      excerpt.textContent = messageText(message, "manha") || "Conteúdo pendente";
      body.append(heading, title, excerpt);
      const actions = document.createElement("div");
      actions.className = "message-actions";
      for (const [action, label, disabled] of [
        ["move-up", "↑", visibleIndex === 0],
        ["move-down", "↓", visibleIndex === visible.length - 1],
        ["edit", "Editar", false],
        ["duplicate", "Duplicar", false]
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mini-button";
        button.dataset.messageAction = action;
        button.dataset.messageId = message.id;
        button.textContent = label;
        button.disabled = disabled;
        actions.append(button);
      }
      article.append(body, actions);
      return article;
    }));
    elements.emptyState.hidden = visible.length > 0;
  }

  function renderPreview() {
    const message = selectedMessage();
    elements.previewWarning.hidden = true;
    elements.previewPeriods.hidden = true;
    if (!message) {
      elements.previewTitle.textContent = "Selecione uma mensagem";
      elements.previewMeta.textContent = "A mensagem será exibida aqui com dados fictícios nas tags.";
      elements.previewContent.textContent = "Nenhuma mensagem selecionada.";
      return;
    }
    elements.previewTitle.textContent = `!${message.comando}`;
    elements.previewMeta.textContent = `${message.titulo || "Sem título interno"} • ${message.tipo}`;
    const allText = [message.mensagem, message.manha, message.tarde, message.noite, message.templateVisita].join("\n");
    const unknown = unresolvedTags(allText);
    if (unknown.length) {
      elements.previewWarning.hidden = false;
      elements.previewWarning.textContent = `Tags desconhecidas: ${unknown.map((tag) => `{{${tag}}}`).join(", ")}`;
    }
    if (message.variacaoHorario) {
      elements.previewContent.textContent = "Esta mensagem possui três variações:";
      elements.previewPeriods.hidden = false;
      elements.previewPeriods.replaceChildren(...[
        ["🌅 Manhã", message.manha], ["☀️ Tarde", message.tarde], ["🌙 Noite", message.noite]
      ].map(([label, text]) => {
        const section = document.createElement("section");
        const strong = document.createElement("strong");
        const paragraph = document.createElement("p");
        strong.textContent = label;
        paragraph.textContent = replaceTags(text) || "Conteúdo pendente";
        section.append(strong, paragraph);
        return section;
      }));
    } else {
      elements.previewContent.textContent = replaceTags(messageText(message)) || "Conteúdo pendente.";
    }
  }

  function render() {
    if (!catalog) return;
    ensureActiveCategory();
    elements.profileButtons.forEach((button) => button.classList.toggle("active", button.dataset.profile === activeProfile));
    elements.profileVersion.value = profileData().versaoCatalogo;
    elements.profileVersionBadge.textContent = `v${profileData().versaoCatalogo}`;
    renderCategories();
    renderMessages();
    renderPreview();
    renderAudit();
  }

  function openCategoryEditor(category = null) {
    showError(elements.categoryError, "");
    elements.categoryForm.reset();
    elements.categoryOriginalId.value = category?.id || "";
    elements.categoryId.value = category?.id || "";
    elements.categoryLabel.value = category?.label || "";
    elements.categoryOrder.value = category?.ordem ?? Math.max(0, ...catalog.categorias.map((item) => Number(item.ordem) || 0)) + 10;
    elements.categorySectorSac.checked = category ? category.setores.includes("sac") : activeProfile === "sac";
    elements.categorySectorN2.checked = category ? category.setores.includes("n2") : activeProfile === "n2";
    elements.categoryDialogTitle.textContent = category ? "Editar categoria" : "Nova categoria";
    elements.deleteCategory.hidden = !category;
    elements.categoryDialog.showModal();
    elements.categoryLabel.focus();
  }

  function saveCategory(event) {
    event.preventDefault();
    const originalId = elements.categoryOriginalId.value;
    const id = normalizeId(elements.categoryId.value);
    const label = elements.categoryLabel.value.trim();
    const sectors = [
      elements.categorySectorSac.checked ? "sac" : "",
      elements.categorySectorN2.checked ? "n2" : ""
    ].filter(Boolean);
    if (!id || !label) return showError(elements.categoryError, "Informe um identificador e um nome válidos.");
    if (!sectors.length) return showError(elements.categoryError, "Marque SAC, N2 ou os dois perfis.");
    if (catalog.categorias.some((category) => category.id === id && category.id !== originalId)) {
      return showError(elements.categoryError, `O identificador ${id} já está em uso.`);
    }
    for (const profile of PROFILES) {
      if (!sectors.includes(profile) && profileMessages(profile).some((message) => message.categoria === originalId)) {
        return showError(elements.categoryError, `A categoria ainda possui mensagens no perfil ${profile.toUpperCase()}. Reclassifique-as antes de remover esse perfil.`);
      }
    }
    const category = { id, label, ordem: Number(elements.categoryOrder.value) || 0, setores: sectors };
    const index = catalog.categorias.findIndex((item) => item.id === originalId);
    if (index >= 0) catalog.categorias[index] = category;
    else catalog.categorias.push(category);
    if (originalId && originalId !== id) {
      PROFILES.forEach((profile) => profileMessages(profile).forEach((message) => {
        if (message.categoria === originalId) message.categoria = id;
      }));
    }
    activeCategoryId = id;
    elements.categoryDialog.close();
    persistDraft(`Categoria ${label} salva.`);
    render();
  }

  function deleteCategory() {
    const id = elements.categoryOriginalId.value;
    const category = catalog.categorias.find((item) => item.id === id);
    const count = PROFILES.reduce((total, profile) => total + profileMessages(profile).filter((message) => message.categoria === id).length, 0);
    if (count) return showError(elements.categoryError, `Esta categoria contém ${count} mensagem(ns). Reclassifique ou exclua essas mensagens primeiro.`);
    if (!category || !confirm(`Excluir a categoria “${category.label}”?`)) return;
    catalog.categorias = catalog.categorias.filter((item) => item.id !== id);
    elements.categoryDialog.close();
    activeCategoryId = "";
    persistDraft("Categoria excluída do rascunho.");
    render();
  }

  function moveCategory(direction) {
    const categories = categoriesForProfile();
    const index = categories.findIndex((category) => category.id === activeCategoryId);
    const target = categories[index + direction];
    const current = categories[index];
    if (!current || !target) return;
    const order = current.ordem;
    current.ordem = target.ordem;
    target.ordem = order;
    persistDraft("Ordem das categorias atualizada.");
    render();
  }

  function categoryOptions(selected = activeCategoryId) {
    elements.messageCategory.replaceChildren(...categoriesForProfile().map((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      option.selected = category.id === selected;
      return option;
    }));
  }

  function renderTagButtons() {
    elements.availableTags.replaceChildren(...TAGS.map((tag) => {
      const code = document.createElement("code");
      code.textContent = `{{${tag}}}`;
      return code;
    }));
    elements.editorTags.replaceChildren(...TAGS.map((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag-button";
      button.dataset.insertTag = tag;
      button.textContent = `{{${tag}}}`;
      return button;
    }));
  }

  function openMessageEditor(message = null, duplicate = false) {
    showError(elements.messageError, "");
    elements.messageForm.reset();
    const data = message ? clone(message) : {};
    const originalId = duplicate ? "" : data.id || "";
    const command = duplicate ? `${data.comando || "mensagem"}copia` : data.comando || "";
    elements.messageOriginalId.value = originalId;
    elements.messageId.value = duplicate ? createMessageId(command) : data.id || createMessageId("mensagem");
    elements.messageCommand.value = command;
    categoryOptions(data.categoria || activeCategoryId);
    elements.messageType.value = data.tipo || "texto";
    elements.messageTitle.value = data.titulo || "";
    elements.messageSynonyms.value = (data.sinonimos || []).join(", ");
    elements.messageKeywords.value = (data.palavrasChave || []).join(", ");
    elements.messageStatus.value = data.statusProposta || "planejado";
    elements.messageFirstPackage.checked = data.primeiroPacote === true;
    elements.messageTimeVariant.checked = data.variacaoHorario === true;
    elements.messageText.value = data.mensagem || "";
    elements.messageMorning.value = data.manha || "";
    elements.messageAfternoon.value = data.tarde || "";
    elements.messageNight.value = data.noite || "";
    elements.messageVisitTemplate.value = data.templateVisita || "";
    elements.messageImageFile.value = data.arquivoImagem || "";
    elements.messageDialogTitle.textContent = originalId ? `Editar !${data.comando}` : duplicate ? "Duplicar mensagem" : "Nova mensagem";
    elements.deleteMessage.hidden = !originalId;
    elements.duplicateMessage.hidden = !originalId;
    updateMessageEditorMode();
    elements.messageDialog.showModal();
    elements.messageCommand.focus();
  }

  function editorCurrentText() {
    if (elements.messageType.value === "disponibilidade") return "A agenda de disponibilidade será aberta.";
    if (elements.messageType.value === "visita") return elements.messageVisitTemplate.value;
    if (elements.messageType.value === "imagem") return `A imagem ${elements.messageImageFile.value || "PNG configurada"} será anexada ao atendimento.`;
    if (elements.messageTimeVariant.checked) {
      const hour = new Date().getHours();
      return hour >= 5 && hour < 12 ? elements.messageMorning.value : hour >= 12 && hour < 18 ? elements.messageAfternoon.value : elements.messageNight.value;
    }
    return elements.messageText.value;
  }

  function updateEditorPreview() {
    const text = editorCurrentText();
    const unknown = unresolvedTags([
      elements.messageText.value, elements.messageMorning.value, elements.messageAfternoon.value,
      elements.messageNight.value, elements.messageVisitTemplate.value
    ].join("\n"));
    elements.editorPreviewWarning.textContent = unknown.length ? `⚠ Tags desconhecidas: ${unknown.map((tag) => `{{${tag}}}`).join(", ")}` : "";
    elements.editorPreviewContent.textContent = replaceTags(text) || "A prévia aparecerá aqui.";
  }

  function updateMessageEditorMode() {
    const type = elements.messageType.value;
    const isText = type === "texto";
    elements.textOptions.hidden = !isText;
    elements.availabilityOptions.hidden = type !== "disponibilidade";
    elements.visitOptions.hidden = type !== "visita";
    elements.imageOptions.hidden = type !== "imagem";
    elements.normalMessageField.hidden = !isText || elements.messageTimeVariant.checked;
    elements.timeMessageFields.hidden = !isText || !elements.messageTimeVariant.checked;
    updateEditorPreview();
  }

  function saveMessage(event) {
    event.preventDefault();
    const originalId = elements.messageOriginalId.value;
    const id = normalizeId(elements.messageId.value);
    const command = normalizeCommand(elements.messageCommand.value);
    const category = elements.messageCategory.value;
    const type = elements.messageType.value;
    const categoryRecord = catalog.categorias.find((item) => item.id === category);
    if (!id || !command) return showError(elements.messageError, "Informe um identificador e um comando válidos.");
    if (!categoryRecord?.setores.includes(activeProfile)) return showError(elements.messageError, "Selecione uma categoria disponível para este perfil.");
    if (profileMessages().some((message) => message.id === id && message.id !== originalId)) return showError(elements.messageError, `O ID ${id} já está em uso.`);
    if (profileMessages().some((message) => message.comando === command && message.id !== originalId)) return showError(elements.messageError, `O comando !${command} já existe no perfil ${activeProfile.toUpperCase()}.`);
    const imageFile = elements.messageImageFile.value.trim().replace(/^\/+/, "");
    if (type === "imagem" && !/^assets\/mensagens\/[a-z0-9_-]+\.png$/.test(imageFile)) return showError(elements.messageError, "Informe um PNG válido dentro de assets/mensagens.");
    const record = {
      id,
      comando: command,
      categoria: category,
      tipo: type,
      sinonimos: normalizeList(elements.messageSynonyms.value),
      palavrasChave: normalizeList(elements.messageKeywords.value),
      variacaoHorario: type === "texto" && elements.messageTimeVariant.checked,
      mensagem: type === "texto" && !elements.messageTimeVariant.checked ? elements.messageText.value.trim() : "",
      manha: type === "texto" && elements.messageTimeVariant.checked ? elements.messageMorning.value.trim() : "",
      tarde: type === "texto" && elements.messageTimeVariant.checked ? elements.messageAfternoon.value.trim() : "",
      noite: type === "texto" && elements.messageTimeVariant.checked ? elements.messageNight.value.trim() : "",
      templateVisita: type === "visita" ? elements.messageVisitTemplate.value.trim() : "",
      arquivoImagem: type === "imagem" ? imageFile : "",
      titulo: elements.messageTitle.value.trim(),
      statusProposta: elements.messageStatus.value,
      primeiroPacote: elements.messageFirstPackage.checked
    };
    const index = profileMessages().findIndex((message) => message.id === originalId);
    if (index >= 0) profileMessages()[index] = record;
    else profileMessages().push(record);
    selectedMessageId = record.id;
    activeCategoryId = record.categoria;
    elements.messageDialog.close();
    persistDraft(`${index >= 0 ? "Mensagem atualizada" : "Mensagem criada"}: !${record.comando}.`);
    render();
  }

  function deleteMessage() {
    const id = elements.messageOriginalId.value;
    const message = profileMessages().find((item) => item.id === id);
    if (!message || !confirm(`Excluir !${message.comando} do rascunho ${activeProfile.toUpperCase()}?`)) return;
    profileData().mensagens = profileMessages().filter((item) => item.id !== id);
    selectedMessageId = "";
    elements.messageDialog.close();
    persistDraft("Mensagem excluída do rascunho.");
    render();
  }

  function moveMessage(id, direction) {
    const messages = profileMessages();
    const categoryMessages = messages.filter((message) => message.categoria === activeCategoryId);
    const categoryIndex = categoryMessages.findIndex((message) => message.id === id);
    const target = categoryMessages[categoryIndex + direction];
    if (!target) return;
    const index = messages.findIndex((message) => message.id === id);
    const targetIndex = messages.findIndex((message) => message.id === target.id);
    [messages[index], messages[targetIndex]] = [messages[targetIndex], messages[index]];
    persistDraft("Ordem das mensagens atualizada.");
    render();
  }

  function exportableCatalog() {
    const output = clone(catalog);
    output.aplicativo = "Way - Mensagens Personalizadas";
    output.schemaVersion = 2;
    output.exportadoEm = new Date().toISOString();
    output.estadoCatalogo = "rascunho_desenvolvimento";
    updateQuantities(output);
    return output;
  }

  function exportJson() {
    const output = exportableCatalog();
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(output, null, 2)}\n`], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `way-tools-catalogos-mensagens-rascunho-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const audit = auditCatalog();
    setStatus(`JSON exportado com ${audit.errors.length} erro(s) e ${audit.warnings.length} aviso(s).`, audit.errors.length ? "warning" : "success");
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(`${JSON.stringify(exportableCatalog(), null, 2)}\n`);
      setStatus("JSON completo copiado para a área de transferência.");
    } catch (error) {
      setStatus("Não foi possível copiar o JSON. Use Exportar rascunho.", "error");
    }
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeImportedCatalog(parsed);
      const auditBefore = catalog;
      catalog = imported;
      const audit = auditCatalog();
      if (audit.errors.length && !confirm(`O arquivo contém ${audit.errors.length} erro(s) estrutural(is). Deseja mantê-lo como rascunho para correção?`)) {
        catalog = auditBefore;
        return;
      }
      activeCategoryId = "";
      selectedMessageId = "";
      await persistDraft(`Arquivo ${file.name} importado para o estúdio.`);
      render();
    } catch (error) {
      setStatus(error?.message || "Não foi possível importar o arquivo.", "error");
    } finally {
      elements.importFile.value = "";
    }
  }

  async function resetDraft() {
    if (!confirm("Restaurar o catálogo nativo e a proposta SAC original? As alterações locais deste estúdio serão perdidas.")) return;
    catalog = clone(baselineCatalog);
    activeProfile = "sac";
    activeCategoryId = "";
    selectedMessageId = "";
    await persistDraft("Proposta original restaurada.");
    render();
  }

  function bindEvents() {
    elements.profileButtons.forEach((button) => button.addEventListener("click", () => {
      activeProfile = button.dataset.profile;
      activeCategoryId = "";
      selectedMessageId = "";
      elements.messageSearch.value = "";
      elements.firstPackageOnly.checked = false;
      render();
    }));
    elements.profileVersion.addEventListener("change", () => {
      profileData().versaoCatalogo = Math.max(1, Number.parseInt(elements.profileVersion.value, 10) || 1);
      persistDraft("Versão do catálogo atualizada.");
      render();
    });
    elements.categorySearch.addEventListener("input", renderCategories);
    elements.messageSearch.addEventListener("input", renderMessages);
    elements.firstPackageOnly.addEventListener("change", renderMessages);
    elements.categoryList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category-id]");
      if (!button) return;
      activeCategoryId = button.dataset.categoryId;
      selectedMessageId = "";
      render();
    });
    elements.messageList.addEventListener("click", (event) => {
      const action = event.target.closest("[data-message-action]");
      const select = event.target.closest("[data-select-message]");
      if (action) {
        const message = profileMessages().find((item) => item.id === action.dataset.messageId);
        if (!message) return;
        if (action.dataset.messageAction === "edit") openMessageEditor(message);
        if (action.dataset.messageAction === "duplicate") openMessageEditor(message, true);
        if (action.dataset.messageAction === "move-up") moveMessage(message.id, -1);
        if (action.dataset.messageAction === "move-down") moveMessage(message.id, 1);
      } else if (select) {
        selectedMessageId = select.dataset.selectMessage;
        renderMessages();
        renderPreview();
      }
    });
    elements.addCategory.addEventListener("click", () => openCategoryEditor());
    elements.editCategory.addEventListener("click", () => openCategoryEditor(currentCategory()));
    elements.moveCategoryUp.addEventListener("click", () => moveCategory(-1));
    elements.moveCategoryDown.addEventListener("click", () => moveCategory(1));
    elements.addMessage.addEventListener("click", () => openMessageEditor());
    elements.categoryForm.addEventListener("submit", saveCategory);
    elements.deleteCategory.addEventListener("click", deleteCategory);
    elements.messageForm.addEventListener("submit", saveMessage);
    elements.deleteMessage.addEventListener("click", deleteMessage);
    elements.duplicateMessage.addEventListener("click", () => {
      const message = profileMessages().find((item) => item.id === elements.messageOriginalId.value);
      if (message) {
        elements.messageDialog.close();
        openMessageEditor(message, true);
      }
    });
    elements.messageType.addEventListener("change", updateMessageEditorMode);
    elements.messageTimeVariant.addEventListener("change", updateMessageEditorMode);
    elements.messageForm.addEventListener("input", updateEditorPreview);
    elements.messageForm.addEventListener("focusin", (event) => {
      if (event.target instanceof HTMLTextAreaElement) lastFocusedTextArea = event.target;
    });
    elements.editorTags.addEventListener("click", (event) => {
      const button = event.target.closest("[data-insert-tag]");
      if (!button) return;
      const target = lastFocusedTextArea && elements.messageDialog.contains(lastFocusedTextArea)
        ? lastFocusedTextArea
        : elements.messageType.value === "visita" ? elements.messageVisitTemplate : elements.messageText;
      const tag = `{{${button.dataset.insertTag}}}`;
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      target.setRangeText(tag, start, end, "end");
      target.focus();
      updateEditorPreview();
    });
    document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => {
      document.getElementById(button.dataset.closeDialog)?.close();
    }));
    elements.saveDraft.addEventListener("click", () => persistDraft());
    elements.importJson.addEventListener("click", () => elements.importFile.click());
    elements.importFile.addEventListener("change", () => importJson(elements.importFile.files?.[0]));
    elements.copyJson.addEventListener("click", copyJson);
    elements.downloadDraft.addEventListener("click", exportJson);
    elements.resetDraft.addEventListener("click", resetDraft);
  }

  async function initialize() {
    try {
      const [nativeResponse, sacResponse] = await Promise.all([
        fetch(chrome.runtime.getURL("data/mensagens-nativas.json")),
        fetch(chrome.runtime.getURL("data/mensagens-sac-rascunho.json"))
      ]);
      if (!nativeResponse.ok || !sacResponse.ok) throw new Error("Não foi possível carregar os catálogos de origem.");
      const nativeCatalog = normalizeImportedCatalog(await nativeResponse.json());
      baselineCatalog = mergeLegacySacDraft(nativeCatalog, await sacResponse.json());
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      catalog = isNativeCatalog(stored[STORAGE_KEY])
        ? normalizeImportedCatalog(stored[STORAGE_KEY])
        : clone(baselineCatalog);
      renderTagButtons();
      bindEvents();
      render();
      setStatus(stored[STORAGE_KEY] ? "Rascunho local restaurado." : "Proposta inicial carregada e pronta para edição.");
    } catch (error) {
      setStatus(error?.message || "Falha ao iniciar o estúdio.", "error");
      elements.catalogAudit.textContent = "Não foi possível carregar o catálogo.";
    }
  }

  initialize();
})();
