# User Management & Role-Based Access Control

## Overview

The WFZO Admin Portal now includes comprehensive user management and role-based access control (RBAC) features.

## Features

### 1. User Management (Admin Only)

Administrators can create and manage internal users through the `/users` page.

**Create User Form:**
- First Name (required)
- Last Name (required)
- Email (required, must be valid email format)
- Roles (required, at least one role must be selected)

**Available Roles:**
- **ADMIN** - Full system access, can manage all users, members, and system settings
- **CEO** - Executive access to view and approve membership applications
- **MEMBERSHIP_BOARD** - Board members who can view and approve membership applications
- **MEMBERSHIP_COMMITTEE** - Can view member details and approve/reject membership applications
- **FINANCE** - Can manage payment links and update payment status for members

### 2. Navigation Menu

The header includes role-based navigation:

- **Members** - Available to all authenticated users
- **Users** - Only visible to ADMIN role
- **Events** - Only visible to ADMIN role

### 3. Multi-Role Support

Users can have multiple roles assigned. When a user logs in with multiple roles:

1. All roles are extracted from the JWT token
2. A role switcher dropdown appears in the header
3. Users can switch between their assigned roles
4. UI permissions update dynamically based on the selected role

**Role Switcher:**
- Located in the header next to user information
- Only visible when user has multiple roles
- Clicking shows a dropdown with all assigned roles
- Selecting a role refreshes the page to apply new permissions

### 4. Role-Based Access Control

Access control is enforced at multiple levels:

**Page Level:**
- Users without required role are redirected to dashboard
- Implemented in each protected page component

**Menu Level:**
- Menu items automatically hide based on user's roles
- Admin-only items only visible to ADMIN role users

**API Level:**
- User token includes all roles for backend validation
- Backend enforces role-based permissions on all endpoints

## API Endpoints

### Authentication
```
POST /wfzo/api/v1/internal/user/login
```

### Roles
```
GET /wfzo/api/v1/internal/user/roles/list
```

### User Management
```
GET    /wfzo/api/v1/internal/user          # Get all users
POST   /wfzo/api/v1/internal/user          # Create user
GET    /wfzo/api/v1/internal/user/:id      # Get user by ID
PUT    /wfzo/api/v1/internal/user/:id      # Update user
DELETE /wfzo/api/v1/internal/user/:id      # Delete user
```

## Usage

### Creating a New User (Admin)

1. Navigate to **Users** page (only visible to admins)
2. Click **Create User** button
3. Fill in the form:
   - Enter first name, last name, and email
   - Select one or more roles by checking the checkboxes
   - Each role shows description and privilege count
4. Click **Create User** to save
5. User appears in the users table

### Switching Roles (Multi-Role Users)

1. Look for the role dropdown in the header (appears if you have multiple roles)
2. Click the dropdown to see all your assigned roles
3. Select the role you want to use
4. Page refreshes with new permissions applied
5. Menu items and access control update based on selected role

### Accessing Features

- **Members**: All authenticated users can access
- **Users**: Only ADMIN role
- **Events**: Only ADMIN role (placeholder for future feature)

## Security

- All routes under `(protected)` require authentication
- Role checks performed on:
  - Client-side (UI rendering)
  - Server-side (API calls)
- JWT token contains all user roles
- Token is validated on each API request
- Roles are immutable once assigned (requires admin to change)

## Technical Implementation

### Files Created/Modified

**New Pages:**
- `/app/(protected)/users/page.tsx` - User management page
- `/app/(protected)/events/page.tsx` - Events placeholder page

**Updated Components:**
- `/components/Header.tsx` - Added menu and role switcher

**New Utilities:**
- `/lib/utils/rbac.ts` - Role-based access control utilities

**Updated APIs:**
- `/lib/api/memberApi.ts` - Added roles and users endpoints
- `/lib/types/api.ts` - Added Role, InternalUser, CreateInternalUserDto types

**Updated Auth:**
- `/app/(auth)/login/page.tsx` - Extract and store multiple roles
- `/context/AuthContext.tsx` - Support multi-role users

### Helper Functions

```typescript
import { getRolesFromToken, hasRole, isAdmin, getRoleName } from '@/lib/utils/rbac';

// Get all roles from token
const roles = getRolesFromToken(user.token);

// Check specific role
if (hasRole(user.token, 'ADMIN')) {
  // User is admin
}

// Check if admin
if (isAdmin(user.token)) {
  // User is admin
}

// Get role display name
const name = getRoleName('ADMIN'); // Returns "Administrator"
```

## Future Enhancements

- User profile editing
- Password reset functionality
- User deactivation/reactivation
- Audit log for user actions
- Events management module
- Fine-grained permissions within roles
