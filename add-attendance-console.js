// ============================================================================
// FUNCTION 1: Add attendance for all students (marks them as PRESENT)
// ============================================================================
// Run this in your browser console after logging into the dashboard as admin
// Make sure Firebase SDK is loaded first

function addAllStudentsAttendance() {
    (async function() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Please open the dashboard first.');
            return;
        }

        const db = firebase.database();
        const pastClasses = [
            { date: '2026-03-27T09:00:00', topic: 'March 27, 2026' },
            { date: '2026-04-10T09:00:00', topic: 'April 10, 2026' },
            { date: '2026-04-17T09:00:00', topic: 'April 17, 2026' },
            { date: '2026-04-24T09:00:00', topic: 'April 24, 2026' }
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
}

// ============================================================================
// FUNCTION 2: Mark all students as ABSENT (missed) for 4 classes
// ============================================================================
// This creates the sessions but does NOT add attendance records
// Students will show as "missed" attendance for these classes

function markAllStudentsAbsentFor4Classes() {
    (async function() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Please open the dashboard first.');
            return;
        }

        const db = firebase.database();
        const pastClasses = [
            { date: '2026-03-27T09:00:00', topic: 'March 27, 2026 - Missed' },
            { date: '2026-04-10T09:00:00', topic: 'April 10, 2026 - Missed' },
            { date: '2026-04-17T09:00:00', topic: 'April 17, 2026 - Missed' },
            { date: '2026-04-24T09:00:00', topic: 'April 24, 2026 - Missed' }
        ];

        console.log('🔍 Fetching all students and sessions...');
        const usersSnap = await db.ref('users').once('value');
        const users = usersSnap.val();

        if (!users) {
            console.error('❌ No users found.');
            alert('No users found. Please add students first.');
            return;
        }

        const studentList = Object.entries(users)
            .filter(([uid, user]) => user.role !== 'admin')
            .map(([uid, user]) => ({ uid, ...user }));
        
        console.log(`✓ Found ${studentList.length} students`);

        const sessionsSnap = await db.ref('sessions').once('value');
        const sessions = sessionsSnap.val() || {};
        const existingSessions = {};

        Object.entries(sessions).forEach(([sessionId, session]) => {
            if (session?.topic) {
                existingSessions[session.topic] = { sessionId, session };
            }
        });

        let sessionsCreated = 0;
        let sessionsSkipped = 0;
        const sessionIds = [];

        console.log('\n📚 Creating sessions for 4 missed classes...');
        
        for (const classInfo of pastClasses) {
            const timestamp = new Date(classInfo.date).getTime();
            
            if (existingSessions[classInfo.topic]) {
                console.log(`⊘ Session already exists: '${classInfo.topic}'`);
                sessionIds.push(existingSessions[classInfo.topic].sessionId);
                sessionsSkipped += 1;
            } else {
                try {
                    const sessionRef = db.ref('sessions').push();
                    const sessionId = sessionRef.key;
                    
                    await sessionRef.set({
                        token: Math.random().toString(36).substring(2, 11),
                        startTime: timestamp,
                        endTime: timestamp + 60 * 60 * 1000,
                        active: false,
                        adminLat: 0,
                        adminLng: 0,
                        adminDeviceId: 'admin',
                        topic: classInfo.topic,
                        createdAt: new Date().toISOString()
                    });
                    
                    sessionIds.push(sessionId);
                    console.log(`✓ Created session: '${classInfo.topic}' (${sessionId})`);
                    sessionsCreated += 1;
                } catch (e) {
                    console.error(`✗ Error creating session for '${classInfo.topic}':`, e);
                }
            }
        }

        console.log(`\n👥 Marking ${studentList.length} students as absent for ${sessionIds.length} classes...`);
        console.log(`Sessions: ${sessionIds.join(', ')}`);

        let totalMarkedAbsent = 0;

        for (const student of studentList) {
            for (const sessionId of sessionIds) {
                try {
                    // Check if attendance already exists
                    const attendanceRef = db.ref(`attendance/${sessionId}/${student.uid}`);
                    const snapshot = await attendanceRef.once('value');
                    
                    if (!snapshot.exists()) {
                        // Don't add any attendance record - this marks them as ABSENT
                        totalMarkedAbsent += 1;
                    }
                } catch (e) {
                    console.error(`Error checking attendance for ${student.uid} in ${sessionId}:`, e);
                }
            }
        }

        console.log(`\n✅ COMPLETE!`);
        console.log(`   Sessions Created: ${sessionsCreated}`);
        console.log(`   Sessions Skipped: ${sessionsSkipped}`);
        console.log(`   Students Marked Absent: ${studentList.length} × ${sessionIds.length} classes`);
        console.log(`   Total Absent Records: ${studentList.length * sessionIds.length}`);

        alert(`✅ Done!\n\nAll ${studentList.length} students are now marked as ABSENT (missed) for the 4 classes.\n\nSessions created: ${sessionsCreated}\nStudents affected: ${studentList.length}`);
    })();
}

// ============================================================================
// HOW TO USE IN BROWSER CONSOLE:
// ============================================================================
// 
// 1. Open the Dashboard (you must be logged in as ADMIN)
// 2. Press F12 to open Developer Console
// 3. Go to the "Console" tab
// 4. Copy and paste ONE of these commands:
//
// To mark all students as ABSENT (missed) for the 4 classes:
//    markAllStudentsAbsentFor4Classes()
//
// To mark all students as PRESENT (attended) for 3 classes:
//    addAllStudentsAttendance()
//
// ============================================================================
