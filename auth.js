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

// Initialize Firebase
let firebaseApp = null;
if (typeof firebase !== 'undefined') {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
    } catch (e) {
        console.error('Firebase init error:', e);
    }
} else {
    console.error('Firebase not loaded');
}

// Helper function to sanitize matric number to email
function sanitizeEmail(matricNo) {
    const normalized = matricNo.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '_');
    return `${normalized}@ids111.com`;
}

// Function to ensure user record exists in database
async function ensureUserRecord(user, role, name) {
    const db = firebase.database();
    const userRef = db.ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
        // Create user record if it doesn't exist
        await userRef.set({
            matricNo: role === 'admin' ? 'admin' : user.email.split('@')[0],
            name: name || (role === 'admin' ? 'Administrator' : 'Student'),
            email: user.email,
            role: role
        });
    } else {
        // Update role if user exists but role is missing
        const existingData = snapshot.val();
        if (!existingData.role) {
            await userRef.update({ role: role });
        }
    }
}

// Check if user is admin based on email
function isAdminEmail(email) {
    return email && email.toLowerCase() === 'admin@ids111.com';
}

// Create admin account if it doesn't exist and return the user
async function ensureAdminAccount() {
    const adminEmail = 'admin@ids111.com';
    const adminPassword = 'Admin@123';
    
    try {
        // Try to sign in first
        const userCredential = await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);
        // Ensure user record exists
        await ensureUserRecord(userCredential.user, 'admin', 'Administrator');
        return userCredential.user;
    } catch (error) {
        console.log('Admin sign-in error:', error.code, error.message);
        
        // If account doesn't exist (user-not-found) or any error that suggests account needs creation
        const isUserNotFound = error.code === 'auth/user-not-found' || 
                               error.message.includes('user-not-found') ||
                               error.message.includes('no user record');
        
        if (isUserNotFound) {
            try {
                console.log('Creating admin account...');
                const result = await firebase.auth().createUserWithEmailAndPassword(adminEmail, adminPassword);
                console.log('Admin account created, UID:', result.user.uid);
                
                // Create admin user record
                const db = firebase.database();
                await db.ref(`users/${result.user.uid}`).set({
                    matricNo: 'admin',
                    name: 'Administrator',
                    email: adminEmail,
                    role: 'admin'
                });
                console.log('Admin user record created');
                return result.user;
            } catch (createError) {
                console.error('Failed to create admin account:', createError);
                throw createError;
            }
        }
        
        // For other errors (wrong password, etc), throw the error
        console.error('Admin login error:', error);
        throw error;
    }
}

// Create test account if it doesn't exist
async function ensureTestAccount() {
    try {
        // Try to sign in first
        const userCredential = await firebase.auth().signInWithEmailAndPassword('test001@ids111.com', 'Test@123');
        // Ensure user record exists
        await ensureUserRecord(userCredential.user, 'student', 'Test Student');
        return userCredential.user;
    } catch (error) {
        // If account doesn't exist, create it
        if (error.code === 'auth/user-not-found' || error.message.includes('user-not-found')) {
            try {
                const result = await firebase.auth().createUserWithEmailAndPassword('test001@ids111.com', 'Test@123');
                // Create test user record
                const db = firebase.database();
                await db.ref(`users/${result.user.uid}`).set({
                    matricNo: 'test001',
                    name: 'Test Student',
                    email: 'test001@ids111.com',
                    role: 'student'
                });
                return result.user;
            } catch (createError) {
                console.error('Failed to create test account:', createError);
                throw createError;
            }
        }
        console.error('Test account error:', error);
        throw error;
    }
}
