import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import axiosInstance from './axiosInstance';

// Same Firebase project ("vandigo-01") the mobile app uses — see
// vandigo/lib/firebase_options.dart's `web` config.
const firebaseConfig = {
  apiKey: 'AIzaSyDS6rYBVeGckHD0OQMVWovk6Dspmq116_E',
  appId: '1:817188721812:web:a53d73f80435a09f92d081',
  messagingSenderId: '817188721812',
  projectId: 'vandigo-01',
  authDomain: 'vandigo-01.firebaseapp.com',
  storageBucket: 'vandigo-01.firebasestorage.app',
};

// Generated in the Firebase console under Project Settings → Cloud
// Messaging → Web Push certificates. Required for getToken() on web.
const VAPID_KEY =
  'BKWTitKbk6N3375XaqOjJJuu-5t_nWC7L77ndH0mvB3xaxx65n3ClquEquI1rZaFGFhE_OUKnt3CLoE_NBl6p_w';

let messagingInstance = null;

async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  if (!(await isSupported())) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Requests browser notification permission, registers the FCM service
 * worker, and posts the resulting token to the backend so NotificationService
 * can push to this browser like it already does for the mobile apps.
 */
export async function registerPushNotifications() {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    await axiosInstance.post('/api/v1/users/device-token', { token, platform: 'web' });
  } catch {
    // Push notifications are a progressive enhancement — never block the app.
  }
}

/** Subscribes to messages received while the tab is focused; returns an unsubscribe function. */
export async function onForegroundPush(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => handler(payload.data || {}));
}
