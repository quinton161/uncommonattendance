# Hub Attendance Tracker

A modern, responsive web application for tracking student attendance at educational hubs. Built with React 
TypeScript, Convex, and styled-components.

## 🚀 Features

### For Students
- ✅ **User Authentication** - Secure sign up and login with Clerk
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
- **Authentication**: Clerk
- **Database**: Convex
- **Storage**: Convex file storage
- **Routing**: React Router DOM
- **Geolocation**: Browser Geolocation API

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Convex project and Clerk application configured

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

### 3. Convex Setup
1. Install [Convex](https://www.convex.dev/) account and create a new project
2. Run `npx convex dev` from the project root to link your local code to the Convex cloud project
3. Follow the prompts to authenticate and select your project

### 4. Clerk Setup
1. Create a [Clerk](https://dashboard.clerk.com/) application
2. Enable the sign-in methods you want (Email/Password, Google, etc.)
3. Copy your Clerk publishable key

### 5. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your configuration:
```env
REACT_APP_CONVEX_URL=https://your-project.convex.cloud
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Run the application
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
├── convex/             # Convex backend functions
├── hooks/              # Custom React hooks
├── services/           # API services (Convex, etc.)
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

### Convex Deployment
```bash
npx convex deploy
```

### Other Platforms
The built application in the `build/` folder can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## 🔐 Security Features

- Clerk Authentication with secure session management
- Convex backend with built-in authentication
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
- Review Convex and Clerk setup guides

## 🔮 Future Enhancements

- 📅 Weekly/monthly attendance reports
- 🗺️ Interactive map view for locations
- 📧 Email/SMS notifications
- 📊 Advanced analytics and insights
- 🔄 Offline support with sync
- 📱 Progressive Web App (PWA) features

---
