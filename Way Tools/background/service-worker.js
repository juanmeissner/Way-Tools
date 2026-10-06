"use strict";

const CHATWOOT_ORIGIN = "https://ia-nocodb.internetway.com.br";
const MESSAGE_TYPE = "wayTools:iaMessageNotification";
const INACTIVITY_SYNC_TYPE = "wayTools:syncChatwootInactivity";
const INACTIVITY_CANCEL_TYPE = "wayTools:cancelChatwootInactivity";
const INACTIVITY_RECONCILE_TYPE = "wayTools:reconcileChatwootInactivity";
const NOTIFICATION_OWNER_TYPE = "wayTools:setChatwootNotificationOwner";
const DESTINATION_PREFIX = "wayTools.notificationDestination.";
const EXPIRATION_PREFIX = "wayTools.notificationExpiration.";
const CLEAR_ALARM_PREFIX = "wayTools.clearNotification.";
const INACTIVITY_STATE_PREFIX = "wayTools.chatwootInactivityState.";
const INACTIVITY_ALARM_PREFIX = "wayTools.chatwootInactivityAlarm.";
const DURATION_STORAGE_KEY = "wayTools.notifications.duration";
const NOTIFY_WHEN_FOCUSED_STORAGE_KEY = "wayTools.notifications.whenFocused";
const NOTIFICATION_OWNER_SESSION_KEY = "wayTools.chatwootNotificationOwner.enabled";
const N2_MESSAGE_CATALOG_STORAGE_KEY = "wayTools.shared.messages.catalog.n2.v1";
const LEGACY_MESSAGE_CATALOG_STORAGE_KEYS = Object.freeze([
  "wayTools.shared.messages.catalog.v1",
  "wayTools.data.way-mensagens.way-mensagens-personalizadas-v1",
  "wayTools.data.matrix-mensagens.way-matrix-mensagens-personalizadas-v1"
]);
const DEFAULT_DURATION = "5";
const ALLOWED_DURATIONS = new Set(["disabled", "windows", "1", "2", "5", "10", "30", "60", "persistent"]);
const recentFingerprints = new Map();
const autoClearTimeouts = new Map();
let restoreSchedulesPromise = null;
let restoreInactivityPromise = null;
const DEDUPLICATION_WINDOW_MS = 60_000;
const MINIMUM_ALARM_DELAY_MS = 30_000;
const INACTIVITY_LEVELS = Object.freeze({
  yellow: Object.freeze({ icon: "🟡", label: "Atenção" }),
  orange: Object.freeze({ icon: "🟠", label: "Atenção elevada" }),
  red: Object.freeze({ icon: "🔴", label: "Crítico" })
});

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

async function migrateLegacyMessageCatalog() {
  const stored = await chrome.storage.local.get([
    N2_MESSAGE_CATALOG_STORAGE_KEY,
    ...LEGACY_MESSAGE_CATALOG_STORAGE_KEYS
  ]);

  if (Array.isArray(stored[N2_MESSAGE_CATALOG_STORAGE_KEY])) {
    return;
  }

  const legacyCatalog = LEGACY_MESSAGE_CATALOG_STORAGE_KEYS
    .map((key) => stored[key])
    .find((catalog) => Array.isArray(catalog));

  if (!legacyCatalog) {
    return;
  }

  await chrome.storage.local.set({
    [N2_MESSAGE_CATALOG_STORAGE_KEY]: legacyCatalog
  });
}

function clearExpiredFingerprints(now) {
  for (const [fingerprint, createdAt] of recentFingerprints) {
    if (now - createdAt > DEDUPLICATION_WINDOW_MS) {
      recentFingerprints.delete(fingerprint);
    }
  }
}

async function getNotificationDuration() {
  const stored = await chrome.storage.local.get({
    [DURATION_STORAGE_KEY]: DEFAULT_DURATION
  });
  const value = String(stored[DURATION_STORAGE_KEY] || "");
  return ALLOWED_DURATIONS.has(value) ? value : DEFAULT_DURATION;
}

function destinationStorageKey(notificationId) {
  return `${DESTINATION_PREFIX}${notificationId}`;
}

function expirationStorageKey(notificationId) {
  return `${EXPIRATION_PREFIX}${notificationId}`;
}

function alarmName(notificationId) {
  return `${CLEAR_ALARM_PREFIX}${notificationId}`;
}

