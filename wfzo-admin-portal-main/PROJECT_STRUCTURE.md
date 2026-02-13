# WFZO Admin Portal - Project Structure

## Complete File Tree

```
wfzo-admin-portal/
│
├── 📁 app/                                    # Next.js App Router
│   ├── 📁 (auth)/                            # Auth route group (no layout)
│   │   └── 📁 login/
│   │       └── page.tsx                      # Login page with email/password
│   │
│   ├── 📁 (protected)/                       # Protected route group
│   │   ├── 📁 dashboard/
│   │   │   └── page.tsx                      # Dashboard with role-based member list
│   │   │
│   │   └── 📁 members/
│   │       └── 📁 [id]/
│   │           └── page.tsx                  # Member details with workflow & actions
│   │
│   ├── globals.css                           # Tailwind directives & global styles
│   ├── layout.tsx                            # Root layout (font, AuthProvider)
│   └── page.tsx                              # Home page (redirects to /login)
│
├── 📁 components/                             # Reusable UI components
│   ├── Header.tsx                            # Top nav bar (title, user info, logout)
│   ├── LoadingSpinner.tsx                    # Loading indicator
│   ├── ProtectedLayout.tsx                   # HOC for route protection
│   └── StatusBadge.tsx                       # Status pill component
│
├── 📁 context/                                # React Context providers
│   └── AuthContext.tsx                       # Auth state (user, login, logout)
│
├── 📁 lib/                                    # Business logic & utilities
│   ├── 📁 api/
│   │   └── memberApi.ts                      # API client (auth, member endpoints)
│   │
│   └── 📁 types/
│       └── api.ts                            # TypeScript type definitions
│
├── 📁 public/                                 # Static assets (empty for now)
│
├── .env.local                                # Environment variables
├── .eslintrc.json                            # ESLint configuration
├── .gitignore                                # Git ignore rules
├── next.config.js                            # Next.js configuration
├── package.json                              # Dependencies & scripts
├── postcss.config.mjs                        # PostCSS configuration
├── README.md                                 # Project documentation
├── tailwind.config.ts                        # Tailwind CSS configuration
└── tsconfig.json                             # TypeScript configuration
```

## Key Files Explained

### Root Configuration Files

#### `package.json`
- Dependencies: React, Next.js, TypeScript, Tailwind CSS
- Scripts: dev, build, start, lint
- Port: 3000 (dev server)

#### `tsconfig.json`
- Strict TypeScript configuration
- Path aliases: `@/*` maps to root
- Next.js plugin enabled

#### `tailwind.config.ts`
- Custom color palette (background, primary, secondary)
- Source Sans Pro font family
- Content paths for purging

#### `.env.local`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`

---

### App Directory (`app/`)

#### `layout.tsx` (Root Layout)
- Imports Source Sans Pro font from Google Fonts
- Wraps entire app with `AuthProvider`
- Sets up global font and styling

#### `page.tsx` (Home)
- Simple redirect to `/login`

#### `(auth)/login/page.tsx`
- Login form with email & password
- Calls `/internal/user/login` API
- Stores user + token in AuthContext
- Redirects to `/dashboard` on success

#### `(protected)/dashboard/page.tsx`
- Wrapped in `ProtectedLayout` (requires auth)
- Fetches all members via `memberApi.searchMembers()`
- Filters by role:
  - Committee Member → COMMITTEE stage, PENDING status
  - Board Member → BOARD stage, PENDING status
  - CEO → CEO stage, PENDING status
  - Admin → All members
- Displays table with member details
- "View Details" button navigates to `/members/[id]`

#### `(protected)/members/[id]/page.tsx`
- Fetches single member by ID
- Displays read-only member & organization info
- Shows workflow timeline (Committee → Board → CEO → Payment)
- Role-specific actions:
  - **Committee/Board/CEO**: If at their stage, show Approve/Reject buttons + comment textarea
  - **Admin**: If all 3 approvals done, show payment link input + status dropdown
- Calls appropriate API endpoints on submit
- Shows toast notification on success
- Redirects back to dashboard

---

### Components (`components/`)

#### `Header.tsx`
- Top navigation bar
- Displays portal title and logged-in user info
- Logout button (clears auth, redirects to login)

#### `ProtectedLayout.tsx`
- HOC that wraps protected pages
- Checks if user is authenticated
- Redirects to `/login` if not
- Shows loading spinner while checking auth
- Renders Header + children if authenticated

