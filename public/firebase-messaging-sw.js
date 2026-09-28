// Firebase Cloud Messaging Service Worker for AKSelling
// Handles background push notifications, order updates, and marketing flash alerts

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCnXkwV8ZMaqINLKCweHfeUeoxPTfi8zaI",
  projectId: "akseling-4719a",
  messagingSenderId: "1019849690303",
  appId: "1:1019849690303:web:600af26ee64dcfe7dd0a0a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'AKSelling Update';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Check out the latest updates on AKSelling.',
    icon: payload.notification?.icon || '/favicon.png',
    badge: '/favicon.png',
    data: {
      url: payload.data?.url || '/',
      orderId: payload.data?.orderId,
      productId: payload.data?.productId,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