async function storeDestination(notificationId, sender, url) {
  await chrome.storage.session.set({
    [destinationStorageKey(notificationId)]: {
      tabId: sender?.tab?.id,
      url: normalizeText(url, 2_000)
    }
  });
}

async function clearAutoCloseSchedule(notificationId, options = {}) {
  const timeoutId = autoClearTimeouts.get(notificationId);

  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    autoClearTimeouts.delete(notificationId);
  }

  try {
    await chrome.alarms.clear(alarmName(notificationId));
  } catch {
    // A ausência de um alarme anterior não impede um novo agendamento.
  }

  if (options.keepExpiration !== true) {
    await chrome.storage.session
      .remove(expirationStorageKey(notificationId))
      .catch(() => undefined);
  }
}

async function removeNotification(notificationId) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await chrome.notifications.clear(notificationId);
      const activeNotifications = await chrome.notifications.getAll();

      if (!Object.prototype.hasOwnProperty.call(activeNotifications, notificationId)) {
        return true;
      }
    } catch {
      // Uma nova tentativa é feita logo abaixo.
    }
  }

  return false;
}

async function expireNotification(notificationId) {
  const timeoutId = autoClearTimeouts.get(notificationId);

  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    autoClearTimeouts.delete(notificationId);
  }

  await Promise.allSettled([
    chrome.alarms.clear(alarmName(notificationId)),
    removeNotification(notificationId)
  ]);

  await chrome.storage.session
    .remove([
      expirationStorageKey(notificationId),
      destinationStorageKey(notificationId)
    ])
    .catch(() => undefined);
}

async function scheduleAutoClose(notificationId, duration, knownExpiration) {
  const seconds = Number(duration);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  await clearAutoCloseSchedule(notificationId);

  const now = Date.now();
  const expiresAt = Number.isFinite(knownExpiration)
    ? knownExpiration
    : now + seconds * 1000;
  const remaining = Math.max(0, expiresAt - now);

  await chrome.storage.session.set({
    [expirationStorageKey(notificationId)]: {
      notificationId,
      expiresAt
    }
  });

  if (remaining === 0) {
    await expireNotification(notificationId);
    return;
  }

  const timeoutId = setTimeout(() => {
    void expireNotification(notificationId);
  }, remaining);
  autoClearTimeouts.set(notificationId, timeoutId);

  /*
   * O timeout é o caminho mais preciso enquanto o service worker permanece
   * ativo. O alarme é a segurança caso o Chrome encerre o worker. Para prazos
   * menores que 30 segundos, o alarme pode executar mais tarde, mas impede que
   * a notificação fique permanente caso o timeout seja perdido.
   */
  const alarmWhen = Math.max(expiresAt, now + MINIMUM_ALARM_DELAY_MS);

  try {
    await chrome.alarms.create(alarmName(notificationId), { when: alarmWhen });
  } catch (error) {
    console.warn("[Way Tools] Não foi possível criar o alarme de expiração:", error);
  }
}

async function performRestoreAutoCloseSchedules() {
  let stored;
  let activeNotifications;

  try {
    [stored, activeNotifications] = await Promise.all([
      chrome.storage.session.get(null),
      chrome.notifications.getAll()
    ]);
  } catch {
    return;
  }

  const expirationEntries = Object.entries(stored)
    .filter(([key]) => key.startsWith(EXPIRATION_PREFIX));

  for (const [key, expiration] of expirationEntries) {
    const notificationId = normalizeText(expiration?.notificationId, 500) ||
      key.slice(EXPIRATION_PREFIX.length);
    const expiresAt = Number(expiration?.expiresAt);

    if (!Object.prototype.hasOwnProperty.call(activeNotifications, notificationId)) {
      await chrome.storage.session.remove(key).catch(() => undefined);
      continue;
    }

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await expireNotification(notificationId);
      continue;
    }

    const durationSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
    await scheduleAutoClose(notificationId, String(durationSeconds), expiresAt);
  }
}

async function restoreAutoCloseSchedules() {
  if (restoreSchedulesPromise) {
    return restoreSchedulesPromise;
  }

  restoreSchedulesPromise = performRestoreAutoCloseSchedules();

  try {
    return await restoreSchedulesPromise;
  } finally {
    restoreSchedulesPromise = null;
  }
}

function normalizePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeTimestamp(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  return number < 1_000_000_000_000 ? number * 1000 : number;
}

function inactivityStateKey(accountId, conversationId) {
  return `${INACTIVITY_STATE_PREFIX}${accountId}.${conversationId}`;
}

