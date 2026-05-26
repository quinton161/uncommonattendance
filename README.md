# Hub Attendance Tracker

A modern, responsive web application for tracking student attendance at educational hubs. Built with React TypeScript, Firebase, and styled-components.

## 🚀 Features

### For Students
- ✅ **User Authentication** - Secure sign up and login with Firebase Auth
- 📸 **Profile Management** - Upload and update profile pictures
- 🕒 **Check-In/Check-Out** - Simple attendance tracking with timestamps
- 📍 **Location Capture** - GPS-based location logging for attendance verification
- 📜 **Attendance History** - View personal attendance records

### For Admins
- 📊 **Dashboard Overview** - Real-time view of present students
- 📋 **Attendance Management** - View and filter attendance records
- 🔔 **Live Updates** - Real-time notifications when students check in/out
- 📈 **Analytics** - Attendance patterns and statistics

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Styled Components with custom theme system
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (for profile pictures)
- **Routing**: React Router DOM
- **Geolocation**: Browser Geolocation API

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Firestore and Authentication enabled

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd hub-attendance-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password provider)
3. Create a Firestore database
4. Enable Firebase Storage
5. Copy your Firebase configuration

### 4. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 5. Run the application
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- 📱 **Mobile devices** (320px and up)
- 📱 **Tablets** (768px and up)  
- 💻 **Desktop** (1024px and up)
- 🖥️ **Large screens** (1280px and up)

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Student/        # Student-specific components
│   ├── Admin/          # Admin dashboard components
│   └── Common/         # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── services/           # API services (Firebase, etc.)
├── styles/             # Theme and global styles
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Available Scripts

- `npm start` - Run development server
- `npm test` - Run test suite
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (⚠️ irreversible)

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Other Platforms
The built application in the `build/` folder can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## 🔐 Security Features

- Firebase Authentication with secure token management
- Firestore security rules for data protection
- Location data encryption
- Role-based access control (Student/Admin)

## 🎨 Design System

The app uses a comprehensive design system with:
- Consistent color palette
- Typography scale
- Spacing system
- Component variants
- Responsive breakpoints
- Accessibility considerations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review Firebase setup guides

## 🔮 Future Enhancements

- 📅 Weekly/monthly attendance reports
- 🗺️ Interactive map view for locations
- 📧 Email/SMS notifications
- 📊 Advanced analytics and insights
- 🔄 Offline support with sync
- 📱 Progressive Web App (PWA) features

---

# Full Fix Deployment Guide

## Files Already Updated in This Project

All bug fixes have been applied to the following files:

| File | Description |
|------|-------------|
| `firestore.rules` | Security rules for system_config, dailyAttendance, admin_actions |
| `firestore.indexes.json` | Composite indexes for queries |
| `src/services/timeService.ts` | Wrapper (already correct) |
| `src/services/internetTimeService.ts` | Fixed canCheckIn to return true when not synced |
| `src/services/attendanceService.ts` | Fixed error message strings |
| `src/services/DataService.ts` | Fixed real-time listener, isLate calculation |
| `src/contexts/AuthContext.tsx` | Removed window.location.href redirects |
| `src/components/Admin/DailyAttendanceTracker.tsx` | Fixed late threshold logic |
| `src/components/Admin/UsersPage.tsx` | Added getTodayAttendance fallback |

## What Was Fixed

### Check-in Refusing on All Devices
- `system_config` collection had NO Firestore rules → QR code reads silently returned permission-denied → every code appeared invalid → check-in blocked for everyone
- `internetTimeService.canCheckIn()` returned `false` before the time sync completed (first load, slow connection) → blocked all check-ins until sync finished
- **Fixed**: system_config allows authenticated reads; canCheckIn returns `true` when sync hasn't completed yet

### Late Arrivals Showing Wrong Status
- Old code: `checkInTime.getHours() >= 9` uses browser local timezone, not Harare time
- **Fixed**: Uses `Intl.DateTimeFormat` with `timeZone: 'Africa/Harare'` consistently
- 9:00:00 AM Harare = LATE. 8:59:59 AM Harare = ON TIME.

### Real-time Updates Not Working (Admin Dashboard)
- Old `subscribeToTodayAttendance` subscribed to the entire users collection → fired with an empty array first → summary showed 0 present every update
- **Fixed**: Loads users once upfront, then only listens to attendance changes

### Auth Redirects Breaking on All Devices
- `window.location.href` in register/loginWithGoogle caused full page reloads that raced against Firebase `onAuthStateChanged`
- **Fixed**: Removed - auth state change handles navigation automatically

### dailyAttendance Rules Missing
- Writes to `dailyAttendance` were silently denied → `markPresentToday` always failed
- **Fixed**: Added Firestore rules

### admin_actions Rules Missing
- Admin action logging silently failed → no audit trail
- **Fixed**: Added Firestore rules

### Older Records Missing `date` Field
- `getTodayAttendance` in UsersPage only checked `a.date === today`
- **Fixed**: Added fallback to derive date from checkInTime

## Deploy to Firebase

```bash
firebase deploy --only firestore
```

## Deploy Frontend to Vercel

```bash
npm run build
vercel --prod
```
