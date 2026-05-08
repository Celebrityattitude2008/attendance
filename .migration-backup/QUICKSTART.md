# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd ids111-attendance
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Visit: `http://localhost:5173`

### 3. Test Login

**Student Account:**
- Matric: `test001`
- Password: `Test@123`

**Admin Account:**
- Matric: `SCN/CSC/250394`
- Password: *No password required - just enter the matric number*

(Create accounts in Firebase Auth - see SETUP_GUIDE.md)

## 📱 Test Student Flow

1. **Login** as student
2. Click **"Mark Attendance"**
3. Enter session token (from admin panel)
4. Allow location request
5. See attendance recorded ✓

## 👨‍🏫 Test Admin Flow

1. **Login** as admin (go to `/admin`)
2. Click **"Start Attendance Session"**
3. Share QR code or token with students
4. View **Live Attendance** as students mark attendance
5. Click **"End Session"** when done

## 📦 Project Structure

```
src/
├── pages/              # Student, Admin, Login, Register pages
├── services/           # Firebase auth & attendance logic
├── context/            # Auth state management
├── styles/             # CSS files
├── config/firebase.ts  # Firebase configuration
└── utils/helpers.ts    # GPS and QR helpers
```

## 🔑 Key Features Already Implemented

✅ Firebase Authentication
✅ Realtime Database integration
✅ Student Dashboard with attendance history
✅ QR Code generation and scanning (manual input)
✅ Admin control panel
✅ GPS location tracking
✅ Device ID generation
✅ Offline support with localStorage
✅ Security rules for database access
✅ Role-based routing (student/admin)

## 🛠️ Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview build output
npm run preview

# Deploy to Firebase Hosting
firebase deploy
```

## 📚 File Reference

| File | Purpose |
|------|---------|
| `src/config/firebase.ts` | Firebase configuration |
| `src/services/authService.ts` | Authentication logic |
| `src/services/attendanceService.ts` | Attendance DB operations |
| `src/context/AuthContext.tsx` | Global auth state |
| `src/pages/Login.tsx` | Login page |
| `src/pages/StudentDashboard.tsx` | Student interface |
| `src/pages/AdminDashboard.tsx` | Admin interface |
| `firebase-rules.json` | Database security rules |
| `README.md` | Full documentation |
| `SETUP_GUIDE.md` | Detailed setup instructions |

## 🐛 Debugging

### Check Console
- Open browser DevTools (F12)
- Look for error messages
- Check Network tab for Firebase requests

### Firebase Console
- Check Authentication users exist
- Verify Realtime Database has data
- Review security rules are applied

### Common Issues
- **Can't login**: User doesn't exist in Firebase Auth
- **Can't see database**: Database Rules not applied
- **GPS not working**: Browser needs location permission
- **QR not scanning**: Use manual token input instead

## 📖 Next Steps

1. **Create admin account** in Firebase Console
   - See SETUP_GUIDE.md for details

2. **Create test student accounts**
   - Use matric numbers like BIU/2023/001

3. **Deploy to production**
   - See SETUP_GUIDE.md for Firebase Hosting / Vercel / Netlify

4. **Customize styling**
   - Edit CSS files in `src/styles/`
   - Change colors, fonts, spacing

5. **Add more features**
   - Attendance reports
   - Email notifications
   - Geofencing
   - See README.md "Future Enhancements"

## 💡 Tips

- Use React DevTools for debugging components
- Firebase has a free tier - use it for testing
- Join the classroom during attendance to test GPS
- Use different browsers for student/admin testing
- Check localStorage for pending offline records

## ✅ Checklist Before Going Live

- [ ] Firebase project created and configured
- [ ] Auth security rules applied
- [ ] Admin account created
- [ ] Student accounts created
- [ ] Tested student attendance flow
- [ ] Tested admin session control
- [ ] Tested offline functionality
- [ ] Optimized build created
- [ ] Deployed to hosting provider
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active (should be automatic)
- [ ] Backup strategy in place

## 📞 Support

- Check README.md for full documentation
- See SETUP_GUIDE.md for deployment help
- Review code comments for implementation details
- Check browser console and Firebase logs for errors

---

**Happy attending!** 📚✓
