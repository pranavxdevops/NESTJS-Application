# WFZO Admin Portal

A production-ready admin portal for managing member onboarding requests with role-based workflow approvals and payment processing.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Source Sans Pro

## Features

### Authentication
- Login with existing backend API (`/internal/user/login`)
- Role-based access control
- Persistent session management
- Protected routes with automatic redirection

### User Roles
- **Committee Member**: Review and approve/reject at Committee stage
- **Board Member**: Review and approve/reject at Board stage
- **CEO**: Review and approve/reject at CEO stage
- **Admin**: View all requests, manage payment links and status

### Dashboard
- Role-specific filtered view of pending requests
- Tabular display with member details
- Real-time status updates
- Quick navigation to detailed member views

### Member Details & Workflow
- Comprehensive member and organization information (read-only)
- Complete workflow timeline showing all approval stages
- Approval/rejection with mandatory comments
- Payment management for Admin after all approvals
- Status badges and visual indicators

## Project Structure

```
wfzo-admin-portal/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard with role-based filtering
│   │   └── members/
│   │       └── [id]/
│   │           └── page.tsx      # Member details & workflow
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with font
│   └── page.tsx                  # Home redirect
├── components/
│   ├── Header.tsx                # Top navigation with user info
│   ├── LoadingSpinner.tsx        # Loading state component
│   ├── ProtectedLayout.tsx       # Route protection wrapper
│   └── StatusBadge.tsx           # Status indicator badges
├── context/
│   └── AuthContext.tsx           # Auth state management
├── lib/
│   ├── api/
│   │   └── memberApi.ts          # API client for all endpoints
│   └── types/
│       └── api.ts                # TypeScript type definitions
├── .env.local                    # Environment variables
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running at `http://localhost:3001`
- Swagger documentation available at `http://localhost:3001/docs`

### Installation

1. Navigate to the project directory:
   ```bash
   cd wfzo-admin-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Login

Use credentials configured in your backend system:
- Email: Your internal user email
- Password: Your internal user password

The system will authenticate against `/internal/user/login` and store the JWT token for subsequent API calls.

## API Integration

The application integrates with the following backend endpoints:

### Authentication
- `POST /internal/user/login` - User login

### Member Management
- `GET /member` - Search/list members with filters
- `GET /member/{memberId}` - Get member details
- `PUT /member/status/{memberId}` - Update approval workflow status
- `PUT /member/payment-link/{memberId}` - Update payment link
- `PUT /member/payment-status/{memberId}` - Update payment status

All API calls are handled through the `memberApi` client in `lib/api/memberApi.ts` with proper TypeScript typing.

## Workflow Process

### Member Onboarding Flow

1. **Committee Stage**
   - Committee Member reviews application
   - Approves or rejects with comments
   - On approval, moves to Board stage

2. **Board Stage**
   - Board Member reviews application
   - Approves or rejects with comments
   - On approval, moves to CEO stage

3. **CEO Stage**
   - CEO reviews application
   - Approves or rejects with comments
   - On approval, moves to Payment stage

4. **Payment Stage**
   - Admin adds payment link
   - Updates payment status (Pending/Paid)
   - Completes onboarding process

### Role-Based Access

Each role sees only relevant requests:
- **Committee/Board/CEO**: Only requests at their current stage
- **Admin**: All requests regardless of stage

## Color Palette

Based on your Figma design:
- Background: `#FCFAF8`
- Primary (buttons, headings): `#684F31`
- Secondary (hover, borders): `#9B7548`

## Development

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Key Features Implementation

### Authentication & Authorization
- Client-side auth context with localStorage persistence
- Route protection via `ProtectedLayout` component
- Automatic token injection in API requests

### Loading & Error States
- Dedicated loading spinner component
- Error boundaries with user-friendly messages
- Toast notifications for action feedback

### Responsive Design
- Mobile-friendly table layouts
- Responsive grid systems
- Tailwind utility classes for breakpoints

### Type Safety
- Full TypeScript coverage
- API response type definitions
- Props validation for all components

## Extending the Application

### Adding New Roles

1. Update `UserRole` type in `lib/types/api.ts`
2. Add role handling in `filterMembersByRole` in dashboard
3. Update `canApprove` logic in member details page

### Adding New Workflow Stages

1. Add stage to `WorkflowStage` type
2. Update `getStageDisplay` mapping
3. Add stage rendering in workflow history
4. Update API integration if needed

### Custom Styling

Modify `tailwind.config.ts` to adjust:
- Color schemes
- Typography
- Spacing
- Breakpoints

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - WFZO Internal Use Only
