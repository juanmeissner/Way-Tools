(() => {
  "use strict";

  const source = globalThis.WAY_TOOLS_MESSAGE_CATALOG || {
    schemaVersion: 2,
    categories: [],
    profiles: {
      n2: { version: 1, legacyNativeIds: [], messages: [] },
      sac: { version: 1, legacyNativeIds: [], messages: [] }
    }
  };
  const sectors = Object.freeze(["n2", "sac"]);
  const stateSchemaVersion = 2;
  const sharedStoragePrefix = "wayTools.shared.";
  const catalogKeys = Object.freeze({
    n2: "messages.catalog.n2.v1",
    sac: "messages.catalog.sac.v1"
  });
  const stateKeys = Object.freeze({
    n2: "messages.catalogState.n2.v2",
    sac: "messages.catalogState.sac.v2"
  });
  const experienceKeys = Object.freeze({
    n2: "messages.experience.n2.v1",
    sac: "messages.experience.sac.v1"
  });

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function normalizeSector(value) {
    return String(value || "").toLocaleLowerCase("pt-BR") === "sac" ? "sac" : "n2";
  }

  function normalizeCommand(value) {
    return String(value || "")
      .trim()
      .replace(/^!+/, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_-]/g, "");
  }

  function normalizeMessages(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    const ids = new Set();
    const commands = new Set();
    const messages = [];

    for (const rawMessage of value) {
      if (!rawMessage || typeof rawMessage !== "object" || Array.isArray(rawMessage)) {
        continue;
      }

      const message = clone(rawMessage);
      const id = String(message.id || "").trim();
      const command = normalizeCommand(message.comando);

      if (!id || !command || ids.has(id) || commands.has(command)) {
        continue;
      }

      message.id = id;
      message.comando = command;
      ids.add(id);
      commands.add(command);
      messages.push(message);
    }

    return messages;
  }

  function canonicalize(value) {
    if (Array.isArray(value)) {
      return value.map(canonicalize);
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }

  function equal(left, right) {
    return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
  }

  function profileFor(sector) {
    const normalizedSector = normalizeSector(sector);
    const profile = source.profiles?.[normalizedSector];

    return {
      version: Number.isInteger(profile?.version) ? profile.version : 1,
      legacyNativeIds: Array.isArray(profile?.legacyNativeIds)
        ? [...new Set(profile.legacyNativeIds.map((id) => String(id || "").trim()).filter(Boolean))]
        : [],
      messages: normalizeMessages(profile?.messages)
    };
  }

  function emptyState(sector) {
    const normalizedSector = normalizeSector(sector);
    return {
      schemaVersion: stateSchemaVersion,
      sector: normalizedSector,
      nativeVersion: profileFor(normalizedSector).version,
      overrides: [],
      customMessages: [],
      deletedNativeIds: []
    };
  }

  function normalizeState(sector, value) {
    const normalizedSector = normalizeSector(sector);

    if (!value || typeof value !== "object" || value.schemaVersion !== stateSchemaVersion) {
      return null;
    }

    return {
      schemaVersion: stateSchemaVersion,
      sector: normalizedSector,
      nativeVersion: Number.isInteger(value.nativeVersion) ? value.nativeVersion : 0,
      overrides: normalizeMessages(value.overrides),
      customMessages: normalizeMessages(value.customMessages),
      deletedNativeIds: [...new Set(
        Array.isArray(value.deletedNativeIds)
          ? value.deletedNativeIds.map((id) => String(id || "").trim()).filter(Boolean)
          : []
      )]
    };
  }

  function deriveLegacyState(sector, storedMessages) {
    const normalizedSector = normalizeSector(sector);
    const profile = profileFor(normalizedSector);
    const state = emptyState(normalizedSector);

    if (!Array.isArray(storedMessages)) {
      return state;
    }

    const stored = normalizeMessages(storedMessages);
    const storedById = new Map(stored.map((message) => [message.id, message]));
    const nativeById = new Map(profile.messages.map((message) => [message.id, message]));
    const legacyIds = new Set(profile.legacyNativeIds);

    for (const nativeMessage of profile.messages) {
      const savedMessage = storedById.get(nativeMessage.id);

      if (!savedMessage) {
        if (legacyIds.has(nativeMessage.id)) {
          state.deletedNativeIds.push(nativeMessage.id);
        }
        continue;
      }

      if (!equal(savedMessage, nativeMessage)) {
        state.overrides.push(savedMessage);
      }
    }

    state.customMessages = stored.filter((message) => !nativeById.has(message.id));
    return state;
  }

  function materialize(sector, rawState) {
    const normalizedSector = normalizeSector(sector);
    const profile = profileFor(normalizedSector);
    const state = normalizeState(normalizedSector, rawState) || emptyState(normalizedSector);
    const deletedIds = new Set(state.deletedNativeIds);
    const nativeIds = new Set(profile.messages.map((message) => message.id));
    const overridesById = new Map(state.overrides.map((message) => [message.id, message]));
    const customById = new Map(state.customMessages.map((message) => [message.id, message]));
    const personalizedMessages = [...state.overrides, ...state.customMessages];
    const personalizedCommands = new Set(personalizedMessages.map((message) => message.comando));
    const result = [];
    const usedIds = new Set();
    const usedCommands = new Set();

    function append(message) {
      if (!message || usedIds.has(message.id) || usedCommands.has(message.comando)) {
        return;
      }

      result.push(clone(message));
      usedIds.add(message.id);
      usedCommands.add(message.comando);
    }

    for (const nativeMessage of profile.messages) {
      if (deletedIds.has(nativeMessage.id)) {
        continue;
      }

      const override = overridesById.get(nativeMessage.id) || customById.get(nativeMessage.id);

      if (override) {
        append(override);
      } else if (!personalizedCommands.has(nativeMessage.comando)) {
        append(nativeMessage);
      }
    }

    for (const override of state.overrides) {
      if (!nativeIds.has(override.id)) {
        append(override);
      }
    }

    state.customMessages.forEach(append);
    return result;
  }

  function deriveSavedState(sector, effectiveMessages, previousState) {
    const normalizedSector = normalizeSector(sector);
    const profile = profileFor(normalizedSector);
    const effective = normalizeMessages(effectiveMessages);
    const effectiveById = new Map(effective.map((message) => [message.id, message]));
    const nativeById = new Map(profile.messages.map((message) => [message.id, message]));
    const previous = normalizeState(normalizedSector, previousState);
    const state = emptyState(normalizedSector);

    for (const nativeMessage of profile.messages) {
      const savedMessage = effectiveById.get(nativeMessage.id);

      if (!savedMessage) {
        state.deletedNativeIds.push(nativeMessage.id);
      } else if (!equal(savedMessage, nativeMessage)) {
        state.overrides.push(savedMessage);
      }
    }

    if (previous) {
      for (const deletedId of previous.deletedNativeIds) {
        if (!nativeById.has(deletedId)) {
          state.deletedNativeIds.push(deletedId);
        }
      }
    }

    state.deletedNativeIds = [...new Set(state.deletedNativeIds)];
    state.customMessages = effective.filter((message) => !nativeById.has(message.id));
    return state;
  }

  function resolve(sector, storedMessages, storedState) {
    const normalizedSector = normalizeSector(sector);
    const existingState = normalizeState(normalizedSector, storedState);
    const state = existingState
      ? clone(existingState)
      : deriveLegacyState(normalizedSector, storedMessages);
    state.nativeVersion = profileFor(normalizedSector).version;
    const messages = materialize(normalizedSector, state);

    return {
      sector: normalizedSector,
      messages,
      state,
      catalogChanged: !Array.isArray(storedMessages) || !equal(normalizeMessages(storedMessages), messages),
      stateChanged: !equal(existingState, state)
    };
  }

  function ensureWithStorage(storage, sector) {
    const normalizedSector = normalizeSector(sector);
    const catalogKey = catalogKeys[normalizedSector];
    const stateKey = stateKeys[normalizedSector];
    const resolved = resolve(
      normalizedSector,
      storage.getSharedValue(catalogKey, null),
      storage.getSharedValue(stateKey, null)
    );

    if (resolved.catalogChanged) {
      storage.setSharedValue(catalogKey, clone(resolved.messages));
    }

    if (resolved.stateChanged) {
      storage.setSharedValue(stateKey, clone(resolved.state));
    }

    return clone(resolved.messages);
  }

  function saveWithStorage(storage, sector, messages) {
    const normalizedSector = normalizeSector(sector);
    const catalogKey = catalogKeys[normalizedSector];
    const stateKey = stateKeys[normalizedSector];
    const state = deriveSavedState(
      normalizedSector,
      messages,
      storage.getSharedValue(stateKey, null)
    );
    const effectiveMessages = materialize(normalizedSector, state);

    storage.setSharedValue(stateKey, clone(state));
    storage.setSharedValue(catalogKey, clone(effectiveMessages));
    return clone(effectiveMessages);
  }

  async function ensureWithChromeStorage(sector) {
    const normalizedSector = normalizeSector(sector);
    const catalogKey = `${sharedStoragePrefix}${catalogKeys[normalizedSector]}`;
    const stateKey = `${sharedStoragePrefix}${stateKeys[normalizedSector]}`;
    const stored = await chrome.storage.local.get([catalogKey, stateKey]);
    const resolved = resolve(normalizedSector, stored[catalogKey], stored[stateKey]);
    const updates = {};

    if (resolved.catalogChanged) {
      updates[catalogKey] = clone(resolved.messages);
    }

    if (resolved.stateChanged) {
      updates[stateKey] = clone(resolved.state);
    }

    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
    }

    return clone(resolved.messages);
  }

  function nativeMessages(sector) {
    return clone(profileFor(sector).messages);
  }

  function categoriesForSector(sector) {
    const normalizedSector = normalizeSector(sector);
    return (Array.isArray(source.categories) ? source.categories : [])
      .filter((category) => category?.setores?.includes(normalizedSector))
      .sort((left, right) => Number(left.ordem || 0) - Number(right.ordem || 0))
      .map(clone);
  }

  function categoryMap(sector) {
    return Object.fromEntries(
      categoriesForSector(sector).map((category) => [category.id, { label: category.label }])
    );
  }

  function experience(method, ...args) {
    return globalThis.WayToolsMessageExperience?.[method]?.(...args);
  }

  const normalizeSearchText = (...args) => experience("normalizeSearchText", ...args) || "";
  const normalizeStringList = (...args) => experience("normalizeStringList", ...args) || [];
  const emptyExperience = (...args) => experience("emptyExperience", ...args) || null;
  const normalizeExperience = (...args) => experience("normalizeExperience", ...args) || null;
  const experienceWithStorage = (...args) => experience("experienceWithStorage", ...args) || null;
  const saveExperienceWithStorage = (...args) => experience("saveExperienceWithStorage", ...args) || null;
  const toggleFavoriteWithStorage = (...args) => experience("toggleFavoriteWithStorage", ...args) || null;
  const recordUseWithStorage = (...args) => experience("recordUseWithStorage", ...args) || null;
  const recordHistoryWithStorage = (...args) => experience("recordHistoryWithStorage", ...args) || null;
  const consumeUndoWithStorage = (...args) => experience("consumeUndoWithStorage", ...args) || null;
  const sortCategories = (...args) => experience("sortCategories", ...args) || args[0] || [];
  const sortMessages = (...args) => experience("sortMessages", ...args) || args[0] || [];
  const moveCategoryWithStorage = (...args) => experience("moveCategoryWithStorage", ...args) || null;
  const moveMessageWithStorage = (...args) => experience("moveMessageWithStorage", ...args) || null;
  const searchMessages = (...args) => experience("searchMessages", ...args) || [];
  const unresolvedTags = (...args) => experience("unresolvedTags", ...args) || [];

  globalThis.WayToolsMessageCatalogs = Object.freeze({
    sectors,
    catalogKeys,
    stateKeys,
    experienceKeys,
    normalizeSector,
    normalizeMessages,
    equal,
    normalizeSearchText,
    normalizeStringList,
    nativeMessages,
    categoriesForSector,
    categoryMap,
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
    unresolvedTags,
    resolve,
    materialize,
    deriveSavedState,
    ensureWithStorage,
    saveWithStorage,
    ensureWithChromeStorage
  });
})();
