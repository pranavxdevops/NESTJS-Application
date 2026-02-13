# Internal Team Chat - Connections API Enhancement

## 🎯 Overview

Extended the **Connections API** to include same-member (internal team) users, enabling internal chat while preserving all existing external connection functionality.

## ✅ What Changed

### API: `GET /wfzo/api/v1/connections`

**Before:** Only returned connected members (external connections)  
**After:** Returns connected members + internal team members

## 📋 New Behavior

### Connection List Now Includes

1. **Internal Team** (NEW)
   - Users from your own company/member
   - Excludes yourself (no self-chat)
   - Appears as first item in list
   
2. **External Connections** (Unchanged)
   - Users from connected members
   - Existing behavior preserved

## 🔐 Access Rules

### Primary User Can Chat With
- ✅ All secondary users in their company (internal)
- ✅ Primary user in their company (if multiple primaries exist)
- ✅ All users at connected companies (external)

### Secondary User Can Chat With
- ✅ Primary user in their company (internal)
- ✅ Other secondary users in their company (internal)
- ✅ All users at connected companies (external)

### Universal Rules
- ❌ Cannot chat with yourself
- ✅ One-to-one chat only
- ✅ Must have connection for external chat

## 📊 Response Structure

### Example Response

```json
{
  "connections": [
    {
      "connectionId": null,  // ← No connection record for internal team
      "member": {
        "memberId": "MEMBER-005",  // ← YOUR company
        "organisationInfo": {
          "companyName": "Your Company",
          "memberLogoUrl": "https://...",
          "industries": ["Technology"]
        },
        "primaryUsers": [
          {
            "userId": "primary-user-id",
            "email": "ceo@yourcompany.com",
            "firstName": "John",
            "lastName": "Doe",
            "designation": "CEO",
            "userType": "Primary",
            "profileImageUrl": "https://...",
            "memberLogoUrl": "https://..."
          }
        ],
        "secondaryUsers": [
          {
            "userId": "secondary-user-id",
            "email": "engineer@yourcompany.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "designation": "Engineer",
            "userType": "Secondary",
            "profileImageUrl": "https://...",
            "userLogoUrl": "https://..."
          }
        ]
      },
      "connectedAt": null,  // ← Not a connection
      "status": "internal",  // ← Special status
      "isInternalTeam": true  // ← NEW: Flag to identify internal team
    },
    {
      "connectionId": "connection-id-123",  // ← Has connection record
      "member": {
        "memberId": "MEMBER-060",  // ← External company
        "organisationInfo": {
          "companyName": "ABC Corp",
          "memberLogoUrl": "https://...",
          "industries": ["Manufacturing"]
        },
        "primaryUsers": [...],
        "secondaryUsers": [...]
      },
      "connectedAt": "2026-01-10T10:00:00Z",  // ← Connection date
      "status": "accepted",  // ← Normal status
      "isInternalTeam": false  // ← NEW: External connection
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 10
}
```

## 🔍 Key Differences

| Field | Internal Team | External Connection |
|-------|---------------|---------------------|
| `connectionId` | `null` | Connection ID string |
| `member.memberId` | **Same as yours** | Different |
| `connectedAt` | `null` | Date string |
| `status` | `"internal"` | `"accepted"` |
| `isInternalTeam` | `true` | `false` |

## 🎨 Frontend Identification

```typescript
function identifyConnectionType(connection, myMemberId) {
  // Method 1: Use isInternalTeam flag
  if (connection.isInternalTeam) {
    return {
      type: 'internal',
      label: 'Your Team',
      icon: '👥'
    };
  }
  
  // Method 2: Check if same memberId
  if (connection.member.memberId === myMemberId) {
    return {
      type: 'internal',
      label: 'Your Team',
      icon: '👥'
    };
  }
  
  // Method 3: Check status
  if (connection.status === 'internal') {
    return {
      type: 'internal',
      label: 'Your Team',
      icon: '👥'
    };
  }
  
  // External connection
  return {
    type: 'external',
    label: connection.member.organisationInfo.companyName,
    icon: '🏢'
  };
}
```

## 📝 Implementation Details

### Code Changes

**File:** `src/modules/connection/connection.service.ts`

#### 1. Added Helper Method
```typescript
private async findMemberAndUserByEmail(email: string): 
  Promise<{ member: MemberDocument; user: any; isPrimary: boolean }>
```
- Works for both Primary and Secondary users
- Returns member, user details, and user type

#### 2. Enhanced `getMyConnections()`
- Uses new helper to get current user details
- Fetches connected members (unchanged)
- **NEW:** Adds internal team users
- Filters out current user (no self-chat)
- Groups users into primaryUsers/secondaryUsers
- Adds `isInternalTeam` flag for easy identification

