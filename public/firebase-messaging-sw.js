/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging — background service worker (Vite: served from /public).
 *
 * Keep these values in sync with VITE_FIREBASE_* in `.env`
 * (Firebase web config is public; it is not a secret).
 */
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCUIfssl7KaVyS_nIUKunImEnWDO3xzg2Q',
  authDomain: 'basma-reception-notifications.firebaseapp.com',
  projectId: 'basma-reception-notifications',
  storageBucket: 'basma-reception-notifications.firebasestorage.app',
  messagingSenderId: '108684870050',
  appId: '1:108684870050:web:87cd189b7a5de73fbeb2fb',
})

// Activate immediately so PushManager.subscribe can run without AbortError.
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

const messaging = firebase.messaging()

function resolveRoute(data) {
  if (!data) return '/'
  if (data.route) {
    const r = String(data.route).trim()
    return r.startsWith('/') ? r : '/' + r
  }
  const type = String(data.type || '')
    .trim()
    .toLowerCase()
  const fileNo = data.fileNo || data.file_no
  switch (type) {
    case 'appointment':
    case 'appointments':
      return '/appointments'
    case 'queue':
    case 'token':
      return '/queue'
    case 'consult':
    case 'consultation':
    case 'consult_request':
      return '/patients?filter=consult'
    case 'patient':
      return fileNo ? '/patients/' + fileNo : '/patients'
    case 'check_in':
    case 'checkin':
      return '/check-in'
    case 'emergency':
      return '/emergency'
    case 'notification':
    case 'notifications':
      return '/notifications'
    default:
      return '/notifications'
  }
}

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'بسمة'
  const body = (payload.notification && payload.notification.body) || ''
  const data = payload.data || {}

  return self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    data: {
      ...data,
      route: resolveRoute(data),
    },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const route = resolveRoute(data)
  const targetUrl = new URL(route, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'FCM_NAVIGATE', route })
          return
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
    }),
  )
})
