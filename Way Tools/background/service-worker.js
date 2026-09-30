"use strict";

const CHATWOOT_ORIGIN = "https://ia-nocodb.internetway.com.br";
const MESSAGE_TYPE = "wayTools:iaMessageNotification";
const DESTINATION_PREFIX = "wayTools.notificationDestination.";
const CLEAR_ALARM_PREFIX = "wayTools.clearNotification.";
const DURATION_STORAGE_KEY = "wayTools.notifications.duration";
const DEFAULT_DURATION = "5";
const ALLOWED_DURATIONS = new Set(["disabled", "windows", "1", "2", "5", "10", "30", "60", "persistent"]);
const recentFingerprints = new Map();
const autoClearTimeouts = new Map();
const DEDUPLICATION_WINDOW_MS = 60_000;

function normalizeText(value, maximumLength) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!maximumLength || normalized.length <= maximumLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
}

function hashText(value) {
  let hash = 2166136261;

  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function isTrustedSender(sender) {
  try {
    return new URL(sender?.url || "").origin === CHATWOOT_ORIGIN;
  } catch {
    return false;
  }
}

function isAllowedDestination(url) {
  try {
    return new URL(String(url || "")).origin === CHATWOOT_ORIGIN;
  } catch {
    return false;
  }
}

function clearExpiredFingerprints(now) {
  for (const [fingerprint, createdAt] of recentFingerprints) {
    if (now - createdAt > DEDUPLICATION_WINDOW_MS) {
      recentFingerprints.delete(fingerprint);
    }
  }
}

function storeDestination(notificationId, sender, url) {
  return chrome.storage.session.set({
    [`${DESTINATION_PREFIX}${notificationId}`]: {
      tabId: sender?.tab?.id,
      url: normalizeText(url, 2_000)
    }
  });
}

function getNotificationDuration(callback) {
  chrome.storage.local.get(
    { [DURATION_STORAGE_KEY]: DEFAULT_DURATION },
    (stored) => {
      const error = chrome.runtime.lastError;
      const value = error ? DEFAULT_DURATION : String(stored[DURATION_STORAGE_KEY] || "");
      callback(ALLOWED_DURATIONS.has(value) ? value : DEFAULT_DURATION);
    }
  );
}

function clearAutoCloseSchedule(notificationId) {
  const timeoutId = autoClearTimeouts.get(notificationId);

  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    autoClearTimeouts.delete(notificationId);
  }

  chrome.alarms.clear(`${CLEAR_ALARM_PREFIX}${notificationId}`, () => {
    void chrome.runtime.lastError;
  });
}

function removeNotification(notificationId) {
  chrome.notifications.clear(notificationId, () => {
    void chrome.runtime.lastError;
  });
}

function scheduleAutoClose(notificationId, duration) {
  clearAutoCloseSchedule(notificationId);

  const seconds = Number(duration);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  if (seconds < 30) {
    const timeoutId = setTimeout(() => {
      autoClearTimeouts.delete(notificationId);
      removeNotification(notificationId);
    }, seconds * 1000);
    autoClearTimeouts.set(notificationId, timeoutId);
    return;
  }

  chrome.alarms.create(
    `${CLEAR_ALARM_PREFIX}${notificationId}`,
    { when: Date.now() + seconds * 1000 }
  );
}

function createNotification(message, sender, sendResponse) {
  if (!isTrustedSender(sender)) {
    sendResponse({ ok: false, error: "Origem não autorizada." });
    return;
  }

  getNotificationDuration((duration) => {
    if (duration === "disabled") {
      sendResponse({ ok: true, disabled: true });
      return;
    }

    const now = Date.now();
    const fingerprint = normalizeText(message.fingerprint, 500);

    clearExpiredFingerprints(now);

    if (!fingerprint || recentFingerprints.has(fingerprint)) {
      sendResponse({ ok: true, duplicate: true });
      return;
    }

    recentFingerprints.set(fingerprint, now);

    const conversationKey = normalizeText(message.conversationKey, 200) || fingerprint;
    const notificationId = `way-tools-ia-${hashText(conversationKey)}`;
    const customerName = normalizeText(message.customerName, 80) || "Cliente";
    const preview = normalizeText(message.preview, 220) || "Nova mensagem recebida.";
    const requestedUrl = normalizeText(message.url, 2_000);
    const destinationUrl = isAllowedDestination(requestedUrl)
      ? requestedUrl
      : sender.url;

    clearAutoCloseSchedule(notificationId);

    chrome.notifications.create(
      notificationId,
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("128.png"),
        title: customerName,
        message: preview,
        priority: 2,
        requireInteraction: duration !== "windows",
        silent: false
      },
      (createdId) => {
        const error = chrome.runtime.lastError;

        if (error) {
          recentFingerprints.delete(fingerprint);
          sendResponse({ ok: false, error: error.message });
          return;
        }

        const finalNotificationId = createdId || notificationId;
        scheduleAutoClose(finalNotificationId, duration);

        storeDestination(finalNotificationId, sender, destinationUrl)
          .catch(() => undefined)
          .finally(() => sendResponse({
            ok: true,
            notificationId: finalNotificationId,
            duration
          }));
      }
    );
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== MESSAGE_TYPE) {
    return false;
  }

  createNotification(message, sender, sendResponse);
  return true;
});

async function focusNotificationDestination(notificationId) {
  const storageKey = `${DESTINATION_PREFIX}${notificationId}`;
  const stored = await chrome.storage.session.get(storageKey);
  const destination = stored[storageKey];

  if (!destination) {
    return;
  }

  if (Number.isInteger(destination.tabId)) {
    try {
      const tab = await chrome.tabs.get(destination.tabId);
      await chrome.tabs.update(destination.tabId, { active: true });

      if (Number.isInteger(tab.windowId)) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }

      return;
    } catch {
      // A aba pode ter sido fechada desde a criação da notificação.
    }
  }

  if (isAllowedDestination(destination.url)) {
    await chrome.tabs.create({ url: destination.url });
  }
}

chrome.notifications.onClicked.addListener((notificationId) => {
  clearAutoCloseSchedule(notificationId);
  focusNotificationDestination(notificationId).catch(() => undefined);
  chrome.notifications.clear(notificationId, () => void chrome.runtime.lastError);
});

chrome.notifications.onClosed.addListener((notificationId) => {
  clearAutoCloseSchedule(notificationId);
  chrome.storage.session
    .remove(`${DESTINATION_PREFIX}${notificationId}`)
    .catch(() => undefined);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith(CLEAR_ALARM_PREFIX)) {
    return;
  }

  const notificationId = alarm.name.slice(CLEAR_ALARM_PREFIX.length);
  removeNotification(notificationId);
});
