# 🚀 Getting Started with WFZO Admin Portal

**Welcome!** This guide will get you up and running in under 5 minutes.

---

## ✅ Prerequisites Check

Before you begin, ensure you have:

- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should show v18.0.0 or higher
  ```

- [ ] **npm** installed (comes with Node.js)
  ```bash
  npm --version
  ```

- [ ] **Backend API running** at http://localhost:3001
  ```bash
  curl http://localhost:3001/docs  # Should return Swagger UI
  ```

- [ ] **Terminal/Command Prompt** open

---

## 🏃‍♂️ Quick Start (3 Steps)

### Step 1: Navigate to Project Directory
```bash
cd /tmp/wfzo-admin-portal
```

### Step 2: Install Dependencies
```bash
npm install
```

This will take 1-2 minutes and install all necessary packages.

### Step 3: Start Development Server
```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

---

## 🌐 Open in Browser

Navigate to: **http://localhost:3000**

You'll be automatically redirected to the login page.

---

## 🔐 First Login

### Option 1: Using Backend Internal User

If you have internal users created in your backend:

1. Enter your **email** (e.g., `committee@wfzo.com`)
2. Enter your **password**
3. Click **"Sign In"**
4. You'll be redirected to the dashboard

### Option 2: Create Test Users First

If you don't have users yet, create them via your backend API:

```bash
# Example: Create a Committee Member user
curl -X POST http://localhost:3001/internal/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "committee@wfzo.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Committee Member"
  }'
```

Create users for all 4 roles:
- Committee Member
- Board Member
- CEO
- Admin

---

## 🎯 What to Do Next

### 1. Test the Dashboard (30 seconds)

After logging in:
- ✅ See the dashboard with member requests
- ✅ Notice role-based filtering (only shows relevant requests)
- ✅ Check the header (shows your name and role)

### 2. View Member Details (1 minute)

- Click **"View Details →"** on any member
- See complete member information
- Review workflow history
- Check available actions based on your role

### 3. Test Approval Flow (2 minutes)

If logged in as Committee/Board/CEO:
- Enter a comment in the textarea
- Click **"Approve"** or **"Reject"**
- See the success toast notification
- Get redirected back to dashboard

If logged in as Admin and all approvals are complete:
- Enter a payment link
- Select payment status
- Click **"Save Payment Information"**

### 4. Test Different Roles (3 minutes)

Logout and login with different roles to see:
- Different dashboard views
- Different permissions
- Role-specific actions

---

## 📊 Understanding Your Dashboard

### Committee Member View
Shows only: `COMMITTEE` stage + `PENDING` status
- **Why?** You can only approve requests at Committee stage

### Board Member View
Shows only: `BOARD` stage + `PENDING` status
- **Why?** You can only approve requests at Board stage

### CEO View
Shows only: `CEO` stage + `PENDING` status
- **Why?** You can only approve requests at CEO stage

### Admin View
Shows: **ALL** members, all stages, all statuses
- **Why?** Admins need overview and payment management

---

## 🎨 Visual Tour

### Login Page
```
┌─────────────────────────────────────┐
│                                     │
│          [WFZO Logo]                │
│                                     │
│      WFZO Admin Portal              │
│  Member Onboarding Management       │
│                                     │
│  Email: [________________]          │
│                                     │
│  Password: [____________]           │
│                                     │
│       [   Sign In   ]               │
│                                     │
└─────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ WFZO Admin Portal         John Doe | Committee | Logout │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Pending Committee Approval                             │
│  Review and approve member applications                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Name  | Org | Type | Stage | Status | Date | View│ │
│  ├───────────────────────────────────────────────────┤ │
│  │ Alice | Tech| Gold | Comm  | PEND  | Nov 21|  →  │ │
│  │ Bob   | Corp| Silv | Comm  | PEND  | Nov 20|  →  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Member Details (for Approvers)
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                      [PENDING 🟡]   │
│                                                         │
│ Alice Johnson                                           │
│ alice@example.com                                       │
│                                                         │
│ ┌─ Member Information ────────────────────────────┐    │
│ │ Name: Alice Johnson                             │    │
│ │ Email: alice@example.com                        │    │
│ │ Membership: Gold                                │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─ Workflow History ──────────────────────────────┐    │
│ │ Committee Review          [PENDING 🟡]          │    │
│ │ Board Review              [Waiting ⏳]          │    │
│ │ CEO Review                [Waiting ⏳]          │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─ Approval Action ───────────────────────────────┐    │
│ │ Comment: [_____________________________]        │    │
│ │          [_____________________________]        │    │
│ │                                                 │    │
│ │ [  ✅ Approve  ]  [  ❌ Reject  ]               │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### ❌ Port 3000 Already in Use

**Solution:**
```bash
npm run dev -- -p 3001
# Then open http://localhost:3001
```

### ❌ Cannot Connect to Backend API

**Check:**
1. Is backend running? `curl http://localhost:3001/docs`
2. Is the port correct in `.env.local`?
3. Try restarting backend