#### `StatusBadge.tsx`
- Small colored pill for status display
- Colors: PENDING (yellow), APPROVED (green), REJECTED (red), PAID (blue)
- Props: `status`, `size` (sm/md)

#### `LoadingSpinner.tsx`
- Animated circular spinner
- Props: `size` (sm/md/lg), optional `text`

---

### Context (`context/`)

#### `AuthContext.tsx`
- Client-side React Context
- State: `user` (AuthUser | null), `loading` (boolean)
- Functions: `login(user)`, `logout()`
- Persists user to localStorage
- Loads user from localStorage on mount

---

### Library (`lib/`)

#### `api/memberApi.ts`
- API client with typed functions
- Base URL from env variable
- Automatic JWT token injection in headers
- Error handling with custom `ApiError` class
- Exports:
  - `authApi.login()`
  - `memberApi.searchMembers()`
  - `memberApi.getMemberById()`
  - `memberApi.updateMemberStatus()`
  - `memberApi.updatePaymentLink()`
  - `memberApi.updatePaymentStatus()`

#### `types/api.ts`
- TypeScript interfaces for all API data structures
- Types: `UserRole`, `MemberStatus`, `WorkflowStage`, `ApprovalStatus`
- DTOs: `InternalLoginRequestDto`, `InternalLoginResponseDto`, `Member`, etc.
- Matches Swagger schema definitions

---

## Data Flow

### Login Flow
```
User enters credentials
  → LoginPage calls authApi.login()
  → API returns user + token
  → AuthContext.login() stores to state & localStorage
  → Redirect to /dashboard
```

### Dashboard Flow
```
DashboardPage mounts
  → ProtectedLayout checks auth (redirect if not logged in)
  → Fetch members via memberApi.searchMembers()
  → Filter by user role
  → Display table
  → Click "View Details" → Navigate to /members/[id]
```

### Member Details Flow
```
MemberDetailsPage mounts
  → Fetch member by ID
  → Display info + workflow history
  → If can approve (role matches current stage):
      → Show Approve/Reject buttons + comment field
      → On submit → Call memberApi.updateMemberStatus()
      → Show toast → Redirect to dashboard
  → If admin & all approvals complete:
      → Show payment link + status inputs
      → On submit → Call memberApi.updatePaymentLink() + updatePaymentStatus()
      → Show toast → Redirect to dashboard
```

---

## Styling System

### Tailwind Classes
- Background: `bg-background` (#FCFAF8)
- Primary: `text-primary`, `bg-primary`, `border-primary` (#684F31)
- Secondary: `hover:bg-secondary`, `text-secondary` (#9B7548)
- Cards: `bg-white rounded-lg shadow-sm p-6`
- Buttons: `px-4 py-2 rounded-lg transition duration-200`

### Font
- Source Sans Pro loaded via `next/font/google`
- Applied globally via CSS variable

---

## Role-Based Access Summary

| Role              | Dashboard View                 | Member Details Actions                          |
|-------------------|--------------------------------|------------------------------------------------|
| Committee Member  | COMMITTEE + PENDING only       | Approve/Reject if at COMMITTEE stage          |
| Board Member      | BOARD + PENDING only           | Approve/Reject if at BOARD stage              |
| CEO               | CEO + PENDING only             | Approve/Reject if at CEO stage                |
| Admin             | All members, all stages        | Manage payment link/status after all approvals |

---

## Next Steps for Development

1. **Install dependencies**:
   ```bash
   cd wfzo-admin-portal
   npm install
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Test with backend**:
   - Ensure backend is running on `http://localhost:3001`
   - Create test internal users with different roles
   - Test login and workflow

4. **Customization**:
   - Add logo image to `/public` folder
   - Update logo placeholder in `login/page.tsx`
   - Adjust colors in `tailwind.config.ts`
   - Add more validation or business logic as needed

---

## Production Checklist

- [ ] Replace logo placeholder with actual logo
- [ ] Add proper error logging (e.g., Sentry)
- [ ] Add analytics (e.g., Google Analytics)
- [ ] Set up proper .env files for staging/production
- [ ] Add unit tests for components
- [ ] Add E2E tests for critical flows
- [ ] Optimize images and assets
- [ ] Add meta tags for SEO
- [ ] Configure CSP headers
- [ ] Set up CI/CD pipeline
