(() => {
  "use strict";

  const registry = globalThis.WAY_TOOLS_SCRIPTS || [];
  const scriptsById = new Map(registry.map((script) => [script.id, script]));
  const storageSnapshotPromise = chrome.storage.local.get(null).catch((error) => {
    console.error("[Way Tools] Não foi possível carregar o armazenamento:", error);
    return {};
  });

  function enabledKey(scriptId) {
    return `wayTools.scripts.${scriptId}.enabled`;
  }

  function dataKey(scriptId, key) {
    return `wayTools.data.${scriptId}.${key}`;
  }

  function sharedDataKey(key) {
    return `wayTools.shared.${key}`;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  let writeQueue = Promise.resolve();
  let menuCommandSequence = 0;
  const menuCommands = new Map();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "wayTools:listMenuCommands") {
      sendResponse({
        commands: [...menuCommands.values()].map(({ id, scriptId, label }) => ({
          id,
          scriptId,
          label
        }))
      });
      return false;
    }

    if (message?.type !== "wayTools:executeMenuCommand") {
      return false;
    }

    const command = menuCommands.get(message.commandId);

    if (!command) {
      sendResponse({ ok: false, error: "Comando não encontrado." });
      return false;
    }

    Promise.resolve()
      .then(() => command.callback())
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error(`[Way Tools] Falha ao executar ${command.label}:`, error);
        sendResponse({ ok: false, error: String(error?.message || error) });
      });

    return true;
  });

  globalThis.WayToolsRuntime = Object.freeze({
    registerMenuCommand(scriptId, label, callback) {
      const definition = scriptsById.get(scriptId);

      if (!definition || typeof callback !== "function") {
        return null;
      }

      menuCommandSequence += 1;
      const id = `${scriptId}:${menuCommandSequence}`;
      menuCommands.set(id, {
        id,
        scriptId,
        label: String(label),
        callback
      });
      return id;
    },

    async run(scriptId, start) {
      const definition = scriptsById.get(scriptId);

      if (!definition) {
        console.error(`[Way Tools] Script não cadastrado: ${scriptId}`);
        return;
      }

      const snapshot = await storageSnapshotPromise;
      const configuredValue = snapshot[enabledKey(scriptId)];
      const isEnabled = configuredValue === undefined
        ? definition.defaultEnabled !== false
        : configuredValue === true;

      if (!isEnabled) {
        console.info(`[Way Tools] ${definition.name} está desativado.`);
        return;
      }

      const storage = Object.freeze({
        getValue(key, fallbackValue) {
          const namespacedKey = dataKey(scriptId, key);
          return hasOwn(snapshot, namespacedKey)
            ? snapshot[namespacedKey]
            : fallbackValue;
        },

        setValue(key, value) {
          const namespacedKey = dataKey(scriptId, key);
          snapshot[namespacedKey] = value;

          writeQueue = writeQueue
            .then(() => chrome.storage.local.set({ [namespacedKey]: value }))
            .catch((error) => {
              console.error(`[Way Tools] Falha ao salvar dados de ${definition.name}:`, error);
            });

          return value;
        },

        onValueChanged(key, callback) {
          if (typeof callback !== "function") {
            return () => undefined;
          }

          const namespacedKey = dataKey(scriptId, key);
          const listener = (changes, areaName) => {
            if (areaName !== "local" || !hasOwn(changes, namespacedKey)) {
              return;
            }

            const change = changes[namespacedKey];

            if (change.newValue === undefined) {
              delete snapshot[namespacedKey];
            } else {
              snapshot[namespacedKey] = change.newValue;
            }

            try {
              callback(change.newValue, change.oldValue);
            } catch (error) {
              console.error(`[Way Tools] Falha ao atualizar dados de ${definition.name}:`, error);
            }
          };

          chrome.storage.onChanged.addListener(listener);
          return () => chrome.storage.onChanged.removeListener(listener);
        },

        getSharedValue(key, fallbackValue) {
          const namespacedKey = sharedDataKey(key);
          return hasOwn(snapshot, namespacedKey)
            ? snapshot[namespacedKey]
            : fallbackValue;
        },

        setSharedValue(key, value) {
          const namespacedKey = sharedDataKey(key);
          snapshot[namespacedKey] = value;

          writeQueue = writeQueue
            .then(() => chrome.storage.local.set({ [namespacedKey]: value }))
            .catch((error) => {
              console.error(`[Way Tools] Falha ao salvar dados compartilhados de ${definition.name}:`, error);
            });

          return value;
        },

        onSharedValueChanged(key, callback) {
          if (typeof callback !== "function") {
            return () => undefined;
          }

          const namespacedKey = sharedDataKey(key);
          const listener = (changes, areaName) => {
            if (areaName !== "local" || !hasOwn(changes, namespacedKey)) {
              return;
            }

            const change = changes[namespacedKey];

            if (change.newValue === undefined) {
              delete snapshot[namespacedKey];
            } else {
              snapshot[namespacedKey] = change.newValue;
            }

            try {
              callback(change.newValue, change.oldValue);
            } catch (error) {
              console.error(`[Way Tools] Falha ao atualizar dados compartilhados de ${definition.name}:`, error);
            }
          };

          chrome.storage.onChanged.addListener(listener);
          return () => chrome.storage.onChanged.removeListener(listener);
        }
      });

      try {
        start(storage);
        console.info(`[Way Tools] ${definition.name} v${definition.version} iniciado.`);
      } catch (error) {
        console.error(`[Way Tools] Falha ao iniciar ${definition.name}:`, error);
      }
    }
  });
})();
