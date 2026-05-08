// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-messaging-compat.js');

// Firebase config (same as in auth.js)
const firebaseConfig = {
    apiKey: "AIzaSyAKii-aOhj46hGn9JXmDlXvU8zItQ8CZsY",
    authDomain: "attendance-portal-659d6.firebaseapp.com",
    databaseURL: "https://attendance-portal-659d6-default-rtdb.firebaseio.com",
    projectId: "attendance-portal-659d6",
    storageBucket: "attendance-portal-659d6.firebasestorage.app",
    messagingSenderId: "377133426719",
    appId: "1:377133426719:web:7231c02134968d619b8d2a"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'Attendance Reminder';
    const notificationOptions = {
        body: payload.notification?.body || 'Time to check your attendance!',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'attendance-reminder',
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open Dashboard' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/dashboard.html')
        );
    }
});