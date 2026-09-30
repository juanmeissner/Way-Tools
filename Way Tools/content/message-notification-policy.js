(() => {
  "use strict";

  const DEFAULT_REPEAT_COOLDOWN_MS = 60_000;
  const INACTIVITY_LEVEL_ORDER = Object.freeze({
    normal: 0,
    yellow: 1,
    orange: 2,
    red: 3
  });

  function normalizeText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isCurrentActivityLabel(value) {
    const normalized = normalizeText(value).toLocaleLowerCase("pt-BR");
    return normalized === "now" || normalized === "agora";
  }

  function createSignature({ conversationKey, preview, unreadCount }) {
    return [
      normalizeText(conversationKey),
      normalizeText(preview).toLocaleLowerCase("pt-BR"),
      Number.isFinite(Number(unreadCount)) ? Number(unreadCount) : 0
    ].join("|");
  }

  function shouldNotifyInactivityTransition(previousLevel, currentLevel, options = {}) {
    const enabled = options.enabled === true;
    const warmingUp = options.warmingUp === true;
    const previousOrder = INACTIVITY_LEVEL_ORDER[previousLevel] ?? 0;
    const currentOrder = INACTIVITY_LEVEL_ORDER[currentLevel] ?? 0;

    return enabled && !warmingUp && currentOrder > 0 && currentOrder > previousOrder;
  }

  function evaluate(previous, current, options = {}) {
    const now = Number.isFinite(options.now) ? options.now : Date.now();
    const warmingUp = options.warmingUp === true;
    const suppressNotification = options.suppressNotification === true;
    const repeatCooldownMs = Number.isFinite(options.repeatCooldownMs)
      ? Math.max(0, options.repeatCooldownMs)
      : DEFAULT_REPEAT_COOLDOWN_MS;

    const next = {
      isNow: current.isNow === true,
      isOutgoing: current.isOutgoing === true,
      signature: normalizeText(current.signature),
      lastNotifiedSignature: previous?.lastNotifiedSignature || "",
      lastNotifiedAt: Number(previous?.lastNotifiedAt) || 0,
      seenAt: now
    };

    if (warmingUp || suppressNotification || !next.isNow || next.isOutgoing) {
      return { notify: false, next };
    }

    const firstObservation = !previous;
    const signatureChanged = Boolean(previous) && previous.signature !== next.signature;
    const transitionedToNow = Boolean(previous) && previous.isNow !== true;
    const repeatedSignatureAllowed =
      next.signature !== next.lastNotifiedSignature ||
      now - next.lastNotifiedAt >= repeatCooldownMs;

    const notify =
      firstObservation ||
      signatureChanged ||
      (transitionedToNow && repeatedSignatureAllowed);

    if (notify) {
      next.lastNotifiedSignature = next.signature;
      next.lastNotifiedAt = now;
    }

    return { notify, next };
  }

  globalThis.WayToolsMessageNotificationPolicy = Object.freeze({
    createSignature,
    evaluate,
    isCurrentActivityLabel,
    normalizeText,
    shouldNotifyInactivityTransition
  });
})();