function inactivityAlarmName(accountId, conversationId, level) {
  return `${INACTIVITY_ALARM_PREFIX}${accountId}.${conversationId}.${level}`;
}

function parseInactivityAlarmName(name) {
  if (!String(name || "").startsWith(INACTIVITY_ALARM_PREFIX)) {
    return null;
  }

  const [accountIdValue, conversationIdValue, level] = name
    .slice(INACTIVITY_ALARM_PREFIX.length)
    .split(".");
  const accountId = normalizePositiveInteger(accountIdValue);
  const conversationId = normalizePositiveInteger(conversationIdValue);

  if (!accountId || !conversationId || !INACTIVITY_LEVELS[level]) {
    return null;
  }

  return { accountId, conversationId, level };
}

function normalizeInactivityLevels(levels) {
  return Object.fromEntries(
    Object.keys(INACTIVITY_LEVELS).map((level) => {
      const minutes = normalizePositiveInteger(levels?.[level]?.minutes);
      return [level, {
        enabled: levels?.[level]?.enabled === true && minutes !== null,
        minutes: minutes || 0
      }];
    })
  );
}

async function clearConversationInactivity(accountId, conversationId) {
  await Promise.allSettled(
    Object.keys(INACTIVITY_LEVELS).map((level) =>
      chrome.alarms.clear(inactivityAlarmName(accountId, conversationId, level))
    )
  );
  await chrome.storage.session
    .remove(inactivityStateKey(accountId, conversationId))
    .catch(() => undefined);
}

async function scheduleConversationInactivity(message, sender) {
  if (!isTrustedSender(sender)) {
    return { ok: false, error: "Origem não autorizada." };
  }

  if (!await isNotificationOwnerEnabled()) {
    return { ok: true, scheduled: false, reason: "duplicate-installation" };
  }

  const accountId = normalizePositiveInteger(message?.conversation?.accountId);
  const conversationId = normalizePositiveInteger(message?.conversation?.conversationId);
  const lastActivityAt = normalizeTimestamp(message?.conversation?.lastActivityAt);

  if (!accountId || !conversationId || !lastActivityAt) {
    return { ok: false, error: "Conversa ou horário de atividade inválido." };
  }

  const requireAgentLastMessage = message.requireAgentLastMessage !== false;
  const lastMessageFromAgent = message?.conversation?.lastMessageFromAgent === true;

  if (requireAgentLastMessage && !lastMessageFromAgent) {
    await clearConversationInactivity(accountId, conversationId);
    return {
      ok: true,
      scheduled: false,
      reason: "last-message-not-from-agent"
    };
  }

  const levels = normalizeInactivityLevels(message.levels);
  const suppressPastLevels = message.suppressPastLevels === true;
  const now = Date.now();
  const key = inactivityStateKey(accountId, conversationId);
  const stored = await chrome.storage.session.get(key).catch(() => ({}));
  const previousState = stored[key];
  const sameActivity = normalizeTimestamp(previousState?.lastActivityAt) === lastActivityAt;
  const notifiedLevels = sameActivity
    ? { ...previousState?.notifiedLevels }
    : {};

  await clearConversationInactivity(accountId, conversationId);

  for (const [level, configuration] of Object.entries(levels)) {
    if (!configuration.enabled) {
      continue;
    }

    const triggerAt = lastActivityAt + configuration.minutes * 60_000;

    if (triggerAt <= now && suppressPastLevels && !sameActivity) {
      notifiedLevels[level] = true;
      continue;
    }

    await chrome.alarms.create(
      inactivityAlarmName(accountId, conversationId, level),
      { when: Math.max(triggerAt, now + 100) }
    );
  }

  const state = {
    accountId,
    conversationId,
    tabId: sender?.tab?.id,
    customerName: normalizeText(message.conversation.customerName, 80) || "Cliente",
    preview: normalizeText(message.conversation.preview, 220),
    url: isAllowedDestination(message.conversation.url)
      ? normalizeText(message.conversation.url, 2_000)
      : sender.url,
    lastActivityAt,
    lastMessageFromAgent,
    requireAgentLastMessage,
    levels,
    notifiedLevels
  };

  await chrome.storage.session.set({
    [key]: state
  });

  return { ok: true, scheduled: true };
}

