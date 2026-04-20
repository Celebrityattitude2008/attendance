// Run this in your browser console after logging into the dashboard as admin
// Make sure Firebase SDK is loaded first

(async function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Please open the dashboard first.');
        return;
    }

    const db = firebase.database();

    // Your 3 past class dates
    const pastClasses = [
        { date: "2026-03-27T09:00:00", topic: "Class 1" },
        { date: "2026-04-10T09:00:00", topic: "Class 2" },
        { date: "2026-04-17T09:00:00", topic: "Class 3" }
    ];

    console.log("Fetching all users...");
    const usersSnap = await db.ref('users').once('value');
    const users = usersSnap.val();

    if (!users) {
        alert("No users found.");
        return;
    }

    const userList = Object.entries(users).filter(([uid, user]) => user.role !== 'admin');
    console.log(`Found ${userList.length} users. Adding attendance for 3 classes...`);

    let count = 0;
    for (const classInfo of pastClasses) {
        // Create a session for this date
        const sessionRef = db.ref('sessions').push();
        const sessionId = sessionRef.key;
        const timestamp = new Date(classInfo.date).getTime();

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

        // Add attendance for each user
        for (const [uid, user] of userList) {
            await db.ref(`attendance/${sessionId}/${uid}`).set({
                timestamp: timestamp + Math.floor(Math.random() * 1800000),
                deviceId: 'default',
                lat: '',
                lng: '',
                ip: ''
            });
            count++;
        }
    }

    console.log(`Done! Added ${count} attendance records.`);
    alert(`Success! Added ${count} attendance records for ${userList.length} users across 3 classes.`);
})();