### User Exclusion Logic

```typescript
// Exclude the logged-in user
const sameMemberUsers = (currentMember.userSnapshots || [])
  .filter((user: any) => user.id !== currentUserId);
```

**Result:** User never sees themselves in the connections list

### Internal Team Positioning

```typescript
// Add internal team as first item
transformedConnections.unshift({
  // Internal team data
});
```

**Result:** Internal team always appears at the top of the list

## 🧪 Testing Scenarios

### Scenario 1: Primary User Logs In

**Company:** MEMBER-005 (has 1 Primary, 2 Secondary users)  
**User:** Primary user

**Expected Connections:**
1. ✅ Internal team (2 Secondary users shown)
2. ✅ External connections (as before)

**Cannot see:** Themselves

---

### Scenario 2: Secondary User Logs In

**Company:** MEMBER-005 (has 1 Primary, 2 Secondary users)  
**User:** Secondary user

**Expected Connections:**
1. ✅ Internal team (1 Primary + 1 other Secondary user shown)
2. ✅ External connections (as before)

**Cannot see:** Themselves

---

### Scenario 3: Single User Company

**Company:** MEMBER-010 (has 1 Primary, 0 Secondary users)  
**User:** Primary user

**Expected Connections:**
1. ❌ No internal team (no other users)
2. ✅ External connections (as before)

---

### Scenario 4: Search Filter

**Request:** `GET /connections?search=ABC`

**Expected:**
- ✅ Internal team shown if company name matches "ABC"
- ✅ External connections with "ABC" in company/location
- ✅ Both filtered by same search logic

## 🚀 Chat Flow

### Internal Chat Flow

1. User opens connections list
2. Sees internal team at top
3. Clicks on team member
4. Sends message with:
   ```json
   {
     "recipientId": "MEMBER-005",  // Same as sender's memberId
     "recipientUserId": "team-member-user-id",
     "content": "Hello team!"
   }
   ```
5. Chat service allows (same member + different userId)

### External Chat Flow (Unchanged)

1. User opens connections list
2. Sees connected companies
3. Clicks on user at connected company
4. Sends message with:
   ```json
   {
     "recipientId": "MEMBER-060",  // Different memberId
     "recipientUserId": "external-user-id",
     "content": "Hello!"
   }
   ```
5. Chat service allows (members are connected)

## ⚠️ Important Notes

### No Breaking Changes
- ✅ All existing connection data unchanged
- ✅ External connections work exactly as before
- ✅ Same response structure (with additions)
- ✅ Same pagination behavior
- ✅ Same search functionality

### New Fields Are Optional
- `isInternalTeam`: Always present (true/false)
- `connectionId`: Can be `null` for internal team
- `connectedAt`: Can be `null` for internal team
- `status`: Can be `"internal"` for internal team

### Backward Compatibility
Frontend can:
1. ✅ Ignore `isInternalTeam` flag → Still works (internal team appears as connection)
2. ✅ Check `member.memberId` === myMemberId → Identifies internal team
3. ✅ Use new flag → Better UX with distinct UI for internal vs external

## 📞 Frontend Recommendations

### UI/UX Suggestions

```
┌─────────────────────────────────────────┐
│ 👥 Your Team               Internal     │  ← Internal team
│                                         │
│ 👤 John Doe (CEO)                       │
│ 👤 Jane Smith (Engineer)                │
├─────────────────────────────────────────┤
│ 🏢 ABC Corp                Connected    │  ← External
│                                         │
│ 👤 Bob Johnson (CEO)                    │
│ 👤 Alice Williams (Manager)             │
└─────────────────────────────────────────┘
```

### Rendering Logic

```typescript
connections.forEach(conn => {
  if (conn.isInternalTeam) {
    renderInternalTeamSection(conn);
  } else {
    renderExternalConnectionSection(conn);
  }
});
```

## 📊 Summary

| Feature | Before | After |
|---------|--------|-------|
| Connected members shown | ✅ Yes | ✅ Yes (unchanged) |
| Internal team members shown | ❌ No | ✅ Yes (NEW) |
| Self in list | ❌ No | ❌ No (unchanged) |
| Chat with team members | ❌ No | ✅ Yes (NEW) |
| Chat with connected members | ✅ Yes | ✅ Yes (unchanged) |
| Response structure | ✅ Works | ✅ Works (enhanced) |

## ✅ Result

- ✅ Primary users can chat internally with Secondary users
- ✅ Secondary users can chat internally with Primary and other Secondary users
- ✅ All users can chat externally with connected members
- ✅ No user can chat with themselves
- ✅ All existing functionality preserved
- ✅ No breaking changes

---

**Status:** ✅ Complete  
**Breaking Changes:** None  
**Server Restart Required:** Yes  
**Database Changes:** None
