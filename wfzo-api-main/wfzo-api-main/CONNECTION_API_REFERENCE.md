# Connection API Reference - Chat Initiation Support

## Overview
The `/connections` API has been extended to include user details grouped by type, specifically designed for chat initiation workflows.

## Core Principle
**Connections = Member-Only | Users = Grouped for Chat Selection**

## API Endpoint

```
GET /wfzo/api/v1/connections
```

### Query Parameters
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)
- `search` (optional): Search by company name or location

## Response Structure

### Complete Example
```json
{
  "success": true,
  "data": [
    {
      "connectionId": "6965de480df16a5864de9225",
      "member": {
        "memberId": "MEMBER-060",
        "organisationInfo": {
          "companyName": "jparksky",
          "memberLogoUrl": "https://storage.example.com/logos/jparksky.png",
          "address": {
            "line1": "123 Innovation Drive",
            "city": "Seoul",
            "state": "Seoul",
            "country": "South Korea",
            "zip": "12345"
          },
          "industries": ["manufacturing", "technology"]
        },
        "primaryUsers": [
          {
            "userId": "entra-uuid-abc-123",
            "email": "owner@jparksky.com",
            "firstName": "John",
            "lastName": "Park",
            "designation": "Director",
            "userType": "Primary",
            "memberLogoUrl": "https://storage.example.com/logos/jparksky.png"
          }
        ],
        "secondaryUsers": [
          {
            "userId": "entra-uuid-def-456",
            "email": "staff@jparksky.com",
            "firstName": "Anna",
            "lastName": "Lee",
            "designation": "Engineer",
            "userType": "Secondary",
            "userLogoUrl": "https://storage.example.com/users/anna-lee.jpg"
          },
          {
            "userId": "entra-uuid-ghi-789",
            "email": "manager@jparksky.com",
            "firstName": "David",
            "lastName": "Kim",
            "designation": "Operations Manager",
            "userType": "Secondary",
            "userLogoUrl": "https://storage.example.com/users/david-kim.jpg"
          }
        ]
      },
      "connectedAt": "2026-01-13T07:16:17.366Z",
      "status": "accepted"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

## Field Descriptions

### Top Level
| Field | Type | Description |
|-------|------|-------------|
| `connectionId` | string | Unique connection identifier |
| `member` | object | Connected member organization details |
| `connectedAt` | ISO 8601 date | When connection was accepted |
| `status` | string | Connection status (always "accepted") |

### member.organisationInfo
| Field | Type | Description |
|-------|------|-------------|
| `companyName` | string | Organization name |
| `memberLogoUrl` | string | Organization logo URL |
| `address` | object | Physical address |
| `industries` | string[] | Industry categories |

### member.primaryUsers[]
**Purpose:** Representatives of the organization (one per member)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Microsoft Entra ID (UUID) |
| `email` | string | User email address |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `designation` | string | Job title |
| `userType` | string | Always "Primary" |
| `memberLogoUrl` | string | Organization logo (for avatar) |

### member.secondaryUsers[]
**Purpose:** Team members of the organization (can be multiple)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Microsoft Entra ID (UUID) |
| `email` | string | User email address |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `designation` | string | Job title |
| `userType` | string | Always "Secondary" |
| `userLogoUrl` | string | Personal profile image URL |

## Data Source
All user data is extracted from `member.userSnapshots[]`:
- Users with `userType: "Primary"` → `primaryUsers[]`
- Users with `userType: "Secondary"` or `"Secondry"` → `secondaryUsers[]`

## Use Cases

### 1. Chat Initiation Selection Screen

**Display Structure:**
```
Connected Organizations
├─ jparksky (MEMBER-060)
│  ├─ Organization Representative
│  │  └─ John Park (Director) → Primary user
│  └─ Team Members
│     ├─ Anna Lee (Engineer) → Secondary user
│     └─ David Kim (Operations Manager) → Secondary user
```

### 2. Member Chat Initiation
Select a **Primary user** to start **Member Chat**:
```typescript
const primaryUser = connection.member.primaryUsers[0];
initiateChat({
  recipientId: connection.member.memberId,
  // No recipientUserId → Member Chat
  displayName: connection.member.organisationInfo.companyName,
  avatar: primaryUser.memberLogoUrl
});
```

### 3. User Chat Initiation
Select a **Secondary user** to start **User Chat**:
```typescript
const secondaryUser = connection.member.secondaryUsers[1]; // Anna Lee
initiateChat({
  recipientId: connection.member.memberId,
  recipientUserId: secondaryUser.userId, // Include userId → User Chat
  displayName: `${secondaryUser.firstName} ${secondaryUser.lastName}`,
  avatar: secondaryUser.userLogoUrl
});
```

## Frontend Integration

### Display Connection List
```typescript
async function loadConnections() {
  const response = await fetch('/wfzo/api/v1/connections');
  const { data: connections } = await response.json();
  
  connections.forEach(conn => {
    // Organization header
    renderOrgHeader({
      name: conn.member.organisationInfo.companyName,
      logo: conn.member.organisationInfo.memberLogoUrl,
      industries: conn.member.organisationInfo.industries
    });
    
    // Primary users section
    if (conn.member.primaryUsers.length > 0) {
      renderSection('Organization Representatives');
      conn.member.primaryUsers.forEach(user => {
        renderUserCard({
          name: `${user.firstName} ${user.lastName}`,
          designation: user.designation,
          avatar: user.memberLogoUrl,
          chatType: 'member',
          onClick: () => initiateMemberChat(conn.member.memberId)
        });
      });
    }
    
    // Secondary users section
    if (conn.member.secondaryUsers.length > 0) {
      renderSection('Team Members');
      conn.member.secondaryUsers.forEach(user => {
        renderUserCard({
          name: `${user.firstName} ${user.lastName}`,
          designation: user.designation,
          avatar: user.userLogoUrl,
          chatType: 'user',
          onClick: () => initiateUserChat(conn.member.memberId, user.userId)
        });
      });
    }
  });
}
```

### Chat Decision Logic
```typescript
function initiateChat(user: User, memberId: string) {
  const chatRequest = {
    recipientId: memberId,
    content: "Hello!"
  };
  
  if (user.userType === 'Secondary') {
    // User Chat
    chatRequest.recipientUserId = user.userId;
  }
  // If Primary and no recipientUserId → Member Chat
  
  return sendMessage(chatRequest);
}
```

## Key Rules

✅ **primaryUsers array:** Contains only users with `userType: "Primary"`
✅ **secondaryUsers array:** Contains only users with `userType: "Secondary"`
✅ **Avatar logic:** Primary users use `memberLogoUrl`, Secondary users use `userLogoUrl`
✅ **Chat routing:** Primary user without userId = Member Chat, Secondary user always = User Chat
✅ **Data source:** All from `member.userSnapshots[]` (no separate user API calls needed)

## Backward Compatibility

### What Changed
- ✅ **Added:** `member.primaryUsers[]` array
- ✅ **Added:** `member.secondaryUsers[]` array
- ✅ **Unchanged:** All existing `member.organisationInfo` fields
- ✅ **Unchanged:** Top-level response structure

### What Remained
- ✅ `connectionId`, `connectedAt`, `status` - unchanged
- ✅ `member.memberId` - unchanged
- ✅ `member.organisationInfo` - all fields preserved
- ✅ Pagination structure - unchanged

## Testing Scenarios

### Test 1: Primary Users Array
- Verify only users with `userType: "Primary"` appear
- Check `memberLogoUrl` is populated
- Confirm email, firstName, lastName, designation present

### Test 2: Secondary Users Array
- Verify only users with `userType: "Secondary"` appear
- Check `userLogoUrl` is populated (may be null)
- Confirm email, firstName, lastName, designation present

### Test 3: Empty Arrays
- Member with only Primary users → `secondaryUsers: []`
- Member with only Secondary users → `primaryUsers: []` (shouldn't happen)

### Test 4: Chat Initiation
- Select Primary user → Initiate Member Chat without `recipientUserId`
- Select Secondary user → Initiate User Chat with `recipientUserId`
- Verify correct chat type appears in conversation list

### Test 5: Search Functionality
- Search by company name → Filter works
- Search by city → Filter works
- Search applies to all connections

## Error Handling

### Empty User Arrays
```json
{
  "primaryUsers": [],
  "secondaryUsers": []
}
```
**Cause:** Member has no users in userSnapshots (invalid state)
**Frontend:** Show warning "No users available for chat"

### Missing Profile Images
```json
{
  "userLogoUrl": null
}
```
**Frontend:** Use fallback avatar with user initials

### Typo in userType
The service handles the historical typo `"Secondry"` by normalizing it to `"Secondary"`

## Summary

🎯 **Purpose:** Enable chat initiation by providing all user details in one API call
📋 **Structure:** Users grouped by type (Primary vs Secondary)
💬 **Chat Routing:** User type determines Member Chat vs User Chat
🔄 **Backward Compatible:** All existing fields preserved
✅ **Complete:** No additional API calls needed for chat initiation
