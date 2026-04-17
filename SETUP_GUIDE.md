# Setup & Deployment Guide

## 1. Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Name it "attendance-portal"
4. Accept the terms and create

### Step 2: Enable Authentication
1. Go to "Authentication" in the left menu
2. Click "Get started"
3. Enable "Email/Password" authentication method
4. Enable "Anonymous" authentication method
5. Save

### Step 3: Create Realtime Database
1. Go to "Realtime Database" in the left menu
2. Click "Create database"
3. Select location "us-central1"
4. Start in "Test mode" (we'll secure it later)
5. Enable

### Step 4: Apply Security Rules
1. In Realtime Database, go to "Rules" tab
2. Clear existing content
3. Paste the rules from `firebase-rules.json`
4. Click "Publish"

### Step 5: Get Firebase Config
1. Go to Project Settings (⚙️ icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Copy the Firebase config
5. Update `src/config/firebase.ts` if needed (already configured)

## 2. Local Development Setup

### Prerequisites
- Node.js 16+ (https://nodejs.org)
- npm (comes with Node.js)
- Git (optional but recommended)

### Installation Steps

```bash
# Navigate to project
cd /path/to/ids111-attendance

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Create Test Users

#### Admin User
1. Enable anonymous auth in Firebase Authentication.
2. Use the admin matric number `SCN/CSC/250394` at `/admin-login`.
3. The app will sign in anonymously and create the admin profile in Realtime Database automatically.

> If you want to seed the admin record manually, create a `users/{UID}` node with:
```json
{
  "matricNo": "scn/csc/250394",
  "name": "Administrator",
  "role": "admin",
  "email": "scn/csc/250394@ids111.com"
}
```

#### Student Users
1. Repeat for each student with:
   - Email: `{matricno}@ids111.com` (e.g., `biu/2023/001@ids111.com`)
   - Password: any secure password
2. Add to database:
```json
{
  "matricNo": "BIU/2023/001",
  "name": "Student Name",
  "role": "student",
  "email": "biu/2023/001@ids111.com"
}
```

### Testing Student Attendance

1. Open two browser windows
2. **Window 1 (Admin)**:
   - Login with admin credentials
   - Go to `/admin`
   - Click "Start Attendance Session"
   - Copy the token or QR code

3. **Window 2 (Student)**:
   - Login with student credentials
   - Go to `/student`
   - Click "Mark Attendance"
   - Paste the token
   - Allow GPS access
   - Submit

4. Check **Window 1** to see attendance appear in real-time

## 3. Production Deployment

### Option A: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting
# When asked, use 'dist' as public directory
# Configure as SPA: Yes
# Do not overwrite index.html: Yes

# Build for production
npm run build

# Deploy
firebase deploy
```

Your app will be live at `https://{project-id}.web.app`

### Option B: Vercel

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repo
5. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click "Deploy"

### Option C: Netlify

1. Push code to GitHub
2. Go to https://netlify.com
3. Click "New site from Git"
4. Connect your GitHub repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Option D: Custom Server (Node.js/Docker)

```bash
# Build
npm run build

# Create server.js
# Copy dist/ to /var/www/attendance
# Serve with Nginx or Apache

# Or use PM2:
pm2 start "npm run dev" --name "attendance-portal"
```

## 4. DNS Configuration

If using custom domain:

### For Firebase Hosting
1. Go to Project Settings
2. Go to "Hosting" section
3. Add custom domain
4. Follow DNS configuration steps

### For Vercel/Netlify
1. Go to project settings
2. Add custom domain
3. Update DNS records:
   ```
   CNAME yourdomain.com → {provider}.netlify.app
   ```

## 5. Environment Configuration

### Production Environment Variables

Create `.env.production`:
```
VITE_FIREBASE_API_KEY=AIzaSyAKii-aOhj46hGn9JXmDlXvU8zItQ8CZsY
VITE_FIREBASE_AUTH_DOMAIN=attendance-portal-659d6.firebaseapp.com
# ... other config
```

### Security Checklist

- [ ] Firebase project created and configured
- [ ] Authentication method enabled
- [ ] Security rules applied to database
- [ ] Admin account created
- [ ] Test student accounts created
- [ ] HTTPS enabled (automatic with Firebase/Vercel/Netlify)
- [ ] CSP headers configured (if custom server)
- [ ] Environment variables secured

## 6. Backup & Maintenance

### Database Backup

1. Go to Firebase Console
2. Create regular snapshots:
```bash
# Export data
firebase database:get / --json > backup.json

# Import data
firebase database:set / backup.json
```

### Monitoring

- Check Firebase Console for quota usage
- Monitor authentication events
- Review database read/write counts
- Set up alerts for unusual activity

## 7. Troubleshooting Deployment

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Cannot Connect to Database
- Verify Firebase project ID in config
- Check network rules aren't blocking requests
- Verify database security rules are published

### CORS Errors
- Firebase should handle CORS automatically
- Check browser console for specific error
- Verify domain is whitelisted if needed

### Slow Performance
- Check Firebase pricing tier
- Optimize database queries
- Enable compression on server
- Use CDN for static assets

## 8. Scaling for Production

### If expecting >1000 concurrent users:

1. **Upgrade Firebase Plan**
   - Consider Blaze plan for unlimited scalability
   - Set budget alerts

2. **Optimize Database**
   - Add indexes for frequently queried paths
   - Archive old attendance records
   - Consider Cloud Firestore for complex queries

3. **Advanced Caching**
   - Implement service worker for offline mode
   - Cache static assets aggressively
   - Consider Redis for session management

4. **Monitoring**
   - Set up Cloud Logging
   - Alert on high latency
   - Track error rates

## 9. SSL/HTTPS Certificate

For custom domains:
- Firebase Hosting: Automatic (free)
- Vercel/Netlify: Automatic (free)
- Custom server: Use Let's Encrypt
```bash
# Using Certbot with Nginx
sudo certbot certonly --nginx -d yourdomain.com
```

## 10. Rollback Procedure

If deployment has issues:

```bash
# Firebase Hosting
firebase hosting:channels:deploy rollback --expires 24h

# GitHub
git revert HEAD
git push

# Rebuild and redeploy
npm run build
firebase deploy
```

## Support

For deployment issues:
1. Check Firebase Console logs
2. Review deployment provider console
3. Check domain/DNS propagation
4. Verify environment variables are set correctly
5. Check browser console for client-side errors

---

**Deployment completed successfully!** ✓

Your IDS 111 Attendance Portal is now live and ready for use.