async function cancelConversationInactivity(message, sender) {
  if (!isTrustedSender(sender)) {
    return { ok: false, error: "Origem não autorizada." };
  }

  const accountId = normalizePositiveInteger(message.accountId);
  const conversationId = normalizePositiveInteger(message.conversationId);

  if (!accountId || !conversationId) {
    return { ok: false, error: "Conversa inválida." };
  }

  await clearConversationInactivity(accountId, conversationId);
  return { ok: true, cancelled: true };
}

async function reconcileConversationInactivity(message, sender) {
  if (!isTrustedSender(sender)) {
    return { ok: false, error: "Origem não autorizada." };
  }

  const accountId = normalizePositiveInteger(message.accountId);

  if (!accountId || !Array.isArray(message.conversationIds)) {
    return { ok: false, error: "Lista de conversas inválida." };
  }

  const assignedConversationIds = new Set(
    message.conversationIds
      .map(normalizePositiveInteger)
      .filter(Boolean)
  );
  const stored = await chrome.storage.session.get(null).catch(() => ({}));
  const accountPrefix = `${INACTIVITY_STATE_PREFIX}${accountId}.`;
  const staleConversationIds = Object.keys(stored)
    .filter((key) => key.startsWith(accountPrefix))
    .map((key) => normalizePositiveInteger(key.slice(accountPrefix.length)))
    .filter((conversationId) =>
      conversationId && !assignedConversationIds.has(conversationId)
    );

  await Promise.all(
    staleConversationIds.map((conversationId) =>
      clearConversationInactivity(accountId, conversationId)
    )
  );

  return {
    ok: true,
    reconciled: true,
    removed: staleConversationIds.length
  };
}

async function isNotificationOwnerEnabled() {
  const stored = await chrome.storage.session
    .get(NOTIFICATION_OWNER_SESSION_KEY)
    .catch(() => ({}));

  return stored[NOTIFICATION_OWNER_SESSION_KEY] !== false;
}

async function clearNotificationArtifactsForThisInstallation() {
  const [stored, alarms, notifications] = await Promise.all([
    chrome.storage.session.get(null).catch(() => ({})),
    typeof chrome.alarms.getAll === "function"
      ? chrome.alarms.getAll().catch(() => [])
      : Promise.resolve([]),
    chrome.notifications.getAll().catch(() => ({}))
  ]);
  const artifactKeys = Object.keys(stored).filter((key) =>
    key.startsWith(INACTIVITY_STATE_PREFIX) ||
    key.startsWith(DESTINATION_PREFIX) ||
    key.startsWith(EXPIRATION_PREFIX)
  );
  const alarmNames = alarms
    .map((alarm) => alarm?.name)
    .filter((name) =>
      typeof name === "string" &&
      (name.startsWith(INACTIVITY_ALARM_PREFIX) || name.startsWith(CLEAR_ALARM_PREFIX))
    );
  const notificationIds = Object.keys(notifications).filter((id) =>
    id.startsWith("way-tools-ia-")
  );

  for (const timeoutId of autoClearTimeouts.values()) {
    clearTimeout(timeoutId);
  }
  autoClearTimeouts.clear();
  recentFingerprints.clear();

  await Promise.allSettled([
    ...alarmNames.map((name) => chrome.alarms.clear(name)),
    ...notificationIds.map((id) => chrome.notifications.clear(id)),
    artifactKeys.length > 0
      ? chrome.storage.session.remove(artifactKeys)
      : Promise.resolve()
  ]);

  return {
    alarms: alarmNames.length,
    notifications: notificationIds.length,
    storageEntries: artifactKeys.length
  };
}

async function setNotificationOwnerState(message, sender) {
  if (!isTrustedSender(sender)) {
    return { ok: false, error: "Origem não autorizada." };
  }

  const enabled = message.enabled === true;
  await chrome.storage.session.set({
    [NOTIFICATION_OWNER_SESSION_KEY]: enabled
  });

  if (enabled) {
    return { ok: true, enabled: true };
  }

  const cleared = await clearNotificationArtifactsForThisInstallation();
  return { ok: true, enabled: false, cleared };
}

