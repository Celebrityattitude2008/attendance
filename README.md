# IDS 111 Attendance Portal - HTML/CSS/JS Version

Simple, no-build attendance system.

## Files

- `login.html` - Login page (student & admin)
- `register.html` - Registration page  
- `dashboard.html` - Student & Admin dashboards
- `index.html` - Redirects to login
- `auth.js` - Firebase initialization & helpers
- `styles.css` - Shared styles

## Running Locally

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server
```

Then visit: **http://localhost:8000**

## Test Accounts

**Student:**
- Matric: `test001`
- Password: `Test@123`

**Admin:**
- Matric: `scn/csc/250394`
- Password: (none - matric only)

## Features

✓ Student attendance marking via token
✓ Admin session control & QR code generation
✓ Live attendance tracking
✓ Attendance history
✓ Firebase authentication & realtime database
✓ No build process needed
