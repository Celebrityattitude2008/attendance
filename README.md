# IDS 111 Attendance Portal

A modern web-based attendance system for IDS 111 course using Firebase and React.

## Features

✓ **Student Dashboard** - Track attendance history and mark attendance
✓ **QR Code Scanning** - Scan QR codes or enter tokens to mark attendance  
✓ **Admin Control Panel** - Create sessions, generate QR codes, view live attendance
✓ **GPS Integration** - Capture location when marking attendance
✓ **Device Tracking** - Detect suspicious duplicate device usage
✓ **Offline Support** - Queue attendance when offline, sync when reconnected
✓ **Real-time Updates** - Live attendance tracking
✓ **Role-based Access** - Separate interfaces for students and admins

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Backend**: Firebase (Auth + Realtime Database)
- **Styling**: CSS3
- **QR Code**: qrcode library
- **Routing**: React Router v6

## Project Structure

```
ids111-attendance/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/              # Page components (Login, Dashboard, etc.)
│   ├── services/           # Firebase services
│   │   ├── authService.ts
│   │   └── attendanceService.ts
│   ├── context/            # React Context (Auth)
│   ├── config/             # Firebase config
│   ├── utils/              # Helper functions
│   ├── styles/             # CSS files
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite config
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── firebase-rules.json     # Firebase security rules
```

## Installation

### Prerequisites
- Node.js 16+ and npm
- Firebase account with a project created

### Setup Steps

1. **Clone and Install**
```bash
cd ids111-attendance
npm install
```

2. **Configure Firebase**
   - The Firebase config is already included in `src/config/firebase.ts`
   - If using a different Firebase project, update the config there

3. **Create Firebase Database Structure**
   - Go to Firebase Console → Realtime Database
   - Create a database in "test mode"
   - Copy the security rules from `firebase-rules.json` into the Rules tab

4. **Create Admin User (Optional)**
   - Use Firebase Auth to manually create an admin account
   - Then in Realtime Database, navigate to `users/{uid}` and add:
   ```json
   {
     "name": "Admin Name",
     "role": "admin"
   }
   ```

5. **Start Development Server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### For Students

1. **Register/Login**
   - Sign up with your matric number (e.g., BIU/2023/001)
   - The system automatically converts this to email: `biu/2023/001@ids111.com`

2. **Mark Attendance**
   - Click "Mark Attendance" button
   - Either scan the QR code or enter the session token manually
   - Allow location access when prompted
   - Attendance will be recorded

3. **View History**
   - See all your attendance records on the dashboard
   - Shows date, time, and status

### For Admins/Lecturers

**Admin Access:** Login with matric `SCN/CSC/250394` (no password required) to access admin panel

1. **Create Session**
   - Go to `/admin` (requires admin role)
   - Click "Start Attendance Session"
   - Session lasts 30 minutes by default
   - Session start time is recorded

2. **Generate QR Code**
   - After starting session, QR code appears automatically
   - Share the QR code or the session token with students
   - QR code is prominently displayed for easy sharing

3. **Monitor Attendance (Live View)**
   - View real-time list of students who've marked attendance
   - Shows student name, matric number, and exact time
   - Click **Refresh** button to update the list
   - Late entries highlighted in orange (after 5 minutes of session start)
   - Automatic detection of late submissions

4. **Detect Suspicious Activity**
   - **Same Device Flag**: Alerts when one device is used by multiple students
   - **Late Entry Flag**: Shows which students marked attendance more than 5 minutes after session started
   - All flags displayed in the Flags Panel with detailed information
   - Device IDs partially hidden for privacy

5. **End Session**
   - Click "End Session" to stop accepting new attendance
   - Finalizes all attendance records
   - Session can be reviewed for any anomalies before ending

## Routes

