(() => {
  "use strict";

  const STORAGE_KEY = "wayTools.developer.reportGeneratorCatalog.v1";
  const BASELINE_STORAGE_KEY = "wayTools.developer.reportGeneratorBaseline.v1";
  const simulationRequested = new URLSearchParams(location.search).get("simulate") === "1";
  const state = { baseline: null, catalog: null, selectedStageIndex: 0, ready: false };
  let openReportGenerator = null;
  let domReady = false;

  if (simulationRequested) {
    try {
      const simulationCatalog = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (simulationCatalog && Array.isArray(simulationCatalog.stages)) {
        globalThis.WAY_TOOLS_REPORT_GENERATOR_DEVELOPER_OVERRIDE = simulationCatalog;
      }
    } catch (error) {
      console.warn("[Way Tools] Não foi possível preparar o catálogo para simulação:", error);
    }
  }

  globalThis.WayToolsRuntime = {
    run(_scriptId, start) { start(); },
    registerMenuCommand(scriptId, _label, callback) {
      if (scriptId === "way-erp-gerador-relato") {
        openReportGenerator = callback;
        if (simulationRequested) window.setTimeout(callback, 0);
      }
      return `${scriptId}:developer-studio`;
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function slugify(value, fallback = "item") {
    const slug = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "").slice(0, 100);
    return slug || fallback;
  }

  function isValidCatalog(catalog) {
    return Boolean(catalog && Array.isArray(catalog.stages) && catalog.stages.every((stage) =>
      stage && typeof stage.id === "string" && Array.isArray(stage.categories)
    ));
  }

  function loadStoredCatalog() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return isValidCatalog(stored) ? stored : null;
    } catch (error) {
      console.warn("[Way Tools] Catálogo de desenvolvimento inválido:", error);
      return null;
    }
  }

  function mergeCatalogWithBaseline(storedCatalog, baselineCatalog) {
    if (!isValidCatalog(storedCatalog) || !isValidCatalog(baselineCatalog)) {
      return { catalog: clone(baselineCatalog), updated: false };
    }
    if (storedCatalog.generatorVersion === baselineCatalog.generatorVersion &&
        storedCatalog.schemaVersion === baselineCatalog.schemaVersion) {
      return { catalog: storedCatalog, updated: false };
    }

    const merged = clone(storedCatalog);
    let updated = false;
    for (const baselineStage of baselineCatalog.stages) {
      let stage = merged.stages.find((candidate) => candidate.id === baselineStage.id);
      if (!stage) {
        merged.stages.push(clone(baselineStage));
        updated = true;
        continue;
      }
      stage.categories ||= [];
      for (const baselineCategory of baselineStage.categories || []) {
        let category = stage.categories.find((candidate) => candidate.id === baselineCategory.id);
        if (!category) {
          stage.categories.push(clone(baselineCategory));
          updated = true;
          continue;
        }
        category.options ||= [];
        const usedOrders = new Set(category.options
          .map((option) => Number(option.order))
          .filter(Number.isFinite));
        let highestOrder = usedOrders.size ? Math.max(...usedOrders) : 0;
        for (const baselineOption of baselineCategory.options || []) {
          const existing = category.options.find((option) => option.id === baselineOption.id);
          if (!existing) {
            const appended = clone(baselineOption);
            const baselineOrder = Number(appended.order);
            if (!Number.isFinite(baselineOrder) || usedOrders.has(baselineOrder)) {
              highestOrder += 10;
              appended.order = highestOrder;
            } else {
              highestOrder = Math.max(highestOrder, baselineOrder);
              usedOrders.add(baselineOrder);
            }
            usedOrders.add(Number(appended.order));
            category.options.push(appended);
            updated = true;
            continue;
          }
          const baselineProducts = Array.isArray(baselineOption.products) ? baselineOption.products : [];
          const currentProducts = Array.isArray(existing.products) ? existing.products : [];
          if (baselineProducts.includes("way_vision") &&
              !currentProducts.includes("*") &&
              !currentProducts.includes("way_vision")) {
            existing.products = [...currentProducts, "way_vision"];
            updated = true;
          }
        }
      }
    }
    merged.schemaVersion = baselineCatalog.schemaVersion;
    merged.generatorVersion = baselineCatalog.generatorVersion;
    merged.title = baselineCatalog.title;
    merged.note = baselineCatalog.note;
    return { catalog: merged, updated };
  }

  function setStatus(message, error = false) {
    const status = document.querySelector("#studio-status");
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? "#ffaaaa" : "#8fd5b5";
  }

  function saveCatalog(message = "Alterações de desenvolvimento salvas localmente.") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.catalog));
    setStatus(message);
  }

  function initializeCatalog() {
    const api = globalThis.WayToolsReportGeneratorDeveloper;
    if (!api || typeof api.getCatalog !== "function") return;
    const generatedCatalog = api.getCatalog();
    let storedBaseline = null;
    try {
      storedBaseline = JSON.parse(localStorage.getItem(BASELINE_STORAGE_KEY) || "null");
    } catch (_error) {
      storedBaseline = null;
    }
    state.baseline = simulationRequested && isValidCatalog(storedBaseline)
      ? storedBaseline
      : generatedCatalog;
    if (!simulationRequested) {
      localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(generatedCatalog));
    }
    const stored = loadStoredCatalog();
    const migration = stored
      ? mergeCatalogWithBaseline(stored, state.baseline)
      : { catalog: clone(state.baseline), updated: false };
    state.catalog = migration.catalog;
    if (stored && migration.updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.catalog));
    }
    state.selectedStageIndex = Math.max(0, Math.min(state.selectedStageIndex, state.catalog.stages.length - 1));
    state.ready = true;
    if (domReady) {
      renderAll();
      setStatus(stored
        ? migration.updated
          ? "Projeto local preservado e atualizado com as novidades do catálogo nativo."
          : "Projeto de desenvolvimento restaurado deste navegador."
        : "Catálogo atual do Gerador de Relato carregado.");
    }
  }

  document.addEventListener("waytools:report-generator-developer-ready", initializeCatalog);

  function currentStage() {
    return state.catalog?.stages?.[state.selectedStageIndex] || null;
  }

  function catalogTotals() {
    const categories = state.catalog.stages.flatMap((stage) => stage.categories || []);
    return {
      categories: categories.length,
      options: categories.reduce((total, category) => total + (category.options?.length || 0), 0)
    };
  }

  function auditCatalog() {
    const issues = [];
    const stageIds = new Set();
    const globalCategoryIds = new Set();
    for (const stage of state.catalog.stages) {
      if (stageIds.has(stage.id)) issues.push(`ID de etapa duplicado: ${stage.id}`);
      stageIds.add(stage.id);
      const categoryIds = new Set();
      for (const category of stage.categories || []) {
        if (categoryIds.has(category.id)) issues.push(`ID de categoria duplicado em ${stage.label}: ${category.id}`);
        if (globalCategoryIds.has(category.id)) issues.push(`ID de categoria repetido em etapas diferentes: ${category.id}`);
        categoryIds.add(category.id);
        globalCategoryIds.add(category.id);
        const optionIds = new Set();
        for (const option of category.options || []) {
          if (!option.id) issues.push(`Opção sem ID em ${category.label}: ${option.label || "sem nome"}`);
          else if (optionIds.has(option.id)) issues.push(`ID de opção duplicado em ${category.label}: ${option.id}`);
          optionIds.add(option.id);
          if (option.order !== undefined && !Number.isFinite(Number(option.order))) {
            issues.push(`Opção ${option.id} possui ordem de exibição inválida.`);
          }
          if (option.priority?.order !== undefined && !Number.isFinite(Number(option.priority.order))) {
            issues.push(`Opção ${option.id} possui ordem de prioridade inválida.`);
          }
        }
      }
    }

    const categoryById = new Map(state.catalog.stages
      .flatMap((stage) => stage.categories || [])
      .map((category) => [category.id, category]));
    const productIds = new Set((categoryById.get("products")?.options || []).map((option) => option.id));
    const contactLabels = new Set((categoryById.get("contact_types")?.options || []).map((option) => option.label));
    const requestIds = new Set((categoryById.get("requests")?.options || []).map((option) => option.id));
    const issueIdList = [...categoryById.entries()]
      .filter(([categoryId]) => categoryId.startsWith("issues_"))
      .flatMap(([, category]) => (category.options || []).map((option) => option.id));
    const issueIds = new Set(issueIdList);
    if (issueIds.size !== issueIdList.length) {
      issues.push("Existem IDs de problemas repetidos entre produtos diferentes.");
    }
    const checkIds = new Set((categoryById.get("checks")?.options || []).map((option) => option.id));
    for (const category of categoryById.values()) {
      for (const option of category.options || []) {
        for (const productId of Array.isArray(option.products) ? option.products : []) {
          if (productId !== "*" && !productIds.has(productId)) {
            issues.push(`Opção ${option.id} referencia produto inexistente: ${productId}`);
          }
        }
        for (const contact of Array.isArray(option.contacts) ? option.contacts : []) {
          if (contact !== "*" && !contactLabels.has(contact)) {
            issues.push(`Opção ${option.id} referencia motivo inexistente: ${contact}`);
          }
        }
        for (const requestId of Array.isArray(option.triggers?.requests) ? option.triggers.requests : []) {
          if (!requestIds.has(requestId)) {
            issues.push(`Opção ${option.id} referencia solicitação inexistente: ${requestId}`);
          }
        }
        for (const issueId of Array.isArray(option.triggers?.issues) ? option.triggers.issues : []) {
          if (!issueIds.has(issueId)) {
            issues.push(`Opção ${option.id} referencia problema inexistente: ${issueId}`);
          }
        }
      }
    }
    for (const rule of categoryById.get("recommendations")?.options || []) {
      if (rule.product && !productIds.has(rule.product)) {
        issues.push(`Regra ${rule.id} referencia produto inexistente: ${rule.product}`);
      }
      for (const checkId of Array.isArray(rule.checks) ? rule.checks : []) {
        if (!checkIds.has(checkId)) issues.push(`Regra ${rule.id} referencia verificação inexistente: ${checkId}`);
      }
    }
    return { valid: issues.length === 0, issues };
  }

  function metadataFor(item) {
    const metadata = { ...item };
    for (const key of ["id", "label", "icon", "description"]) delete metadata[key];
    return metadata;
  }

  function advancedMetadataFor(item) {
    const metadata = metadataFor(item);
    for (const key of ["products", "contacts", "triggers", "order", "priority"]) delete metadata[key];
    return metadata;
  }

  function numericOrder(value, fallback) {
    const order = Number(value);
    return Number.isFinite(order) ? order : fallback;
  }

  function orderedOptionEntries(category) {
    return (category?.options || []).map((option, optionIndex) => ({ option, optionIndex }))
      .sort((left, right) =>
        numericOrder(left.option.order, (left.optionIndex + 1) * 10) -
        numericOrder(right.option.order, (right.optionIndex + 1) * 10) ||
        left.optionIndex - right.optionIndex
      );
  }

  function nextOptionOrder(category) {
    return (category?.options || []).reduce((highest, option, index) =>
      Math.max(highest, numericOrder(option.order, (index + 1) * 10)), 0) + 10;
  }

  function categoryById(categoryId) {
    return state.catalog.stages
      .flatMap((stage) => stage.categories || [])
      .find((category) => category.id === categoryId) || null;
  }

  function relationCapabilities(categoryId) {
    const operational = categoryId === "requests" || categoryId === "checks" ||
      categoryId === "measurements" || categoryId === "actions" ||
      categoryId === "outcomes" || categoryId === "visit_reasons" ||
      categoryId.startsWith("issues_");
    const supportsTriggers = ["checks", "measurements", "actions", "outcomes", "visit_reasons"]
      .includes(categoryId);
    return { visible: operational, supportsTriggers };
  }

  function checkedRelationValues(name, fallback = []) {
    const values = [...document.querySelectorAll(`input[name="${name}"]:checked`)]
      .map((input) => input.value)
      .filter(Boolean);
    return values.length ? values : fallback;
  }

  function renderRelationOptions(containerId, name, items, selectedValues) {
    const selected = new Set(selectedValues);
    const nodes = items.map((item) => {
      const label = document.createElement("label");
      label.className = "relation-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = item.value;
      input.checked = selected.has(item.value);
      label.append(
        input,
        Object.assign(document.createElement("span"), { textContent: item.label })
      );
      return label;
    });
    document.querySelector(`#${containerId}`).replaceChildren(...nodes);
  }

  function renderRelations(categoryId, source = {}) {
    const capabilities = relationCapabilities(categoryId);
    const relations = document.querySelector("#editor-relations-field");
    relations.hidden = !capabilities.visible;
    if (!capabilities.visible) return;

    const products = categoryById("products")?.options || [];
    const contacts = categoryById("contact_types")?.options || [];
    const requests = categoryById("requests")?.options || [];
    const problems = state.catalog.stages
      .flatMap((stage) => stage.categories || [])
      .filter((category) => category.id.startsWith("issues_"))
      .flatMap((category) => (category.options || []).map((option) => ({
        value: option.id,
        label: `${category.label.replace(/^Problemas\s*[—-]\s*/i, "")} — ${option.label}`
      })));

    renderRelationOptions("relation-products-options", "relation-products", [
      { value: "*", label: "Qualquer produto" },
      ...products.map((option) => ({ value: option.id, label: `${option.icon ? `${option.icon} ` : ""}${option.label}` }))
    ], Array.isArray(source.products) && source.products.length ? source.products : ["*"]);
    renderRelationOptions("relation-contacts-options", "relation-contacts", [
      { value: "*", label: "Qualquer motivo do contato" },
      ...contacts.map((option) => ({ value: option.label, label: option.label }))
    ], Array.isArray(source.contacts) && source.contacts.length ? source.contacts : ["*"]);
    renderRelationOptions("relation-requests-options", "relation-requests",
      requests.map((option) => ({ value: option.id, label: option.label })),
      Array.isArray(source.triggers?.requests) ? source.triggers.requests : []);
    renderRelationOptions("relation-issues-options", "relation-issues", problems,
      Array.isArray(source.triggers?.issues) ? source.triggers.issues : []);
    document.querySelector("#relation-requests-group").hidden = !capabilities.supportsTriggers;
    document.querySelector("#relation-issues-group").hidden = !capabilities.supportsTriggers;
  }

  function actionButton(label, action, categoryIndex, optionIndex = null, danger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mini-button${danger ? " danger" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.categoryIndex = String(categoryIndex);
    if (optionIndex !== null) button.dataset.optionIndex = String(optionIndex);
    return button;
  }

  function renderStageList() {
    const list = document.querySelector("#stage-list");
    list.replaceChildren(...state.catalog.stages.map((stage, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `stage-button${index === state.selectedStageIndex ? " active" : ""}`;
      button.dataset.stageIndex = String(index);
      const number = Object.assign(document.createElement("span"), { className: "stage-number", textContent: String(index + 1) });
      const label = Object.assign(document.createElement("strong"), { textContent: stage.label.replace(/^\d+\.\s*/, "") });
      const count = Object.assign(document.createElement("small"), { textContent: String(stage.categories?.length || 0) });
      button.append(number, label, count);
      return button;
    }));
    document.querySelector("#stage-count").textContent = String(state.catalog.stages.length);
  }

  function optionMatches(option, query) {
    return `${option.label || ""} ${option.id || ""} ${JSON.stringify(metadataFor(option))}`
      .toLocaleLowerCase("pt-BR").includes(query);
  }

  function categoryMatches(category, query) {
    return `${category.label || ""} ${category.id || ""} ${category.description || ""}`
      .toLocaleLowerCase("pt-BR").includes(query);
  }

  function createOptionRow(option, categoryIndex, optionIndex) {
    const row = document.createElement("div");
    row.className = "option-row";
    const copy = document.createElement("div");
    copy.className = "option-copy";
    const title = document.createElement("div");
    title.className = "option-title";
    title.append(
      Object.assign(document.createElement("strong"), { textContent: `${option.icon ? `${option.icon} ` : ""}${option.label || "Sem nome"}` }),
      Object.assign(document.createElement("span"), { className: "option-id", textContent: option.id || "sem_id" })
    );
    copy.append(title);
    const metadata = advancedMetadataFor(option);
    const optionOrder = numericOrder(option.order, (optionIndex + 1) * 10);
    const priorityEnabled = option.priority?.enabled === true;
    copy.append(Object.assign(document.createElement("p"), {
      className: `option-order${priorityEnabled ? " priority" : ""}`,
      textContent: priorityEnabled
        ? `⭐ Prioritária · ordem geral ${optionOrder} · ordem prioritária ${numericOrder(option.priority?.order, optionOrder)}`
        : `↕ Ordem de exibição: ${optionOrder}`
    }));
    const relationParts = [];
    if (Array.isArray(option.products) && !option.products.includes("*")) {
      relationParts.push(`${option.products.length} produto(s)`);
    }
    if (Array.isArray(option.contacts) && !option.contacts.includes("*")) {
      relationParts.push(`${option.contacts.length} motivo(s)`);
    }
    if (Array.isArray(option.triggers?.requests) && option.triggers.requests.length) {
      relationParts.push(`${option.triggers.requests.length} solicitação(ões)`);
    }
    if (Array.isArray(option.triggers?.issues) && option.triggers.issues.length) {
      relationParts.push(`${option.triggers.issues.length} problema(s)`);
    }
    if (relationParts.length) {
      copy.append(Object.assign(document.createElement("p"), {
        className: "option-relations",
        textContent: `🔗 Disponível por ${relationParts.join(" • ")}`
      }));
    }
    if (Object.keys(metadata).length) {
      copy.append(Object.assign(document.createElement("p"), {
        className: "option-metadata",
        textContent: JSON.stringify(metadata)
      }));
    }
    const actions = document.createElement("div");
    actions.className = "option-actions";
    actions.append(
      actionButton("↑ Subir", "move-option-up", categoryIndex, optionIndex),
      actionButton("↓ Descer", "move-option-down", categoryIndex, optionIndex),
      actionButton("Editar", "edit-option", categoryIndex, optionIndex),
      actionButton("Remover", "remove-option", categoryIndex, optionIndex, true)
    );
    row.append(copy, actions);
    return row;
  }

  function renderCategories() {
    const stage = currentStage();
    const query = document.querySelector("#option-search").value.trim().toLocaleLowerCase("pt-BR");
    const cards = [];
    stage.categories.forEach((category, categoryIndex) => {
      const categoryFound = !query || categoryMatches(category, query);
      const options = orderedOptionEntries(category)
        .filter(({ option }) => categoryFound || optionMatches(option, query));
      if (query && !categoryFound && options.length === 0) return;

      const card = document.createElement("article");
      card.className = "category-card";
      const header = document.createElement("header");
      header.className = "category-header";
      const copy = document.createElement("div");
      copy.append(
        Object.assign(document.createElement("h3"), { textContent: category.label }),
        Object.assign(document.createElement("p"), { textContent: category.description || `${category.options?.length || 0} opção(ões)` })
      );
      const actions = document.createElement("div");
      actions.className = "category-actions";
      actions.append(
        actionButton("＋ Opção", "add-option", categoryIndex),
        actionButton("Editar", "edit-category", categoryIndex),
        actionButton("Remover", "remove-category", categoryIndex, null, true)
      );
      header.append(copy, actions);

      const optionList = document.createElement("div");
      optionList.className = "options-list";
      if (!options.length) {
        optionList.append(Object.assign(document.createElement("div"), {
          className: "category-empty",
          textContent: "Nenhuma opção nesta categoria. Use “＋ Opção” para começar."
        }));
      } else {
        for (const { option, optionIndex } of options) optionList.append(createOptionRow(option, categoryIndex, optionIndex));
      }
      card.append(header, optionList);
      cards.push(card);
    });
    document.querySelector("#categories-list").replaceChildren(...cards);
    document.querySelector("#empty-state").hidden = cards.length > 0;
  }

  function renderPreview() {
    const blocks = currentStage().categories.map((category) => {
      const block = document.createElement("section");
      block.className = "preview-category";
      block.append(Object.assign(document.createElement("h3"), { textContent: category.label }));
      const options = document.createElement("div");
      options.className = "preview-options";
      for (const { option } of orderedOptionEntries(category).slice(0, 8)) {
        options.append(Object.assign(document.createElement("div"), {
          className: "preview-option",
          textContent: `${option.icon ? `${option.icon} ` : ""}${option.label}`
        }));
      }
      if ((category.options?.length || 0) > 8) {
        options.append(Object.assign(document.createElement("div"), {
          className: "preview-option",
          textContent: `＋ ${category.options.length - 8} opção(ões)`
        }));
      }
      block.append(options);
      return block;
    });
    document.querySelector("#stage-preview-content").replaceChildren(...blocks);
  }

  function renderAll() {
    if (!state.ready || !state.catalog.stages.length) return;
    const stage = currentStage();
    const totals = catalogTotals();
    document.querySelector("#workspace-title").textContent = stage.label;
    document.querySelector("#workspace-description").textContent = stage.description || "Organize as categorias e opções desta etapa.";
    document.querySelector("#preview-title").textContent = stage.label;
    document.querySelector("#category-count").textContent = `${totals.categories} categorias`;
    document.querySelector("#option-count").textContent = `${totals.options} opções`;
    const audit = auditCatalog();
    const auditElement = document.querySelector("#catalog-audit");
    auditElement.className = `catalog-audit ${audit.valid ? "ok" : "warning"}`;
    auditElement.textContent = audit.valid
      ? "✓ IDs e referências consistentes"
      : `⚠ ${audit.issues.length} aviso(s) de integridade`;
    auditElement.title = audit.issues.join("\n");
    renderStageList();
    renderCategories();
    renderPreview();
  }

  function openEditor(kind, categoryIndex = -1, optionIndex = -1) {
    const stage = currentStage();
    const category = categoryIndex >= 0 ? stage.categories[categoryIndex] : null;
    const option = optionIndex >= 0 ? category?.options?.[optionIndex] : null;
    const source = kind === "stage" ? stage : kind === "category" ? category : option;
    const isOption = kind === "option";
    document.querySelector("#dialog-title").textContent = source
      ? `Editar ${kind === "stage" ? "etapa" : kind === "category" ? "categoria" : "opção"}`
      : `Adicionar ${kind === "category" ? "categoria" : "opção"}`;
    document.querySelector("#editor-kind").value = kind;
    document.querySelector("#editor-category-index").value = String(categoryIndex);
    document.querySelector("#editor-option-index").value = String(optionIndex);
    document.querySelector("#editor-id").value = source?.id || "";
    document.querySelector("#editor-label").value = source?.label || "";
    document.querySelector("#editor-icon").value = source?.icon || "";
    document.querySelector("#editor-description").value = source?.description || "";
    const defaultOrder = source
      ? numericOrder(source.order, Math.max(10, (optionIndex + 1) * 10))
      : nextOptionOrder(category);
    document.querySelector("#editor-order").value = String(defaultOrder);
    document.querySelector("#editor-metadata").value = isOption && source ? JSON.stringify(advancedMetadataFor(source), null, 2) : "{}";
    document.querySelector("#editor-icon-field").hidden = !isOption;
    document.querySelector("#editor-order-field").hidden = !isOption;
    document.querySelector("#editor-metadata-field").hidden = !isOption;
    document.querySelector("#editor-metadata-field").open = false;
    if (isOption) {
      const capabilities = relationCapabilities(category?.id || "");
      renderRelations(category?.id || "", source || {});
      const priorityEnabled = source
        ? source.priority?.enabled === true
        : capabilities.visible;
      document.querySelector("#editor-priority-enabled").checked = priorityEnabled;
      document.querySelector("#editor-priority-order").value = String(
        numericOrder(source?.priority?.order, defaultOrder)
      );
      document.querySelector("#editor-priority-order").disabled = !priorityEnabled;
    }
    else document.querySelector("#editor-relations-field").hidden = true;
    document.querySelector("#dialog-error").hidden = true;
    document.querySelector("#catalog-editor-dialog").showModal();
    window.setTimeout(() => document.querySelector("#editor-label").focus(), 0);
  }

  function closeEditor() {
    document.querySelector("#catalog-editor-dialog").close();
  }

  function saveEditor(event) {
    event.preventDefault();
    const kind = document.querySelector("#editor-kind").value;
    const categoryIndex = Number(document.querySelector("#editor-category-index").value);
    const optionIndex = Number(document.querySelector("#editor-option-index").value);
    const label = document.querySelector("#editor-label").value.trim();
    const id = slugify(document.querySelector("#editor-id").value || label, kind);
    const description = document.querySelector("#editor-description").value.trim();
    const error = document.querySelector("#dialog-error");
    if (!label) {
      error.textContent = "Informe o nome exibido.";
      error.hidden = false;
      return;
    }

    let nextItem = { id, label };
    if (description) nextItem.description = description;
    if (kind === "option") {
      try {
        const metadata = JSON.parse(document.querySelector("#editor-metadata").value.trim() || "{}");
        if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") throw new Error("Informe um objeto JSON.");
        nextItem = { ...metadata, ...nextItem };
        nextItem.order = numericOrder(document.querySelector("#editor-order").value, 10);
        const icon = document.querySelector("#editor-icon").value.trim();
        if (icon) nextItem.icon = icon;
        const categoryId = currentStage().categories[categoryIndex]?.id || "";
        const capabilities = relationCapabilities(categoryId);
        if (capabilities.visible) {
          nextItem.products = checkedRelationValues("relation-products", ["*"]);
          nextItem.contacts = checkedRelationValues("relation-contacts", ["*"]);
          if (capabilities.supportsTriggers) {
            const requests = checkedRelationValues("relation-requests");
            const issues = checkedRelationValues("relation-issues");
            if (requests.length || issues.length) {
              nextItem.triggers = {};
              if (requests.length) nextItem.triggers.requests = requests;
              if (issues.length) nextItem.triggers.issues = issues;
            }
          }
          nextItem.priority = {
            enabled: document.querySelector("#editor-priority-enabled").checked,
            order: numericOrder(document.querySelector("#editor-priority-order").value, nextItem.order)
          };
        }
      } catch (parseError) {
        error.textContent = `JSON inválido: ${parseError.message}`;
        error.hidden = false;
        return;
      }
    }

    const stage = currentStage();
    if (kind === "stage") {
      stage.id = id;
      stage.label = label;
      stage.description = description;
    } else if (kind === "category") {
      nextItem.options = categoryIndex >= 0 ? stage.categories[categoryIndex].options || [] : [];
      if (categoryIndex >= 0) stage.categories[categoryIndex] = nextItem;
      else stage.categories.push(nextItem);
    } else {
      const options = stage.categories[categoryIndex].options ||= [];
      if (optionIndex >= 0) options[optionIndex] = nextItem;
      else options.push(nextItem);
    }
    saveCatalog();
    closeEditor();
    renderAll();
  }

  function handleCategoryAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action } = button.dataset;
    const categoryIndex = Number(button.dataset.categoryIndex);
    const optionIndex = button.dataset.optionIndex === undefined ? -1 : Number(button.dataset.optionIndex);
    const stage = currentStage();
    if (action === "add-option") openEditor("option", categoryIndex);
    if (action === "edit-category") openEditor("category", categoryIndex);
    if (action === "edit-option") openEditor("option", categoryIndex, optionIndex);
    if (action === "move-option-up" || action === "move-option-down") {
      const category = stage.categories[categoryIndex];
      const target = category.options[optionIndex];
      const ordered = orderedOptionEntries(category).map(({ option }) => option);
      const currentIndex = ordered.indexOf(target);
      const nextIndex = action === "move-option-up" ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex >= 0 && nextIndex >= 0 && nextIndex < ordered.length) {
        [ordered[currentIndex], ordered[nextIndex]] = [ordered[nextIndex], ordered[currentIndex]];
        ordered.forEach((option, index) => { option.order = (index + 1) * 10; });
        category.options = ordered;
        saveCatalog("Ordem das opções atualizada.");
        renderAll();
      }
    }
    if (action === "remove-category" && window.confirm(`Remover a categoria “${stage.categories[categoryIndex].label}” e todas as suas opções?`)) {
      stage.categories.splice(categoryIndex, 1);
      saveCatalog("Categoria removida do projeto de desenvolvimento.");
      renderAll();
    }
    if (action === "remove-option" && window.confirm(`Remover a opção “${stage.categories[categoryIndex].options[optionIndex].label}”?`)) {
      stage.categories[categoryIndex].options.splice(optionIndex, 1);
      saveCatalog("Opção removida do projeto de desenvolvimento.");
      renderAll();
    }
  }

  function exportPayload() {
    const audit = auditCatalog();
    return {
      ...clone(state.catalog),
      export: {
        type: "way-tools-report-generator-development-proposal",
        exportedAt: new Date().toISOString(),
        extensionVersion: chrome.runtime.getManifest().version,
        warning: "Esta proposta precisa ser revisada antes de ser incorporada ao código de produção.",
        audit
      }
    };
  }

  function exportJson() {
    const blob = new Blob([`${JSON.stringify(exportPayload(), null, 2)}\n`], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `way-tools-gerador-relato-proposta-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("JSON de desenvolvimento exportado.");
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportPayload(), null, 2));
      setStatus("JSON copiado para a área de transferência.");
    } catch (error) {
      console.error("[Way Tools] Falha ao copiar JSON:", error);
      setStatus("Não foi possível copiar. Use Exportar JSON.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    domReady = true;
    document.querySelector("#stage-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-stage-index]");
      if (!button) return;
      state.selectedStageIndex = Number(button.dataset.stageIndex);
      document.querySelector("#option-search").value = "";
      renderAll();
    });
    document.querySelector("#categories-list").addEventListener("click", handleCategoryAction);
    document.querySelector("#option-search").addEventListener("input", renderCategories);
    document.querySelector("#add-category").addEventListener("click", () => openEditor("category"));
    document.querySelector("#edit-stage").addEventListener("click", () => openEditor("stage"));
    document.querySelector("#catalog-editor-form").addEventListener("submit", saveEditor);
    document.querySelector("#close-dialog").addEventListener("click", closeEditor);
    document.querySelector("#cancel-editor").addEventListener("click", closeEditor);
    document.querySelector("#export-json").addEventListener("click", exportJson);
    document.querySelector("#copy-json").addEventListener("click", copyJson);
    document.querySelector("#reopen-generator").addEventListener("click", () => {
      saveCatalog("Projeto salvo. Abrindo o simulador com os vínculos atuais…");
      const simulationUrl = new URL(location.href);
      simulationUrl.searchParams.set("simulate", "1");
      location.assign(simulationUrl.href);
    });
    document.querySelector("#editor-relations-field").addEventListener("change", (event) => {
      const input = event.target.closest('input[type="checkbox"]');
      if (!input || !["relation-products", "relation-contacts"].includes(input.name)) return;
      const group = [...document.querySelectorAll(`input[name="${input.name}"]`)];
      if (input.value === "*" && input.checked) {
        group.forEach((candidate) => { if (candidate !== input) candidate.checked = false; });
      } else if (input.checked) {
        const wildcard = group.find((candidate) => candidate.value === "*");
        if (wildcard) wildcard.checked = false;
      }
    });
    document.querySelector("#editor-priority-enabled").addEventListener("change", (event) => {
      document.querySelector("#editor-priority-order").disabled = !event.currentTarget.checked;
    });
    document.querySelector("#reset-catalog").addEventListener("click", () => {
      if (!window.confirm("Descartar todas as alterações e restaurar o catálogo atual do código?")) return;
      localStorage.removeItem(STORAGE_KEY);
      state.catalog = clone(state.baseline);
      state.selectedStageIndex = 0;
      renderAll();
      setStatus("Catálogo restaurado a partir do código.");
    });

    if (globalThis.WayToolsReportGeneratorDeveloper) initializeCatalog();
    else window.setTimeout(() => {
      if (!state.ready) setStatus("Não foi possível carregar o catálogo do gerador.", true);
    }, 1500);
  }, { once: true });
})();
