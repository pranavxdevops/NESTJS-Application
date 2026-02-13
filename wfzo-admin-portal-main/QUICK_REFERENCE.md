# 🎴 WFZO Admin Portal - Quick Reference Card

**Keep this handy while developing!**

---

## 🚀 Essential Commands

```bash
cd /tmp/wfzo-admin-portal  # Navigate to project
npm install                 # Install dependencies
npm run dev                 # Start dev server (port 3000)
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run linter
```

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Admin portal UI |
| Backend | http://localhost:3001 | API server |
| Swagger | http://localhost:3001/docs | API documentation |

---

## 👥 User Roles Quick Guide

| Role | Dashboard View | Can Do |
|------|---------------|--------|
| **Committee Member** | COMMITTEE + PENDING | Approve/Reject at Committee |
| **Board Member** | BOARD + PENDING | Approve/Reject at Board |
| **CEO** | CEO + PENDING | Approve/Reject at CEO |
| **Admin** | ALL members | Payment management |

---

## 📁 Important Files

| File | Location | Purpose |
|------|----------|---------|
| Login page | `app/(auth)/login/page.tsx` | User authentication |
| Dashboard | `app/(protected)/dashboard/page.tsx` | Main member list |
| Member details | `app/(protected)/members/[id]/page.tsx` | Details + workflow |
| API client | `lib/api/memberApi.ts` | Backend calls |
| Types | `lib/types/api.ts` | TypeScript interfaces |
| Auth context | `context/AuthContext.tsx` | Auth state |
| Colors | `tailwind.config.ts` | Design system |
| Env vars | `.env.local` | Configuration |

---

## 🎨 Color Palette

```css
Background: #FCFAF8
Primary:    #684F31  /* Buttons, headings */
Secondary:  #9B7548  /* Hover, borders */
```

### Status Colors
- 🟡 PENDING → `bg-yellow-100 text-yellow-800`
- 🟢 APPROVED → `bg-green-100 text-green-800`
- 🔴 REJECTED → `bg-red-100 text-red-800`
- 🔵 PAID → `bg-blue-100 text-blue-800`

---

## 🔄 Workflow States

```
COMMITTEE → BOARD → CEO → PAYMENT → COMPLETE
    ✅         ✅      ✅       💰        🎉
```

**Any rejection stops the workflow**

---

## 🔌 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/internal/user/login` | POST | Login |
| `/member` | GET | List members |
| `/member/{id}` | GET | Get member details |
| `/member/status/{id}` | PUT | Update status |
| `/member/payment-link/{id}` | PUT | Update payment link |
| `/member/payment-status/{id}` | PUT | Update payment status |

---

## 📦 Main Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "next": "^15.0.0",
  "typescript": "^5.6.0",
  "tailwindcss": "^3.4.0"
}
```

---

## 🎯 Component Hierarchy

```
App
└── AuthProvider (context)
    └── Layout (root)
        ├── Login Page
        └── ProtectedLayout
            ├── Header
            └── Protected Pages
                ├── Dashboard
                └── Member Details
                    ├── StatusBadge
                    └── LoadingSpinner
```

---

## 🔐 Auth Flow Quick Reference

```typescript
// Login
authApi.login({ email, password })
  → Returns: { access_token, user }
  → Store in AuthContext
  → Redirect to /dashboard

// Logout
AuthContext.logout()
  → Clear localStorage
  → Redirect to /login

// Check Auth
useAuth() hook
  → Returns: { user, loading, login, logout }
```

---

## 📊 Data Flow

```
Component → API Client → Backend
                ↓
           Transform
                ↓
         TypeScript Types
                ↓
           Component State
                ↓
              Render UI
```

---

## 🛠️ Common Tasks

### Change API Base URL
Edit `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://your-api-url
```

### Update Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  background: "#NEW_COLOR",
  primary: "#NEW_COLOR",
  secondary: "#NEW_COLOR",
}
```

### Add New Page
1. Create file in `app/` folder
2. Export default React component
3. Add navigation link

### Add New API Call
1. Add function to `lib/api/memberApi.ts`
2. Add types to `lib/types/api.ts`
3. Call from component

---

## 🧪 Testing Scenarios

### Test Approval Flow
1. Login as Committee → Approve
2. Login as Board → Approve
3. Login as CEO → Approve
4. Login as Admin → Add payment

### Test Rejection
1. Login as any approver
2. Click Reject
3. Add comment
4. Submit
5. Verify status = REJECTED

### Test Role Filtering
1. Login with each role
2. Verify dashboard shows correct data
3. Verify actions available match role

---

## 🐛 Debugging Tips

### Check Browser Console
```
F12 → Console tab
```
See API calls, errors, logs

### Check Network Tab
```
F12 → Network tab
```
See HTTP requests/responses

### Check React DevTools
Install extension → Inspect component state

### Check Backend Logs
Look at terminal running backend

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Port in use | `npm run dev -- -p 3001` |
| Login fails | Create internal users first |
| No data showing | Check backend has data |
| TypeScript errors | Run `npm install` |
| Can't connect to API | Check backend is running |

---

## 📚 Documentation Quick Links

- **Getting Started** → GETTING_STARTED.md
- **Full Docs** → README.md
- **Architecture** → PROJECT_STRUCTURE.md
- **API Reference** → API_EXAMPLES.md
- **User Flows** → USER_FLOWS.md
- **Quick Setup** → SETUP.md
- **Summary** → SUMMARY.md
- **File List** → MANIFEST.md
- **This Card** → QUICK_REFERENCE.md

---

## 🎯 Environment Variables

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Optional (add as needed)
# NEXT_PUBLIC_API_TIMEOUT=5000
# NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## 📱 Responsive Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Small screens */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

---

## 🎨 Typography Scale

```typescript
// Source Sans Pro
font-sans: Source Sans Pro

// Weights
font-light:    300
font-normal:   400
font-semibold: 600
font-bold:     700
```

---

## 🔄 Git Workflow (Recommended)

```bash
# After making changes
git add .
git commit -m "Description of changes"
git push origin main

# Create feature branch
git checkout -b feature/new-feature
# Make changes
git commit -m "Add new feature"
git push origin feature/new-feature
```

---

## 💾 LocalStorage Keys

```typescript
// Used by app
wfzo_auth_user: {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  token: string
}
```

---

## 🔍 Useful VS Code Extensions

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint

---

## ⌨️ Keyboard Shortcuts

```
F12         → Open DevTools
Cmd/Ctrl+K  → Clear console
Cmd/Ctrl+S  → Save file
Cmd/Ctrl+P  → Quick file open
Cmd/Ctrl+`  → Toggle terminal
```

---

## 📞 Getting Help

1. **Check documentation** - 9 .md files
2. **Check browser console** - F12
3. **Check backend logs** - Terminal
4. **Check Swagger docs** - http://localhost:3001/docs
5. **Review code comments** - Inline documentation

---

## ✅ Pre-Deployment Checklist

- [ ] `npm run build` succeeds
- [ ] All TypeScript errors fixed
- [ ] All linting errors fixed
- [ ] Environment variables set
- [ ] Logo updated
- [ ] Colors customized
- [ ] All roles tested
- [ ] Mobile tested
- [ ] Backend accessible from production

---

## 🎉 Quick Win Checklist

After installation:
- [ ] `npm run dev` works
- [ ] Can login
- [ ] Dashboard loads
- [ ] Can view member details
- [ ] Can perform role-specific actions
- [ ] Can logout

---

**Keep this card nearby while developing!**

**Last Updated:** November 21, 2025
