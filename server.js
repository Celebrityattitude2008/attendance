const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'attendance-portal-659d6-firebase-adminsdk-fbsvc-b2c9d8f0db.json');
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
        process.exit(1);
    }
} else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
} else {
    console.error('Firebase service account JSON not found.');
    console.error('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.');
    process.exit(1);
}

const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://attendance-portal-659d6-default-rtdb.firebaseio.com';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
});

const db = admin.database();

function normalizeMatric(value) {
    return String(value || '').trim().toLowerCase();
}

async function findUserByMatric(matricNo) {
    const normalized = normalizeMatric(matricNo);
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};

    for (const [uid, user] of Object.entries(users)) {
        if (!user) continue;
        if (normalizeMatric(user.matricNo) === normalized) {
            return { uid, ...user };
        }
    }
    return null;
}

async function findUserByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};

    for (const [uid, user] of Object.entries(users)) {
        if (!user || !user.email) continue;
        if (String(user.email).trim().toLowerCase() === normalized) {
            return { uid, ...user };
        }
    }
    return null;
}

async function findUserByIdentifier({ matricNo, email }) {
    if (email) {
        const user = await findUserByEmail(email);
        if (user) return user;
    }
    if (matricNo) {
        const user = await findUserByMatric(matricNo);
        if (user) return user;
    }
    if (email) {
        try {
            const authUser = await admin.auth().getUserByEmail(String(email).trim().toLowerCase());
            return { uid: authUser.uid, email: authUser.email };
        } catch (err) {
            return null;
        }
    }
    return null;
}

app.get('/api/lookup-user', async (req, res) => {
    try {
        const matricNo = req.query.matricNo;
        if (!matricNo) {
            return res.status(400).json({ success: false, message: 'matricNo is required' });
        }

        const user = await findUserByMatric(matricNo);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            name: user.name || null,
            matricNo: user.matricNo || null,
            email: user.email || null
        });
    } catch (err) {
        console.error('lookup-user error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { matricNo, newPassword } = req.body;
        if (!matricNo || !newPassword) {
            return res.status(400).json({ success: false, message: 'matricNo and newPassword are required' });
        }

        const user = await findUserByMatric(matricNo);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await admin.auth().updateUser(user.uid, { password: String(newPassword) });
        return res.json({ success: true });
    } catch (err) {
        console.error('reset-password error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

app.post('/api/admin-reset-password', async (req, res) => {
    try {
        const { matricNo, email, newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'newPassword is required' });
        }

        const user = await findUserByIdentifier({ matricNo, email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await admin.auth().updateUser(user.uid, { password: String(newPassword) });
        return res.json({ success: true });
    } catch (err) {
        console.error('admin-reset-password error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Prella local server running on http://localhost:${port}`);
});
