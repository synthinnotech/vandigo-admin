/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.17.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.0/firebase-messaging-compat.js');

// Same Firebase project ("vandigo-01") the mobile app uses — see
// vandigo/lib/firebase_options.dart's `web` config.
firebase.initializeApp({
  apiKey: 'AIzaSyDS6rYBVeGckHD0OQMVWovk6Dspmq116_E',
  appId: '1:817188721812:web:a53d73f80435a09f92d081',
  messagingSenderId: '817188721812',
  projectId: 'vandigo-01',
  authDomain: 'vandigo-01.firebaseapp.com',
  storageBucket: 'vandigo-01.firebasestorage.app',
});

const messaging = firebase.messaging();

// Backend sends data-only FCM messages (see notification_service.py's
// send_fcm) so nothing auto-renders — build the notification manually here,
// mirroring the Flutter app's manual handling in fcm_service.dart.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(data.title || 'Vandigo Admin', {
    body: data.body || '',
    icon: '/logo192.png',
    data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
