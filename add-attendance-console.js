// Run this in your browser console after logging into the dashboard as admin
// Make sure Firebase SDK is loaded first

(async function() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Please open the dashboard first.');
        return;
    }

    const db = firebase.database();
    const pastClasses = [
        { date: '2026-03-27T09:00:00', topic: 'March 27, 2026' },
        { date: '2026-04-10T09:00:00', topic: 'April 10, 2026' },
        { date: '2026-04-17T09:00:00', topic: 'April 17, 2026' }
    ];

    console.log('Fetching all users...');
    const usersSnap = await db.ref('users').once('value');
    const users = usersSnap.val();

    if (!users) {
        alert('No users found. Add users first.');
        return;
    }

    const userList = Object.entries(users).filter(([uid, user]) => user.role !== 'admin');
    console.log(`Found ${userList.length} users.`);

    const sessionsSnap = await db.ref('sessions').once('value');
    const sessions = sessionsSnap.val() || {};
    const existingSessions = {};

    Object.entries(sessions).forEach(([sessionId, session]) => {
        if (session?.defaultSession && session.topic) {
            existingSessions[session.topic] = { sessionId, session };
        }
    });

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const classInfo of pastClasses) {
        const timestamp = new Date(classInfo.date).getTime();
        const existing = existingSessions[classInfo.topic];
        let sessionId;

        if (existing) {
            const attendanceSnap = await db.ref(`attendance/${existing.sessionId}`).once('value');
            const attendance = attendanceSnap.val() || {};
            if (Object.keys(attendance).length > 0) {
                console.log(`Skipping existing session '${classInfo.topic}' because attendance already exists.`);
                totalSkipped += 1;
                continue;
            }
            console.log(`Using existing session '${classInfo.topic}' (${existing.sessionId}).`);
            sessionId = existing.sessionId;
        } else {
            const sessionRef = db.ref('sessions').push();
            sessionId = sessionRef.key;
            await sessionRef.set({
                token: Math.random().toString(36).substring(2, 11),
                startTime: timestamp,
                endTime: timestamp + 60 * 60 * 1000,
                active: false,
                adminLat: 0,
                adminLng: 0,
                adminDeviceId: 'default',
                defaultSession: true,
                topic: classInfo.topic
            });
            console.log(`Created new session for '${classInfo.topic}' (${sessionId}).`);
        }

        for (const [uid] of userList) {
            await db.ref(`attendance/${sessionId}/${uid}`).set({
                timestamp: timestamp + Math.floor(Math.random() * 1800000),
                deviceId: 'default',
                lat: '',
                lng: '',
                ip: ''
            });
            totalAdded += 1;
        }
    }

    console.log(`Finished. Added ${totalAdded} attendance records.`);
    if (totalSkipped > 0) {
        console.log(`${totalSkipped} existing session(s) were skipped to prevent duplicates.`);
    }
    alert(`Done. Added ${totalAdded} attendance records. Skipped ${totalSkipped} duplicate session(s).`);
})();
