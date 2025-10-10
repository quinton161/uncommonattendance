#!/usr/bin/env node

/**
 * Script to update backend URL in environment files
 * Usage: node update-backend-url.js <your-backend-url>
 * Example: node update-backend-url.js https://uncommonattendance-backend.onrender.com
 */

const fs = require('fs');
const path = require('path');

const backendUrl = process.argv[2];

if (!backendUrl) {
  console.error('❌ Please provide a backend URL');
  console.log('Usage: node update-backend-url.js <your-backend-url>');
  console.log('Example: node update-backend-url.js https://uncommonattendance-backend.onrender.com');
  process.exit(1);
}

// Ensure URL doesn't end with /api
const cleanUrl = backendUrl.replace(/\/api$/, '');
const apiUrl = `${cleanUrl}/api`;

console.log(`🔄 Updating backend URL to: ${apiUrl}`);

// Files to update
const filesToUpdate = [
  '.env.production',
  'vercel.json',
  'src/lib/api.ts'
];

// Update .env.production
const envProductionPath = '.env.production';
if (fs.existsSync(envProductionPath)) {
  const envContent = `# Production Environment Variables
# Backend URL updated on ${new Date().toISOString()}
NEXT_PUBLIC_API_URL=${apiUrl}
`;
  fs.writeFileSync(envProductionPath, envContent);
  console.log(`✅ Updated ${envProductionPath}`);
}

// Update vercel.json
const vercelJsonPath = 'vercel.json';
if (fs.existsSync(vercelJsonPath)) {
  const vercelConfig = {
    "version": 2,
    "env": {
      "NEXT_PUBLIC_API_URL": apiUrl
    },
    "build": {
      "env": {
        "NEXT_PUBLIC_API_URL": apiUrl
      }
    }
  };
  fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
  console.log(`✅ Updated ${vercelJsonPath}`);
}

// Update backend CORS in server.js
const backendServerPath = 'backend/server.js';
if (fs.existsSync(backendServerPath)) {
  let serverContent = fs.readFileSync(backendServerPath, 'utf8');
  
  // Update CORS origin
  const frontendUrl = 'https://uncommonattendance.onrender.com';
  serverContent = serverContent.replace(
    /origin: process\.env\.NODE_ENV === 'production'\s*\?\s*\[.*?\]/,
    `origin: process.env.NODE_ENV === 'production' 
    ? ['${frontendUrl}']`
  );
  
  fs.writeFileSync(backendServerPath, serverContent);
  console.log(`✅ Updated CORS in ${backendServerPath}`);
}

console.log('\n🎉 Backend URL updated successfully!');
console.log('\n📝 Next steps:');
console.log('1. Commit and push your changes');
console.log('2. Redeploy your frontend');
console.log('3. Test the application');
console.log(`\n🔗 Your backend should be available at: ${cleanUrl}/api/health`);
