(() => {
  "use strict";

  const BRIDGE_SOURCE = "way-tools-chatwoot-realtime";
  const COMMAND_SOURCE = "way-tools-chatwoot-command";
  const CHATWOOT_ORIGIN = "https://ia-nocodb.internetway.com.br";
  const BRIDGE_SENTINEL = "__WAY_TOOLS_CHATWOOT_REALTIME_BRIDGE_V2__";
  const LEGACY_DUPLICATE_ATTRIBUTE = "data-way-tools-legacy-duplicate";
  const SYNC_INTERVAL_MS = 60_000;
  const LEGACY_CHECK_INTERVAL_MS = 4_000;

  function postBridgeStatus(type, payload = {}) {
    window.postMessage({
      source: BRIDGE_SOURCE,
      type,
      payload
    }, CHATWOOT_ORIGIN);
  }

  function signalLegacyDuplicate(reason) {
    globalThis.document?.documentElement?.setAttribute?.(
      LEGACY_DUPLICATE_ATTRIBUTE,
      "true"
    );
    postBridgeStatus("legacy-duplicate", { reason });
  }

  if (window[BRIDGE_SENTINEL]?.generation >= 2) {
    postBridgeStatus("ready");
    return;
  }

  if (window.WebSocket?.name === "WayToolsWebSocket") {
    signalLegacyDuplicate("preexisting-way-tools-websocket");
    postBridgeStatus("ready");
    return;
  }

  Object.defineProperty(window, BRIDGE_SENTINEL, {
    configurable: true,
    value: Object.freeze({ generation: 2 })
  });
  const EVENT_NAMES = new Set([
    "message.created",
    "assignee.changed",
    "conversation.updated",
    "conversation.status_changed"
  ]);
  const xhrStates = new WeakMap();
  const nativeFetch = window.fetch.bind(window);
  const NativeWebSocket = window.WebSocket;
  const nativeXhrOpen = XMLHttpRequest.prototype.open;
  const nativeXhrSend = XMLHttpRequest.prototype.send;
  const nativeXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  let currentAccountId = accountIdFromUrl(location.href);
  let currentUserId = null;
  let latestApiHeaders = new Headers();
  let syncInFlight = null;
  let syncQueued = false;

  function toInteger(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : null;
  }

  function accountIdFromUrl(value) {
    try {
      const pathname = new URL(String(value || ""), location.href).pathname;
      const accountId = toInteger(
        pathname.match(/\/(?:app\/)?accounts\/(\d+)/)?.[1]
      );
      return accountId !== null && accountId > 0 ? accountId : null;
    } catch {
      return null;
    }
  }

  function normalizeText(value, maximumLength = 0) {
    const normalized = String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

    if (!maximumLength || normalized.length <= maximumLength) {
      return normalized;
    }

    return `${normalized.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
  }

  function lastMessageWasFromAgent(message) {
    if (!message || typeof message !== "object" || message.private === true) {
      return null;
    }

    const messageType = Number(message.message_type);

    if (messageType === 1) {
      return true;
    }

    if (messageType === 0) {
      return false;
    }

    const senderType = normalizeText(message.sender_type || message.sender?.type, 30)
      .toLocaleLowerCase("pt-BR");

    if (senderType === "contact") {
      return false;
    }

    if (["user", "agent", "administrator"].includes(senderType)) {
      return true;
    }

    return null;
  }

  function parseJson(value) {
    if (value && typeof value === "object") {
      return value;
    }

    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function post(type, payload = {}) {
    window.postMessage({
      source: BRIDGE_SOURCE,
      type,
      payload
    }, CHATWOOT_ORIGIN);
  }

  function updateIdentity(identifier) {
    const parsed = parseJson(identifier);

    if (!parsed || parsed.channel !== "RoomChannel") {
      return;
    }

    const accountId = toInteger(parsed.account_id);
    const userId = toInteger(parsed.user_id);
    let changed = false;

    if (accountId !== null && accountId !== currentAccountId) {
      currentAccountId = accountId;
      changed = true;
    }

    if (userId !== null && userId !== currentUserId) {
      currentUserId = userId;
      changed = true;
    }

    if (changed) {
      post("identity", {
        accountId: currentAccountId,
        userId: currentUserId
      });
      queueAssignedConversationsSync();
    }
  }

  function conversationUrl(accountId, conversationId) {
    if (accountId === null || conversationId === null) {
      return CHATWOOT_ORIGIN;
    }

    return `${CHATWOOT_ORIGIN}/app/accounts/${accountId}/conversations/${conversationId}`;
  }

  function sanitizeConversation(conversation) {
    if (!conversation || typeof conversation !== "object") {
      return null;
    }

    const conversationId = toInteger(conversation.id);

    if (conversationId === null) {
      return null;
    }

    const latestMessage = Array.isArray(conversation.messages)
      ? conversation.messages[0] || null
      : null;
    const assignee = conversation.meta?.assignee || null;
    const sender = conversation.meta?.sender || null;
    const accountId = toInteger(conversation.account_id) ?? currentAccountId;

    return {
      conversationId,
      accountId,
      assigneeId: toInteger(assignee?.id),
      assigneeType: normalizeText(assignee?.type || conversation.meta?.assignee_type, 30),
      customerName: normalizeText(sender?.name, 80),
      preview: normalizeText(latestMessage?.content || latestMessage?.processed_message_content, 220),
      messageId: toInteger(latestMessage?.id),
      messageType: latestMessage?.message_type ?? null,
      senderType: normalizeText(latestMessage?.sender_type || latestMessage?.sender?.type, 30),
      lastMessageFromAgent: lastMessageWasFromAgent(latestMessage),
      unreadCount: toInteger(conversation.unread_count) ?? 0,
      lastActivityAt: Number(conversation.last_activity_at) || 0,
      waitingSince: Number(conversation.waiting_since) || 0,
      status: normalizeText(conversation.status, 30),
      url: conversationUrl(accountId, conversationId)
    };
  }

  function sanitizeRealtimeEvent(eventName, data) {
    if (!data || typeof data !== "object") {
      return null;
    }

    if (eventName === "message.created") {
      const conversationId = toInteger(data.conversation_id);
      const accountId = toInteger(data.account_id) ?? currentAccountId;

      if (conversationId === null) {
        return null;
      }

      return {
        event: eventName,
        accountId,
        currentUserId,
        conversationId,
        messageId: toInteger(data.id),
        messageType: data.message_type ?? null,
        senderType: normalizeText(data.sender_type || data.sender?.type, 30),
        private: data.private === true,
        lastMessageFromAgent: lastMessageWasFromAgent(data),
        customerName: normalizeText(data.sender?.name, 80),
        preview: normalizeText(data.content || data.processed_message_content, 220),
        assigneeId: toInteger(data.conversation?.assignee_id),
        unreadCount: toInteger(data.conversation?.unread_count) ?? 0,
        lastActivityAt:
          Number(data.conversation?.last_activity_at) ||
          Number(data.created_at) ||
          0,
        url: conversationUrl(accountId, conversationId)
      };
    }

    const conversation = sanitizeConversation(data);

    if (!conversation) {
      return null;
    }

    return {
      event: eventName,
      currentUserId,
      ...conversation
    };
  }

  function inspectActionCableFrame(value, allowEvents = true) {
    const frame = parseJson(value);

    if (!frame) {
      return;
    }

    updateIdentity(frame.identifier);

    if (!allowEvents) {
      return;
    }

    const eventName = normalizeText(frame.message?.event, 80);

    if (!EVENT_NAMES.has(eventName)) {
      return;
    }

    const sanitized = sanitizeRealtimeEvent(eventName, frame.message?.data);

    if (sanitized) {
      post("event", sanitized);
    }

    if (eventName === "assignee.changed") {
      setTimeout(queueAssignedConversationsSync, 250);
    }
  }

  function attachSocket(socket) {
    socket.addEventListener("message", (event) => {
      inspectActionCableFrame(event.data, true);
    });

    const nativeSend = socket.send;
    socket.send = function wayToolsSend(data) {
      inspectActionCableFrame(data, false);
      return nativeSend.call(this, data);
    };
  }

  function WayToolsWebSocket(url, protocols) {
    const socket = arguments.length > 1
      ? new NativeWebSocket(url, protocols)
      : new NativeWebSocket(url);
    attachSocket(socket);
    return socket;
  }

  WayToolsWebSocket.prototype = NativeWebSocket.prototype;
  Object.setPrototypeOf(WayToolsWebSocket, NativeWebSocket);
  window.WebSocket = WayToolsWebSocket;

  setInterval(() => {
    if (
      window.WebSocket !== WayToolsWebSocket &&
      window.WebSocket?.name === "WayToolsWebSocket"
    ) {
      signalLegacyDuplicate("way-tools-websocket-replaced");
    }
  }, LEGACY_CHECK_INTERVAL_MS);

  function isChatwootApiUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.origin === CHATWOOT_ORIGIN && url.pathname.startsWith("/api/");
    } catch {
      return false;
    }
  }

  function captureAccountFromUrl(value) {
    try {
      const accountId = accountIdFromUrl(value);

      if (accountId !== null && currentAccountId === null) {
        currentAccountId = accountId;
      }
    } catch {
      // Uma URL incompleta não impede a captura posterior pelo RoomChannel.
    }
  }

  function captureApiHeaders(url, headers) {
    if (!isChatwootApiUrl(url)) {
      return;
    }

    const captured = new Headers();

    try {
      for (const [name, value] of new Headers(headers || {}).entries()) {
        const normalizedName = name.toLowerCase();

        if (["if-none-match", "if-modified-since", "content-length"].includes(normalizedName)) {
          continue;
        }

        captured.set(name, value);
      }
    } catch {
      return;
    }

    if ([...captured.keys()].length > 0) {
      latestApiHeaders = captured;
      captureAccountFromUrl(url);
      queueAssignedConversationsSync();
    }
  }

  function extractAssignedPayload(json) {
    const root = json?.data ?? json;
    const payload = root?.payload;

    if (!Array.isArray(payload)) {
      return null;
    }

    return {
      meta: {
        mineCount: toInteger(root?.meta?.mine_count) ?? payload.length
      },
      complete:
        (toInteger(root?.meta?.mine_count) ?? payload.length) <= payload.length,
      conversations: payload
        .map(sanitizeConversation)
        .filter(Boolean)
    };
  }

  function postAssignedSnapshot(json) {
    const snapshot = extractAssignedPayload(json);

    if (!snapshot) {
      return false;
    }

    post("assigned-snapshot", {
      accountId: currentAccountId,
      userId: currentUserId,
      ...snapshot
    });
    return true;
  }

  function isAssignedConversationsUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.origin === CHATWOOT_ORIGIN &&
        /\/api\/v1\/accounts\/\d+\/conversations$/.test(url.pathname) &&
        url.searchParams.get("assignee_type") === "me";
    } catch {
      return false;
    }
  }

  async function inspectFetchResponse(url, response) {
    if (!isAssignedConversationsUrl(url) || !response.ok) {
      return;
    }

    try {
      postAssignedSnapshot(await response.clone().json());
    } catch {
      // A sincronização ativa fará uma nova tentativa.
    }
  }

  window.fetch = async function wayToolsFetch(input, init) {
    const url = input instanceof Request ? input.url : input;
    const requestHeaders = new Headers(input instanceof Request ? input.headers : undefined);

    if (init?.headers) {
      for (const [name, value] of new Headers(init.headers).entries()) {
        requestHeaders.set(name, value);
      }
    }

    const response = await nativeFetch(input, init);

    if (response.ok) {
      captureApiHeaders(url, requestHeaders);
      void inspectFetchResponse(url, response);
    }

    return response;
  };

  XMLHttpRequest.prototype.open = function wayToolsOpen(method, url) {
    xhrStates.set(this, {
      method: normalizeText(method, 20).toUpperCase(),
      url: String(url || ""),
      headers: new Headers()
    });
    return nativeXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function wayToolsSetRequestHeader(name, value) {
    const state = xhrStates.get(this);

    if (state) {
      state.headers.set(name, value);
    }

    return nativeXhrSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function wayToolsXhrSend() {
    const state = xhrStates.get(this);

    if (state) {
      this.addEventListener("loadend", () => {
        if (this.status < 200 || this.status >= 300) {
          return;
        }

        captureApiHeaders(state.url, state.headers);

        if (!isAssignedConversationsUrl(state.url)) {
          return;
        }

        try {
          const json = this.responseType === "json"
            ? this.response
            : JSON.parse(this.responseText);
          postAssignedSnapshot(json);
        } catch {
          // A resposta pode não ser JSON ou já ter sido descartada pela página.
        }
      }, { once: true });
    }

    return nativeXhrSend.apply(this, arguments);
  };

  async function syncAssignedConversations() {
    if (syncInFlight) {
      return syncInFlight;
    }

    if (currentAccountId === null || currentUserId === null) {
      return null;
    }

    syncInFlight = (async () => {
      try {
        const conversations = [];
        let mineCount = null;

        for (let page = 1; page <= 20; page += 1) {
          const url = new URL(
            `/api/v1/accounts/${currentAccountId}/conversations`,
            CHATWOOT_ORIGIN
          );
          url.searchParams.set("status", "open");
          url.searchParams.set("assignee_type", "me");
          url.searchParams.set("page", String(page));
          url.searchParams.set("sort_by", "last_activity_at_desc");

          const response = await nativeFetch(url.href, {
            method: "GET",
            headers: latestApiHeaders,
            credentials: "include",
            cache: "no-store"
          });

          if (!response.ok) {
            return false;
          }

          const snapshot = extractAssignedPayload(await response.json());

          if (!snapshot) {
            return false;
          }

          mineCount = snapshot.meta.mineCount;
          conversations.push(...snapshot.conversations);

          if (
            snapshot.conversations.length === 0 ||
            conversations.length >= mineCount
          ) {
            post("assigned-snapshot", {
              accountId: currentAccountId,
              userId: currentUserId,
              meta: { mineCount },
              complete: true,
              conversations
            });
            return true;
          }
        }

        post("assigned-snapshot", {
          accountId: currentAccountId,
          userId: currentUserId,
          meta: { mineCount: mineCount ?? conversations.length },
          complete: false,
          conversations
        });
        return true;
      } catch {
        return false;
      }
    })();

    try {
      return await syncInFlight;
    } finally {
      syncInFlight = null;
    }
  }

  function queueAssignedConversationsSync() {
    if (syncQueued) {
      return;
    }

    syncQueued = true;
    queueMicrotask(() => {
      syncQueued = false;
      void syncAssignedConversations();
    });
  }

  window.addEventListener("message", (event) => {
    if (
      event.source !== window ||
      event.origin !== CHATWOOT_ORIGIN ||
      event.data?.source !== COMMAND_SOURCE
    ) {
      return;
    }

    if (event.data.type === "sync") {
      if (currentAccountId !== null && currentUserId !== null) {
        post("identity", {
          accountId: currentAccountId,
          userId: currentUserId
        });
      }
      queueAssignedConversationsSync();
    }
  });

  setInterval(queueAssignedConversationsSync, SYNC_INTERVAL_MS);
  post("ready");
})();
