import { getWsBaseURL } from './axiosInstance';

// Reuses the same /ws/notifications/{user_id} channel the customer app
// connects to — admins are just Users with role=admin, so no separate
// admin-only WS endpoint is needed. Backend pushes a `notification` event
// here (see NotificationService/RideAlertService) any time a Notification
// row is created for this user, including safety alerts.
const MAX_RECONNECT_ATTEMPTS = 5;

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let currentUserId = null;
let currentToken = null;
const listeners = new Set();

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  reconnectAttempts += 1;
  const delayMs = Math.min(1000 * 2 ** reconnectAttempts, 30000);
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (currentUserId && currentToken) doConnect();
  }, delayMs);
}

function doConnect() {
  if (socket) {
    socket.onclose = null;
    socket.close();
  }
  const url = `${getWsBaseURL()}/ws/notifications/${currentUserId}?token=${encodeURIComponent(currentToken)}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    reconnectAttempts = 0;
  };
  socket.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      listeners.forEach((fn) => fn(msg));
    } catch {
      // ignore malformed frames
    }
  };
  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
  socket.onerror = () => {
    socket?.close();
  };
}

/** Connects (or reconnects, if the user/token changed) the shared admin notification socket. */
export function connectNotificationSocket(userId, token) {
  if (!userId || !token) return;
  if (currentUserId === userId && currentToken === token && socket) return;
  currentUserId = userId;
  currentToken = token;
  reconnectAttempts = 0;
  doConnect();
}

export function disconnectNotificationSocket() {
  clearTimeout(reconnectTimer);
  currentUserId = null;
  currentToken = null;
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

/** Subscribes to incoming WS messages; returns an unsubscribe function. */
export function onNotificationEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