async function chatwootTabIsForeground(tabId) {
  try {
    const stored = await chrome.storage.local.get({
      [NOTIFY_WHEN_FOCUSED_STORAGE_KEY]: false
    });

    if (stored[NOTIFY_WHEN_FOCUSED_STORAGE_KEY] === true) {
      return false;
    }

    const tabs = typeof chrome.tabs.query === "function"
      ? await chrome.tabs.query({ active: true })
      : [];

    if (Number.isInteger(tabId) && !tabs.some((tab) => tab.id === tabId)) {
      try {
        tabs.push(await chrome.tabs.get(tabId));
      } catch {
        // A aba original pode ter sido fechada, mas outra aba do ChatWoot ainda pode estar ativa.
      }
    }

    for (const tab of tabs) {
      if (!tab?.active || !Number.isInteger(tab.windowId)) {
        continue;
      }

      const isTrackedTab = Number.isInteger(tabId) && tab.id === tabId;

      if (!isTrackedTab && !isAllowedDestination(tab.url)) {
        continue;
      }

      const window = await chrome.windows.get(tab.windowId);

      if (window.focused === true) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

async function handleInactivityAlarm(alarm) {
  const parsed = parseInactivityAlarmName(alarm.name);

  if (!parsed) {
    return false;
  }

  if (!await isNotificationOwnerEnabled()) {
    await clearConversationInactivity(parsed.accountId, parsed.conversationId);
    return true;
  }

  const key = inactivityStateKey(parsed.accountId, parsed.conversationId);
  const stored = await chrome.storage.session.get(key);
  const state = stored[key];
  const configuration = state?.levels?.[parsed.level];

  if (
    !state ||
    !configuration?.enabled ||
    state.notifiedLevels?.[parsed.level] ||
    state.requireAgentLastMessage !== false && state.lastMessageFromAgent !== true
  ) {
    return true;
  }

  const triggerAt = state.lastActivityAt + configuration.minutes * 60_000;

  if (Date.now() + 1_000 < triggerAt) {
    await chrome.alarms.create(alarm.name, { when: triggerAt });
    return true;
  }

  state.notifiedLevels = {
    ...state.notifiedLevels,
    [parsed.level]: true
  };
  await chrome.storage.session.set({ [key]: state });

  if (await chatwootTabIsForeground(state.tabId)) {
    return true;
  }

  const details = INACTIVITY_LEVELS[parsed.level];
  const minutes = configuration.minutes;
  await createNotification({
    fingerprint: `chatwoot-inactivity:${parsed.accountId}:${parsed.conversationId}:${state.lastActivityAt}:${parsed.level}`,
    conversationKey: `conversation:${parsed.conversationId}`,
    customerName: state.customerName,
    preview: `${details.icon} ${details.label}: atendimento sem nova atividade há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
    url: state.url
  }, {
    url: CHATWOOT_ORIGIN,
    tab: Number.isInteger(state.tabId) ? { id: state.tabId } : undefined
  });
  return true;
}

async function performRestoreInactivitySchedules() {
  if (!await isNotificationOwnerEnabled()) {
    return;
  }

  let stored;

  try {
    stored = await chrome.storage.session.get(null);
  } catch {
    return;
  }

  const now = Date.now();

  for (const [key, state] of Object.entries(stored)) {
    if (!key.startsWith(INACTIVITY_STATE_PREFIX)) {
      continue;
    }

    if (state.requireAgentLastMessage !== false && state.lastMessageFromAgent !== true) {
      await clearConversationInactivity(state.accountId, state.conversationId);
      continue;
    }

    for (const [level, configuration] of Object.entries(state?.levels || {})) {
      if (
        !INACTIVITY_LEVELS[level] ||
        !configuration?.enabled ||
        state.notifiedLevels?.[level]
      ) {
        continue;
      }

      const lastActivityAt = normalizeTimestamp(state.lastActivityAt);
      const minutes = normalizePositiveInteger(configuration.minutes);

      if (!lastActivityAt || !minutes) {
        continue;
      }

      const triggerAt = lastActivityAt + minutes * 60_000;

      await chrome.alarms.create(
        inactivityAlarmName(state.accountId, state.conversationId, level),
        { when: Math.max(triggerAt, now + 100) }
      );
    }
  }
}

async function restoreInactivitySchedules() {
  if (restoreInactivityPromise) {
    return restoreInactivityPromise;
  }

  restoreInactivityPromise = performRestoreInactivitySchedules();

  try {
    return await restoreInactivityPromise;
  } finally {
    restoreInactivityPromise = null;
  }
}

async function createNotification(message, sender) {
  if (!isTrustedSender(sender)) {
    return { ok: false, error: "Origem não autorizada." };
  }

  if (!await isNotificationOwnerEnabled()) {
    return { ok: true, suppressed: true, reason: "duplicate-installation" };
  }

  const duration = await getNotificationDuration();

  if (duration === "disabled") {
    return { ok: true, disabled: true };
  }

  if (await chatwootTabIsForeground(sender?.tab?.id)) {
    return { ok: true, suppressed: true };
  }

  const now = Date.now();
  const fingerprint = normalizeText(message.fingerprint, 500);

  clearExpiredFingerprints(now);

  if (!fingerprint || recentFingerprints.has(fingerprint)) {
    return { ok: true, duplicate: true };
  }

  recentFingerprints.set(fingerprint, now);

  const conversationKey = normalizeText(message.conversationKey, 200) || fingerprint;
  const uniqueSuffix = `${now.toString(36)}-${hashText(fingerprint)}`;
  const notificationId = `way-tools-ia-${hashText(conversationKey)}-${uniqueSuffix}`.slice(0, 500);
  const customerName = normalizeText(message.customerName, 80) || "Cliente";
  const preview = normalizeText(message.preview, 220) || "Nova mensagem recebida.";
  const requestedUrl = normalizeText(message.url, 2_000);
  const destinationUrl = isAllowedDestination(requestedUrl)
    ? requestedUrl
    : sender.url;

  try {
    const createdId = await chrome.notifications.create(
      notificationId,
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("128.png"),
        title: customerName,
        message: preview,
        priority: 2,
        requireInteraction: duration !== "windows",
        silent: false
      }
    );
    const finalNotificationId = createdId || notificationId;

    await storeDestination(finalNotificationId, sender, destinationUrl)
      .catch(() => undefined);

    if (duration !== "windows" && duration !== "persistent") {
      await scheduleAutoClose(finalNotificationId, duration);
    }

    return {
      ok: true,
      notificationId: finalNotificationId,
      duration
    };
  } catch (error) {
    recentFingerprints.delete(fingerprint);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let operation;

  if (message?.type === NOTIFICATION_OWNER_TYPE) {
    operation = setNotificationOwnerState(message, sender);
  } else if (message?.type === MESSAGE_TYPE) {
    operation = createNotification(message, sender);
  } else if (message?.type === INACTIVITY_SYNC_TYPE) {
    operation = scheduleConversationInactivity(message, sender);
  } else if (message?.type === INACTIVITY_CANCEL_TYPE) {
    operation = cancelConversationInactivity(message, sender);
  } else if (message?.type === INACTIVITY_RECONCILE_TYPE) {
    operation = reconcileConversationInactivity(message, sender);
  } else {
    return false;
  }

  operation
    .then(sendResponse)
    .catch((error) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }));
  return true;
});

async function focusNotificationDestination(notificationId) {
  const storageKey = destinationStorageKey(notificationId);
  const stored = await chrome.storage.session.get(storageKey);
  const destination = stored[storageKey];

  if (!destination) {
    return;
  }

  if (Number.isInteger(destination.tabId)) {
    try {
      const tab = await chrome.tabs.get(destination.tabId);
      const updateOptions = { active: true };

      if (isAllowedDestination(destination.url)) {
        updateOptions.url = destination.url;
      }

      await chrome.tabs.update(destination.tabId, updateOptions);

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

async function handleNotificationClick(notificationId) {
  await clearAutoCloseSchedule(notificationId);
  await focusNotificationDestination(notificationId).catch(() => undefined);
  await removeNotification(notificationId);
  await chrome.storage.session
    .remove(destinationStorageKey(notificationId))
    .catch(() => undefined);
}

chrome.notifications.onClicked.addListener((notificationId) => {
  void handleNotificationClick(notificationId);
});

chrome.notifications.onClosed.addListener((notificationId) => {
  void clearAutoCloseSchedule(notificationId);
  chrome.storage.session
    .remove(destinationStorageKey(notificationId))
    .catch(() => undefined);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith(INACTIVITY_ALARM_PREFIX)) {
    void handleInactivityAlarm(alarm);
    return;
  }

  if (!alarm.name.startsWith(CLEAR_ALARM_PREFIX)) {
    return;
  }

  const notificationId = alarm.name.slice(CLEAR_ALARM_PREFIX.length);
  void expireNotification(notificationId);
});

chrome.runtime.onStartup.addListener(() => {
  void migrateLegacyMessageCatalog();
  void restoreAutoCloseSchedules();
  void restoreInactivitySchedules();
});

chrome.runtime.onInstalled.addListener(() => {
  void migrateLegacyMessageCatalog();
  void restoreAutoCloseSchedules();
  void restoreInactivitySchedules();
});

void migrateLegacyMessageCatalog();
void restoreAutoCloseSchedules();
void restoreInactivitySchedules();
