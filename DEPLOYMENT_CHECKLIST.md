# 📋 Deployment Checklist

## Before Pushing to GitHub

### Environment Files
- [ ] `.env.local` created with `NEXT_PUBLIC_API_URL`
- [ ] `backend/.env` created with all required variables
- [ ] No sensitive data in committed files
- [ ] `.gitignore` excludes `.env` files

### Configuration Files
- [x] `vercel.json` created for Vercel deployment
- [x] `next.config.mjs` optimized for production
- [x] CORS configured for production in `backend/server.js`

### Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with proper permissions
- [ ] Network access configured (0.0.0.0/0 for all IPs)
- [ ] Connection string obtained and tested

## GitHub Repository
- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] Repository is public or accessible to deployment services

## Backend Deployment (Railway/Render)
- [ ] Service created and connected to GitHub
- [ ] Environment variables set:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `FRONTEND_URL` (update after frontend deployment)
- [ ] Backend URL obtained and tested

## Frontend Deployment (Vercel)
- [ ] Project imported from GitHub
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_API_URL` (backend URL)
- [ ] Build successful
- [ ] Frontend URL obtained

## Final Configuration
- [ ] Update `FRONTEND_URL` in backend with Vercel URL
- [ ] Redeploy backend with updated CORS settings
- [ ] Test full application flow:
  - [ ] Registration works
  - [ ] Login works
  - [ ] Check-in/out works
  - [ ] Admin dashboard accessible

## Testing
- [ ] All API endpoints respond correctly
- [ ] Frontend connects to backend successfully
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] Authentication flow complete

## Optional
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Performance monitoring set up
- [ ] Error tracking configured

---

**✅ All items checked = Ready for production!**
