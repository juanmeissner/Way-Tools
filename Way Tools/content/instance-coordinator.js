(() => {
  "use strict";

  if (globalThis.WayToolsInstanceCoordinator) {
    return;
  }

  const OFFICIAL_EXTENSION_ID = "nmoechoifhbibhbekfdphmfipeamjged";
  const INSTANCE_ATTRIBUTE = "data-way-tools-extension-instance";
  const HEARTBEAT_INTERVAL_MS = 4_000;
  const STALE_AFTER_MS = 12_000;

  function compareVersions(leftValue, rightValue) {
    const left = String(leftValue || "0").split(/[.-]/);
    const right = String(rightValue || "0").split(/[.-]/);
    const length = Math.max(left.length, right.length);

    for (let index = 0; index < length; index += 1) {
      const leftPart = left[index] ?? "0";
      const rightPart = right[index] ?? "0";
      const leftNumber = Number(leftPart);
      const rightNumber = Number(rightPart);
      const bothNumeric = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
      const comparison = bothNumeric
        ? leftNumber - rightNumber
        : leftPart.localeCompare(rightPart, "pt-BR", { numeric: true });

      if (comparison !== 0) {
        return comparison;
      }
    }

    return 0;
  }

  function chooseOwner(instances) {
    const normalized = [...(Array.isArray(instances) ? instances : [])]
      .filter((instance) => instance?.extensionId)
      .sort((left, right) => {
        const leftOfficial = left.extensionId === OFFICIAL_EXTENSION_ID;
        const rightOfficial = right.extensionId === OFFICIAL_EXTENSION_ID;

        if (leftOfficial !== rightOfficial) {
          return leftOfficial ? -1 : 1;
        }

        const versionComparison = compareVersions(left.version, right.version);

        if (versionComparison !== 0) {
          return -versionComparison;
        }

        return String(left.extensionId).localeCompare(String(right.extensionId));
      });

    return normalized[0] || null;
  }

  const runtimeId = (() => {
    try {
      return String(chrome.runtime.id || "");
    } catch {
      return "";
    }
  })();
  const version = (() => {
    try {
      return String(chrome.runtime.getManifest()?.version || "0");
    } catch {
      return "0";
    }
  })();
  const listeners = new Set();
  let state = Object.freeze({
    extensionId: runtimeId,
    version,
    ownerId: runtimeId,
    ownerVersion: version,
    isOwner: true,
    hasDuplicate: false,
    instanceCount: runtimeId ? 1 : 0
  });

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return () => undefined;
    }

    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  }

  const publicApi = {
    officialExtensionId: OFFICIAL_EXTENSION_ID,
    compareVersions,
    chooseOwner,
    getState: () => state,
    subscribe
  };

  globalThis.WayToolsInstanceCoordinator = Object.freeze(publicApi);

  if (!runtimeId || typeof document === "undefined" || !document.documentElement) {
    return;
  }

  const selector = `[${INSTANCE_ATTRIBUTE}]`;
  let marker = document.querySelector(
    `${selector}[data-extension-id="${runtimeId}"]`
  );

  if (!marker) {
    marker = document.createElement("meta");
    marker.setAttribute(INSTANCE_ATTRIBUTE, "");
    marker.setAttribute("data-extension-id", runtimeId);
    document.documentElement.appendChild(marker);
  }

  function runtimeIsValid() {
    try {
      return chrome.runtime.id === runtimeId;
    } catch {
      return false;
    }
  }

  function publishHeartbeat() {
    if (!runtimeIsValid()) {
      marker.remove();
      return false;
    }

    marker.setAttribute("data-extension-version", version);
    marker.setAttribute(
      "data-extension-official",
      runtimeId === OFFICIAL_EXTENSION_ID ? "true" : "false"
    );
    marker.setAttribute("data-heartbeat", String(Date.now()));
    return true;
  }

  function collectInstances() {
    const now = Date.now();
    const byId = new Map();

    for (const element of document.querySelectorAll(selector)) {
      const extensionId = String(element.getAttribute("data-extension-id") || "");
      const heartbeat = Number(element.getAttribute("data-heartbeat"));

      if (!extensionId || !Number.isFinite(heartbeat) || now - heartbeat > STALE_AFTER_MS) {
        if (element !== marker) {
          element.remove();
        }
        continue;
      }

      const instance = {
        extensionId,
        version: String(element.getAttribute("data-extension-version") || "0")
      };
      const previous = byId.get(extensionId);

      if (!previous || heartbeat > previous.heartbeat) {
        byId.set(extensionId, { ...instance, heartbeat });
      }
    }

    return [...byId.values()];
  }

  function evaluate() {
    const instances = collectInstances();
    const owner = chooseOwner(instances);
    const nextState = Object.freeze({
      extensionId: runtimeId,
      version,
      ownerId: owner?.extensionId || runtimeId,
      ownerVersion: owner?.version || version,
      isOwner: !owner || owner.extensionId === runtimeId,
      hasDuplicate: instances.length > 1,
      instanceCount: instances.length
    });
    const changed = JSON.stringify(nextState) !== JSON.stringify(state);
    state = nextState;

    if (changed) {
      for (const listener of listeners) {
        try {
          listener(state);
        } catch {
          // Uma integração opcional não pode interromper a coordenação.
        }
      }
    }
  }

  publishHeartbeat();
  evaluate();

  const observer = new MutationObserver(evaluate);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "data-extension-id",
      "data-extension-version",
      "data-extension-official",
      "data-heartbeat"
    ]
  });

  const heartbeatTimer = setInterval(() => {
    if (!publishHeartbeat()) {
      clearInterval(heartbeatTimer);
      observer.disconnect();
      return;
    }

    evaluate();
  }, HEARTBEAT_INTERVAL_MS);

  window.addEventListener("pagehide", () => {
    marker.remove();
    clearInterval(heartbeatTimer);
    observer.disconnect();
  }, { once: true });
})();
