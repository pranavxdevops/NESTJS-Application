# Quick Setup Guide

## Prerequisites
- Node.js 18 or higher
- npm or yarn
- Backend API running at http://localhost:3001

## Installation Steps

### 1. Navigate to Project Directory
```bash
cd /tmp/wfzo-admin-portal
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- React 18.3.1
- Next.js 15.0.0
- TypeScript 5.6.0
- Tailwind CSS 3.4.0
- And all other dependencies

### 3. Verify Environment Variables
Check `.env.local` contains:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### 4. Start Development Server
```bash
npm run dev
```

The application will start on **http://localhost:3000**

### 5. Test Login

Open http://localhost:3000 in your browser. You'll be redirected to the login page.

Use credentials from your backend system (internal users created via the backend API).

Example login flow:
1. Enter email (e.g., `committee@wfzo.com`)
2. Enter password
3. Click "Sign In"
4. You'll be redirected to the dashboard

## Folder Overview

```
wfzo-admin-portal/
├── app/                    # Pages and routing
├── components/             # Reusable components
├── context/                # Auth context
├── lib/                    # API client & types
├── .env.local             # Environment config
├── package.json           # Dependencies
└── README.md              # Full documentation
```

## Available Scripts

```bash
# Development server (port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Testing Different Roles

To test the application with different roles, you'll need to create internal users in your backend with these roles:

1. **Committee Member** - Can approve/reject at Committee stage
2. **Board Member** - Can approve/reject at Board stage  
3. **CEO** - Can approve/reject at CEO stage
4. **Admin** - Can manage payment links and status

Login with each user type to see role-specific views.

## Common Issues

### Port 3000 Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Backend Not Reachable
- Ensure backend is running on port 3001
- Check Swagger docs at http://localhost:3001/docs
- Verify CORS is enabled on backend

### TypeScript Errors During Development
These are expected before running `npm install`. After installation, the dev server will handle them.

## Next Steps

1. Read `README.md` for full documentation
2. Review `PROJECT_STRUCTURE.md` for architecture details
3. Customize colors in `tailwind.config.ts`
4. Add your logo to `/public` folder
5. Update logo in `app/(auth)/login/page.tsx`

## Support

For questions or issues:
1. Check the README.md
2. Review the PROJECT_STRUCTURE.md
3. Inspect the Swagger docs at http://localhost:3001/docs
4. Check browser console for errors

## Production Deployment

When ready for production:

```bash
# Build the application
npm run build

# Start production server
npm start
```

For deployment to Vercel, Netlify, or other platforms, follow their Next.js deployment guides.

---

**You're all set!** 🚀

Run `npm install && npm run dev` to get started.