| Route | Role | Description |
|-------|------|-------------|
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/student` | Student | Student dashboard |
| `/scan` | Student | QR scanner page |
| `/attend?token=xyz` | Student | Direct attendance marking |
| `/admin` | Admin | Admin control panel |

## Firebase Database Schema

```json
{
  "users": {
    "uid_1": {
      "matricNo": "BIU/2023/001",
      "name": "Student Name",
      "role": "student",
      "email": "biu/2023/001@ids111.com"
    }
  },
  "sessions": {
    "session_1": {
      "course": "IDS111",
      "token": "abc123",
      "startTime": 1710000000,
      "endTime": 1710000120,
      "active": true
    }
  },
  "attendance": {
    "session_1": {
      "uid_1": {
        "timestamp": 1710000010,
        "deviceId": "DEV_xyz",
        "lat": 6.33,
        "lng": 5.62
      }
    }
  }
}
```

## Security Model

### Authentication
- Firebase Auth with email/password
- Matric number → email conversion
- JWT tokens handled by Firebase

### Database Rules
- **Users**: Read-only for authenticated users
- **Sessions**: Can be created/modified only by admins
- **Attendance**: 
  - Students can only write their own records
  - Only during active sessions
  - Only before session expires
  - Only one record per student per session

## Offline Support

- When offline, attendance records are stored in `localStorage` with key `pending`
- Every 30 seconds, the app tries to sync pending records
- Records are automatically cleaned up after successful sync
- Expired sessions are discarded during sync

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase config
```

## Troubleshooting

### Cannot login
- Ensure the user exists in Firebase Auth
- Matric number should be formatted correctly (will be converted to lowercase)
- Check Firebase security rules allow email/password auth

### QR Scanner not working
- Ensure camera permissions are granted
- Use HTTPS in production or localhost in development
- Some browsers require secure context

### Attendance won't save
- Check internet connection
- Verify Firebase rules allow the write
- Check Firebase Database is set to realtime mode
- Look at browser console for error details

### GPS not working
- Browser must have permission to access location
- GPS may not be available on desktop - latitude/longitude defaults to 0

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder. Deploy to:
- Vercel
- Netlify  
- Firebase Hosting
- Any static host

### Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build and deploy:
```bash
npm run build
firebase deploy
```

## API Reference

### authService

```typescript
// Login user
await authService.login(matricNo, password)

// Register new student
await authService.register(matricNo, name, password)

// Logout
await authService.logout()

// Get user data
await authService.getUserData(uid)
```

### attendanceService

```typescript
// Create new session
const session = await attendanceService.createSession(durationMinutes)

// Get session by token
const session = await attendanceService.getSessionByToken(token)

// Mark attendance
await attendanceService.markAttendance(sessionId, uid, lat, lng)

// Get session attendance
const records = await attendanceService.getSessionAttendance(sessionId)

// Get student history
const history = await attendanceService.getStudentAttendanceHistory(uid)

// End session
await attendanceService.endSession(sessionId)

// Sync pending records
await attendanceService.syncPendingRecords()
```

## Performance Tips

- Sessions expire after 30 minutes (configurable)
- Attendance list is paginated in admin panel
- Location requests have 10 second timeout
- Database queries use efficient indexing via Firebase

## Security Best Practices

✓ All sensitive operations go through Firebase Auth
✓ Database rules enforce fine-grained access control
✓ API keys are Firebase public keys (safe to expose)
✓ User sessions managed by Firebase
✓ No passwords stored in local storage
✓ HTTPS enforcement in production

## Future Enhancements

- [ ] Email notifications for admins
- [ ] Attendance analytics and reports
- [ ] Support for multiple courses
- [ ] Geofencing (restrict attendance to classroom)
- [ ] Mobile app (React Native)
- [ ] Late entry warnings
- [ ] Attendance reminders
- [ ] Bulk user import
- [ ] CSV export of attendance

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Firebase Console logs
3. Check browser console for errors
4. Ensure all dependencies are installed correctly

## License

Private - For IDS 111 Course Use Only

## Contributors

Built for IDS 111 Attendance Portal