**Solution:**
```bash
# Update .env.local if backend is on different port
NEXT_PUBLIC_API_BASE_URL=http://localhost:YOUR_PORT
```

### ❌ Login Fails

**Check:**
1. Do you have internal users created?
2. Are you using correct credentials?
3. Check backend logs for errors

**Solution:**
Create users via backend API first (see "First Login" section)

### ❌ npm install Fails

**Check Node.js version:**
```bash
node --version  # Must be 18+
```

**Solution:**
```bash
# Update Node.js or use nvm
nvm install 18
nvm use 18
```

### ❌ TypeScript Errors in Editor

These are normal before running `npm install`.

**Solution:**
Run `npm install` first. Your IDE will pick up types automatically.

---

## 📚 Next Steps

Once you're comfortable with the basics:

### 1. Read the Documentation
- **[README.md](./README.md)** - Complete project overview
- **[USER_FLOWS.md](./USER_FLOWS.md)** - Visual workflow diagrams
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - API integration guide

### 2. Customize the App
- Update colors in `tailwind.config.ts`
- Add logo to `/public` folder
- Modify `app/(auth)/login/page.tsx` to use your logo

### 3. Test Thoroughly
- Login with all 4 roles
- Test approval workflow end-to-end
- Test rejection scenarios
- Test payment management

### 4. Deploy to Production
```bash
npm run build
npm start
```

---

## 🎓 Learning Resources

### Next.js
- Docs: https://nextjs.org/docs
- Tutorial: https://nextjs.org/learn

### TypeScript
- Docs: https://www.typescriptlang.org/docs
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- Playground: https://play.tailwindcss.com

---

## ✨ Tips for Success

### 1. Use the Right Role
Make sure you're logged in with the correct role for what you want to test.

### 2. Check Backend First
If something doesn't work, check your backend Swagger docs to ensure the endpoint exists and returns expected data.

### 3. Follow the Workflow
Members must go through stages in order: Committee → Board → CEO → Payment

### 4. Read Error Messages
The UI shows helpful error messages. Read them carefully.

### 5. Use Browser DevTools
Open browser console (F12) to see API calls and debug issues.

---

## 🎯 Success Checklist

After following this guide, you should be able to:

- [ ] Access http://localhost:3000
- [ ] Login successfully
- [ ] See the dashboard with member requests
- [ ] View member details
- [ ] Perform approval/rejection (if appropriate role)
- [ ] See workflow history
- [ ] Logout and login with different roles
- [ ] Understand role-based access

---

## 🆘 Need Help?

### Check These First:
1. **[SETUP.md](./SETUP.md)** - Quick setup guide
2. **[README.md](./README.md)** - Full documentation
3. Browser console (F12) - Check for errors
4. Backend logs - Check for API errors

### Common Issues:
- Backend not running → Start backend first
- Port conflict → Use different port with `npm run dev -- -p 3001`
- Login fails → Create internal users in backend
- No data showing → Check backend has member data

---

## 🎉 You're Ready!

**That's it!** You now have a fully functional admin portal running.

Explore the features, test different roles, and refer to the documentation files for detailed information.

**Happy developing! 🚀**

---

## 📞 Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Start on different port
npm run dev -- -p 3001
```

---

## 🔗 Important URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/docs

---

**Let's get started! Run `npm install && npm run dev` now! 🚀**
