// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAKii-aOhj46hGn9JXmDlXvU8zItQ8CZsY",
    authDomain: "attendance-portal-659d6.firebaseapp.com",
    databaseURL: "https://attendance-portal-659d6-default-rtdb.firebaseio.com",
    projectId: "attendance-portal-659d6",
    storageBucket: "attendance-portal-659d6.firebasestorage.app",
    messagingSenderId: "377133426719",
    appId: "1:377133426719:web:7231c02134968d619b8d2a"
};

// Initialize Firebase (wait for it to load)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
} else {
    console.error('Firebase not loaded. Make sure script tags are in correct order.');
}

// Helper function to sanitize matric number to email
function sanitizeEmail(matricNo) {
    const normalized = matricNo.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '_');
    return `${normalized}@ids111.com`;
}
