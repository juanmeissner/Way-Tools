(() => {
  "use strict";

  const catalogManager = globalThis.WayToolsMessageCatalogs;
  const experienceKeys = Object.freeze({
    n2: "messages.experience.n2.v1",
    sac: "messages.experience.sac.v1"
  });
  const maxRecentMessages = 8;
  const maxHistoryEntries = 20;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function normalizeSector(value) {
    return catalogManager?.normalizeSector?.(value) ||
      (String(value || "").toLocaleLowerCase("pt-BR") === "sac" ? "sac" : "n2");
  }

  function normalizeMessages(value) {
    return catalogManager?.normalizeMessages?.(value) || [];
  }

  function equal(left, right) {
    return catalogManager?.equal?.(left, right) || JSON.stringify(left) === JSON.stringify(right);
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeStringList(value) {
    const entries = Array.isArray(value)
      ? value
      : String(value || "").split(/[,;\n]/);
    return [...new Set(entries.map(normalizeSearchText).filter(Boolean))];
  }

  function emptyExperience(sector) {
    return {
      schemaVersion: 1,
      sector: normalizeSector(sector),
      favorites: [],
      recent: [],
      categoryOrder: [],
      messageOrder: {},
      history: [],
      updatedAt: 0
    };
  }

  function normalizeExperience(sector, value) {
    const normalized = emptyExperience(sector);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return normalized;
    }

    normalized.favorites = [...new Set(
      Array.isArray(value.favorites)
        ? value.favorites.map((id) => String(id || "").trim()).filter(Boolean)
        : []
    )];
    normalized.recent = (Array.isArray(value.recent) ? value.recent : [])
      .map((entry) => ({
        id: String(entry?.id || "").trim(),
        usedAt: Number(entry?.usedAt) || 0,
        count: Math.max(1, Number(entry?.count) || 1)
      }))
      .filter((entry) => entry.id)
      .sort((left, right) => right.usedAt - left.usedAt)
      .slice(0, maxRecentMessages);
    normalized.categoryOrder = [...new Set(
      Array.isArray(value.categoryOrder)
        ? value.categoryOrder.map((id) => String(id || "").trim()).filter(Boolean)
        : []
    )];
    normalized.messageOrder = Object.fromEntries(
      Object.entries(value.messageOrder || {})
        .filter(([, ids]) => Array.isArray(ids))
        .map(([category, ids]) => [
          String(category || "").trim(),
          [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))]
        ])
        .filter(([category]) => category)
    );
    normalized.history = (Array.isArray(value.history) ? value.history : [])
      .filter((entry) => entry && typeof entry === "object" && Array.isArray(entry.messages))
      .slice(-maxHistoryEntries)
      .map((entry) => ({
        id: String(entry.id || "").trim() || `${Number(entry.createdAt) || Date.now()}`,
        action: String(entry.action || "Alteração no catálogo"),
        createdAt: Number(entry.createdAt) || Date.now(),
        messages: normalizeMessages(entry.messages)
      }));
    normalized.updatedAt = Number(value.updatedAt) || 0;
    return normalized;
  }

  function experienceWithStorage(storage, sector) {
    const normalizedSector = normalizeSector(sector);
    return normalizeExperience(
      normalizedSector,
      storage.getSharedValue(experienceKeys[normalizedSector], null)
    );
  }

  function saveExperienceWithStorage(storage, sector, experience) {
    const normalizedSector = normalizeSector(sector);
    const normalized = normalizeExperience(normalizedSector, experience);
    normalized.updatedAt = Date.now();
    storage.setSharedValue(experienceKeys[normalizedSector], clone(normalized));
    return normalized;
  }

  function toggleFavoriteWithStorage(storage, sector, messageId) {
    const id = String(messageId || "").trim();
    const experience = experienceWithStorage(storage, sector);
    if (!id) return experience;
    experience.favorites = experience.favorites.includes(id)
      ? experience.favorites.filter((favoriteId) => favoriteId !== id)
      : [...experience.favorites, id];
    return saveExperienceWithStorage(storage, sector, experience);
  }

  function recordUseWithStorage(storage, sector, messageId) {
    const id = String(messageId || "").trim();
    const experience = experienceWithStorage(storage, sector);
    if (!id) return experience;
    const previous = experience.recent.find((entry) => entry.id === id);
    experience.recent = [
      { id, usedAt: Date.now(), count: (previous?.count || 0) + 1 },
      ...experience.recent.filter((entry) => entry.id !== id)
    ].slice(0, maxRecentMessages);
    return saveExperienceWithStorage(storage, sector, experience);
  }

  function recordHistoryWithStorage(storage, sector, action, messages) {
    const experience = experienceWithStorage(storage, sector);
    const snapshot = normalizeMessages(messages);
    const previous = experience.history[experience.history.length - 1];
    if (previous && equal(previous.messages, snapshot)) return experience;
    experience.history.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: String(action || "Alteração no catálogo"),
      createdAt: Date.now(),
      messages: snapshot
    });
    experience.history = experience.history.slice(-maxHistoryEntries);
    return saveExperienceWithStorage(storage, sector, experience);
  }

  function consumeUndoWithStorage(storage, sector) {
    const experience = experienceWithStorage(storage, sector);
    const entry = experience.history.pop() || null;
    saveExperienceWithStorage(storage, sector, experience);
    return entry ? clone(entry) : null;
  }

  function orderByIds(items, ids, fallbackCompare) {
    const positions = new Map((ids || []).map((id, index) => [id, index]));
    return [...items].sort((left, right) => {
      const leftPosition = positions.has(left.id) ? positions.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightPosition = positions.has(right.id) ? positions.get(right.id) : Number.MAX_SAFE_INTEGER;
      if (leftPosition !== rightPosition) return leftPosition - rightPosition;
      return fallbackCompare(left, right);
    });
  }

  function sortCategories(categories, experience) {
    const normalized = normalizeExperience(experience?.sector || "n2", experience);
    return orderByIds(categories, normalized.categoryOrder, (left, right) =>
      Number(left.ordem || 0) - Number(right.ordem || 0) ||
      String(left.label || "").localeCompare(String(right.label || ""), "pt-BR")
    );
  }

  function sortMessages(messages, category, experience) {
    const normalized = normalizeExperience(experience?.sector || "n2", experience);
    return orderByIds(messages, normalized.messageOrder[String(category || "")], (left, right) =>
      String(left.comando || "").localeCompare(String(right.comando || ""), "pt-BR")
    );
  }

  function moveId(list, id, direction) {
    const result = [...new Set((list || []).map((entry) => String(entry || "").trim()).filter(Boolean))];
    if (!result.includes(id)) result.push(id);
    const from = result.indexOf(id);
    const to = Math.max(0, Math.min(result.length - 1, from + direction));
    if (from !== to) [result[from], result[to]] = [result[to], result[from]];
    return result;
  }

  function moveCategoryWithStorage(storage, sector, categoryId, direction, availableIds = []) {
    const experience = experienceWithStorage(storage, sector);
    const base = [...experience.categoryOrder, ...availableIds.filter((id) => !experience.categoryOrder.includes(id))];
    experience.categoryOrder = moveId(base, categoryId, direction);
    return saveExperienceWithStorage(storage, sector, experience);
  }

  function moveMessageWithStorage(storage, sector, categoryId, messageId, direction, availableIds = []) {
    const experience = experienceWithStorage(storage, sector);
    const current = experience.messageOrder[categoryId] || [];
    const base = [...current, ...availableIds.filter((id) => !current.includes(id))];
    experience.messageOrder[categoryId] = moveId(base, messageId, direction);
    return saveExperienceWithStorage(storage, sector, experience);
  }

  function messageSearchText(message, categoryLabels = {}) {
    const normalized = normalizeSearchText([
      message?.comando,
      categoryLabels[message?.categoria]?.label || categoryLabels[message?.categoria] || "",
      message?.mensagem,
      message?.manha,
      message?.tarde,
      message?.noite,
      message?.templateVisita,
      ...normalizeStringList(message?.sinonimos),
      ...normalizeStringList(message?.palavrasChave)
    ].join(" "));
    return `${normalized} ${normalized.replace(/\s+/g, "")}`.trim();
  }

  function searchMessages(messages, query, categoryLabels = {}, experience = null, limit = 30) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];
    const terms = normalizedQuery.split(" ").filter(Boolean);
    const recentPositions = new Map((experience?.recent || []).map((entry, index) => [entry.id, index]));
    const favoriteIds = new Set(experience?.favorites || []);
    return normalizeMessages(messages)
      .map((message) => {
        const command = normalizeSearchText(message.comando);
        const aliases = normalizeStringList(message.sinonimos);
        const keywords = normalizeStringList(message.palavrasChave);
        const haystack = messageSearchText(message, categoryLabels);
        if (!terms.every((term) => haystack.includes(term))) return null;
        let score = 0;
        if (command === normalizedQuery) score += 1000;
        else if (command.startsWith(normalizedQuery)) score += 700;
        else if (command.includes(normalizedQuery)) score += 450;
        if (aliases.includes(normalizedQuery)) score += 900;
        else if (aliases.some((alias) => alias.startsWith(normalizedQuery))) score += 600;
        if (keywords.some((keyword) => keyword.includes(normalizedQuery))) score += 300;
        if (favoriteIds.has(message.id)) score += 80;
        if (recentPositions.has(message.id)) score += Math.max(0, 40 - recentPositions.get(message.id));
        return { message, score };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score ||
        String(left.message.comando).localeCompare(String(right.message.comando), "pt-BR"))
      .slice(0, limit)
      .map((entry) => entry.message);
  }

  function unresolvedTags(text, values = {}) {
    const missing = new Set();
    String(text || "").replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, name) => {
      const tag = String(name || "").toLocaleLowerCase("pt-BR");
      if (!String(values[tag] ?? "").trim()) missing.add(tag);
      return _match;
    });
    return [...missing];
  }

  globalThis.WayToolsMessageExperience = Object.freeze({
    experienceKeys,
    normalizeSearchText,
    normalizeStringList,
    emptyExperience,
    normalizeExperience,
    experienceWithStorage,
    saveExperienceWithStorage,
    toggleFavoriteWithStorage,
    recordUseWithStorage,
    recordHistoryWithStorage,
    consumeUndoWithStorage,
    sortCategories,
    sortMessages,
    moveCategoryWithStorage,
    moveMessageWithStorage,
    searchMessages,
    unresolvedTags
  });
})();
