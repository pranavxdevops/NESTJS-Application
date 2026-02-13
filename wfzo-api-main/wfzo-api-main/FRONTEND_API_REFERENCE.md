# Frontend API Reference - Member Blocking & Connection Management

**Base URL**: `/wfzo/api/v1`  
**Authentication**: All endpoints require Bearer token in Authorization header

---

## Table of Contents
1. [Connection Management](#1-connection-management)
2. [Member-Level Blocking](#2-member-level-blocking)
3. [User-Level Blocking](#3-user-level-blocking)
4. [Chat/Messaging](#4-chatmessaging)
5. [Error Responses](#5-error-responses)

---

## 1. Connection Management

### 1.1 Get My Connections (with Block Status)

**Endpoint**: `GET /connections`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```typescript
{
  page?: string;      // Default: "1"
  pageSize?: string;  // Default: "10"
  status?: string;    // "pending" | "accepted" | "rejected" | "blocked"
  search?: string;    // Search by company name
}
```

**Example Request**:
```bash
GET /wfzo/api/v1/connections?page=1&pageSize=10
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "connectionId": "6965de480df16a5864de9225",
      "member": {
        "memberId": "MEMBER-060",
        "organisationInfo": {
          "companyName": "TechCorp Solutions",
          "memberLogoUrl": "https://storage.azure.com/logos/member-060.png",
          "address": {
            "street": "123 Tech Street",
            "city": "San Francisco",
            "state": "CA",
            "zipCode": "94105",
            "country": "USA"
          },
          "industries": ["technology", "software"]
        },
        "primaryUsers": [
          {
            "userId": "entra-uuid-primary-1",
            "email": "owner@techcorp.com",
            "firstName": "John",
            "lastName": "Smith",
            "designation": "CEO",
            "userType": "Primary",
            "profileImageUrl": "https://storage.azure.com/profiles/user-1.jpg",
            "memberLogoUrl": "https://storage.azure.com/logos/member-060.png",
            "blockStatus": {
              "isBlocked": false,        // TRUE if any block exists (user or member level)
              "iBlockedThem": false,     // TRUE if current user blocked this user
              "theyBlockedMe": false     // TRUE if this user blocked current user
            }
          }
        ],
        "secondaryUsers": [
          {
            "userId": "entra-uuid-secondary-1",
            "email": "staff@techcorp.com",
            "firstName": "Jane",
            "lastName": "Doe",
            "designation": "Marketing Manager",
            "userType": "Secondary",
            "profileImageUrl": "https://storage.azure.com/profiles/user-2.jpg",
            "userLogoUrl": "https://storage.azure.com/profiles/user-2.jpg",
            "blockStatus": {
              "isBlocked": true,
              "iBlockedThem": true,
              "theyBlockedMe": false
            }
          },
          {
            "userId": "entra-uuid-secondary-2",
            "email": "dev@techcorp.com",
            "firstName": "Bob",
            "lastName": "Johnson",
            "designation": "Developer",
            "userType": "Secondary",
            "profileImageUrl": null,
            "userLogoUrl": null,
            "blockStatus": {
              "isBlocked": false,
              "iBlockedThem": false,
              "theyBlockedMe": false
            }
          }
        ],
        "memberBlockStatus": {
          "isBlocked": false,              // TRUE if member-level block exists
          "blockedBy": null,               // Member ID who blocked (if applicable)
          "blockedAt": null                // Timestamp of member-level block
        }
      },
      "connectedAt": "2026-01-15T10:30:00.000Z",
      "status": "accepted",
      "isInternalTeam": false
    },
    {
      "connectionId": null,
      "member": {
        "memberId": "MEMBER-001",
        "organisationInfo": {
          "companyName": "My Company",
          "memberLogoUrl": "https://storage.azure.com/logos/member-001.png",
          "industries": ["manufacturing"]
        },
        "primaryUsers": [
          {
            "userId": "entra-uuid-me-primary",
            "email": "me@mycompany.com",
            "firstName": "Alice",
            "lastName": "Wilson",
            "designation": "Owner",
            "userType": "Primary",
            "profileImageUrl": "https://storage.azure.com/profiles/me.jpg",
            "memberLogoUrl": "https://storage.azure.com/logos/member-001.png",
            "blockStatus": {
              "isBlocked": false,
              "iBlockedThem": false,
              "theyBlockedMe": false
            }
          }
        ],
        "secondaryUsers": [
          {
            "userId": "entra-uuid-team-1",
            "email": "team@mycompany.com",
            "firstName": "Charlie",
            "lastName": "Brown",
            "designation": "Manager",
            "userType": "Secondary",
            "profileImageUrl": null,
            "userLogoUrl": null,
            "blockStatus": {
              "isBlocked": false,
              "iBlockedThem": false,
              "theyBlockedMe": false
            }
          }
        ],
        "memberBlockStatus": {
          "isBlocked": false,
          "blockedBy": null,
          "blockedAt": null
        }
      },
      "connectedAt": null,
      "status": null,
      "isInternalTeam": true  // Internal team members (same organization)
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Notes**:
- Blocked members **WILL appear** in the list with their block status
- Removed connections **WILL NOT appear** (hard deleted from database)
- `isInternalTeam: true` means same organization (for internal chat)
- `connectionId: null` for internal team members

---

### 1.2 Send Connection Request

**Endpoint**: `POST /connections/request`

**Payload**:
```typescript
{
  recipientId: string;  // Member ID (e.g., "MEMBER-060")
  note?: string;        // Optional message
}
```

**Example Request**:
```json
{
  "recipientId": "MEMBER-060",
  "note": "Would love to connect and discuss partnership opportunities"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Connection request sent successfully",
  "data": {
    "_id": "6965de480df16a5864de9226",
    "requesterId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "status": "pending",
    "note": "Would love to connect and discuss partnership opportunities",
    "createdAt": "2026-01-21T10:00:00.000Z",
    "updatedAt": "2026-01-21T10:00:00.000Z"
  }
}
```

---

### 1.3 Accept Connection Request

**Endpoint**: `PUT /connections/:id/accept`

**Example Request**:
```bash
PUT /wfzo/api/v1/connections/6965de480df16a5864de9226/accept
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Connection accepted successfully",
  "data": {
    "_id": "6965de480df16a5864de9226",
    "requesterId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "status": "accepted",
    "acceptedAt": "2026-01-21T10:05:00.000Z",
    "createdAt": "2026-01-21T10:00:00.000Z",
    "updatedAt": "2026-01-21T10:05:00.000Z"
  }
}
```

---

### 1.4 Reject Connection Request

**Endpoint**: `PUT /connections/:id/reject`

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Connection rejected successfully",
  "data": {
    "_id": "6965de480df16a5864de9226",
    "requesterId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "status": "rejected",
    "rejectedAt": "2026-01-21T10:06:00.000Z"
  }
}
```

---

### 1.5 Remove Connection (Hard Delete)

**Endpoint**: `DELETE /connections/:id`

**Description**: Permanently removes connection. All team members from both organizations are automatically disconnected.

**Example Request**:
```bash
DELETE /wfzo/api/v1/connections/6965de480df16a5864de9226
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Connection permanently removed. All team members have been automatically disconnected. No messaging allowed between any users from both organizations."
}
```

**Effect**:
- Connection permanently deleted from database
- All users from both members can no longer message each other
- Member and all team members will NOT appear in GET /connections anymore
- Messages between the two members are preserved but inaccessible

---

## 2. Member-Level Blocking (Organization-Wide)

### 2.1 Block Member (Organization-Wide)

**Endpoint**: `POST /connections/:id/block-member`

**Description**: When Member A blocks Member B, ALL users from both organizations are blocked from communicating.

**Payload**:
```typescript
{
  blockedMemberId: string;  // Member ID to block (e.g., "MEMBER-060")
}
```

**Example Request**:
```json
POST /wfzo/api/v1/connections/6965de480df16a5864de9226/block-member
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockedMemberId": "MEMBER-060"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Member blocked successfully. All users from both organizations are now blocked from communicating.",
  "data": {
    "connectionId": "6965de480df16a5864de9226",
    "blockedBy": "MEMBER-001",
    "memberBlockedAt": "2026-01-21T11:00:00.000Z",
    "blockEntriesCount": 8  // Number of individual block entries created (users × users × 2 directions)
  }
}
```

**Behavior**:
- **Blocker Side (Member A & ALL team members)**:
  - ❌ Cannot send messages to Member B or any team member of B
  - Attempts to send will fail or be blocked
  
- **Blocked Side (Member B & ALL team members)**:
  - ✅ CAN send messages
  - ❌ Messages will NOT be delivered to Member A or any team member of A
  - ✅ Messages stored only for sender (silent block)
  - Blocked party is unaware they are blocked

**Frontend UI Recommendations**:
- Show block icon/badge on member card
- Disable message input for users from Member A when viewing Member B
- Show "This member has blocked you" message (if applicable)
- Display member-level block status in connection details

---

### 2.2 Unblock Member (Organization-Wide)

**Endpoint**: `POST /connections/:id/unblock-member`

**Description**: Removes ALL member-level blocks between the two organizations. User-level blocks (if any) remain intact.

**Payload**:
```typescript
{
  unblockedMemberId: string;  // Member ID to unblock
}
```

**Example Request**:
```json
POST /wfzo/api/v1/connections/6965de480df16a5864de9226/unblock-member
Authorization: Bearer <token>

{
  "unblockedMemberId": "MEMBER-060"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Member unblocked successfully. All block restrictions have been removed for both organizations.",
  "data": {
    "connectionId": "6965de480df16a5864de9226",
    "remainingBlocksCount": 0  // Only user-level blocks would remain (if any)
  }
}
```

**Important Note**:
- Messages sent during the blocked period are **NEVER** delivered retroactively
- Only new messages after unblock will be delivered normally

---

## 3. User-Level Blocking (Individual)

### 3.1 Block User

**Endpoint**: `POST /chat/block-user`

**Description**: Block a specific user only (not entire organization).

**Payload**:
```typescript
{
  blockedUserId: string;      // User ID to block
  blockedMemberId: string;    // Member ID of the blocked user
}
```

**Example Request**:
```json
POST /wfzo/api/v1/chat/block-user
Authorization: Bearer <token>

{
  "blockedUserId": "entra-uuid-secondary-1",
  "blockedMemberId": "MEMBER-060"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

**Behavior**:
- Only blocks communication between the two specific users
- Other team members from both organizations can still communicate
- Silent block: Blocked user can send but messages won't be delivered

---

### 3.2 Unblock User

**Endpoint**: `POST /chat/unblock-user`

**Payload**:
```typescript
{
  blockedUserId: string;  // User ID to unblock
}
```

**Example Request**:
```json
POST /wfzo/api/v1/chat/unblock-user
Authorization: Bearer <token>

{
  "blockedUserId": "entra-uuid-secondary-1"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

### 3.3 Get Blocked Users List

**Endpoint**: `GET /chat/blocked-users`

**Example Request**:
```bash
GET /wfzo/api/v1/chat/blocked-users
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "userId": "entra-uuid-secondary-1",
      "email": "staff@techcorp.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "memberId": "MEMBER-060",
      "companyName": "TechCorp Solutions",
      "blockedAt": "2026-01-20T15:30:00.000Z",
      "blockType": "user-to-user"
    },
    {
      "userId": "entra-uuid-primary-2",
      "email": "owner@anothercompany.com",
      "firstName": "Mike",
      "lastName": "Wilson",
      "memberId": "MEMBER-045",
      "companyName": "Another Company",
      "blockedAt": "2026-01-18T09:00:00.000Z",
      "blockType": "member-to-member"  // Part of organization-wide block
    }
  ]
}
```

---

## 4. Chat/Messaging

### 4.1 Send Message

**Endpoint**: `POST /chat/send`

**Payload**:
```typescript
{
  recipientId: string;        // Member ID of recipient
  recipientUserId?: string;   // User ID (for user-to-user chat, optional for member chat)
  content: string;            // Message content
  type?: string;              // "text" | "image" | "video" | "audio" | "document"
  fileUrl?: string;           // URL of uploaded file (required if type !== "text")
  fileName?: string;          // File name (required for files)
  fileSize?: number;          // File size in bytes
  mimeType?: string;          // MIME type (required for files)
}
```

**Example Request (Text Message)**:
```json
POST /wfzo/api/v1/chat/send
Authorization: Bearer <token>

{
  "recipientId": "MEMBER-060",
  "recipientUserId": "entra-uuid-primary-1",
  "content": "Hello! How are you?",
  "type": "text"
}
```

**Example Request (File Message)**:
```json
{
  "recipientId": "MEMBER-060",
  "recipientUserId": "entra-uuid-primary-1",
  "content": "Please review this document",
  "type": "document",
  "fileUrl": "https://storage.azure.com/files/document-123.pdf",
  "fileName": "proposal.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "message-id-123",
    "senderId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "senderUserId": "entra-uuid-me",
    "recipientUserId": "entra-uuid-primary-1",
    "content": "Hello! How are you?",
    "type": "text",
    "isRead": false,
    "isBlockedMessage": false,
    "createdAt": "2026-01-21T12:00:00.000Z",
    "updatedAt": "2026-01-21T12:00:00.000Z"
  }
}
```

**Error Response - Connection Removed** (403 Forbidden):
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You must be connected with this member to send messages",
  "error": "Forbidden"
}
```

**Error Response - Blocked (Blocker trying to send)** (403 Forbidden):
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Cannot send message. User is blocked.",
  "error": "Forbidden"
}
```

**Silent Block Response (Blocked user sending)**:
```json
{
  "success": true,
  "data": {
    "_id": "message-id-124",
    "senderId": "MEMBER-060",
    "recipientId": "MEMBER-001",
    "senderUserId": "entra-uuid-blocked",
    "recipientUserId": "entra-uuid-blocker",
    "content": "Can we talk?",
    "type": "text",
    "isRead": false,
    "isBlockedMessage": true,     // Message marked as blocked
    "blockedAt": "2026-01-21T12:05:00.000Z",
    "createdAt": "2026-01-21T12:05:00.000Z"
  }
}
```
**Note**: Message appears sent to the blocked user but is NOT delivered to recipient.

---

### 4.2 Get Messages (Conversation)

**Endpoint**: `GET /chat/messages`

**Query Parameters**:
```typescript
{
  recipientId: string;        // Member ID
  recipientUserId?: string;   // User ID (for user chat, optional for member chat)
  page?: string;              // Default: "1"
  pageSize?: string;          // Default: "50"
}
```

**Example Request**:
```bash
GET /wfzo/api/v1/chat/messages?recipientId=MEMBER-060&recipientUserId=entra-uuid-primary-1&page=1&pageSize=50
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "message-id-123",
        "senderId": "MEMBER-001",
        "recipientId": "MEMBER-060",
        "senderUserId": "entra-uuid-me",
        "recipientUserId": "entra-uuid-primary-1",
        "content": "Hello! How are you?",
        "type": "text",
        "isRead": true,
        "isBlockedMessage": false,
        "createdAt": "2026-01-21T12:00:00.000Z",
        "senderSnapshot": {
          "firstName": "Alice",
          "lastName": "Wilson",
          "email": "me@mycompany.com",
          "profileImageUrl": "https://storage.azure.com/profiles/me.jpg",
          "companyName": "My Company"
        }
      },
      {
        "_id": "message-id-124",
        "senderId": "MEMBER-060",
        "recipientId": "MEMBER-001",
        "senderUserId": "entra-uuid-primary-1",
        "recipientUserId": "entra-uuid-me",
        "content": "I'm good, thanks!",
        "type": "text",
        "isRead": false,
        "isBlockedMessage": false,
        "createdAt": "2026-01-21T12:01:00.000Z",
        "senderSnapshot": {
          "firstName": "John",
          "lastName": "Smith",
          "email": "owner@techcorp.com",
          "profileImageUrl": "https://storage.azure.com/profiles/user-1.jpg",
          "companyName": "TechCorp Solutions"
        }
      }
    ],
    "blockStatus": {
      "isBlocked": false,
      "iBlockedThem": false,
      "theyBlockedMe": false
    },
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 45,
      "hasMore": false
    }
  }
}
```

**Notes**:
- `isBlockedMessage: true` messages are only visible to the sender
- `blockStatus` indicates current blocking state between the two users
- Messages are ordered chronologically (oldest first)

---

### 4.3 Get Conversations List

**Endpoint**: `GET /chat/conversations`

**Query Parameters**:
```typescript
{
  page?: string;      // Default: "1"
  pageSize?: string;  // Default: "20"
}
```

**Example Request**:
```bash
GET /wfzo/api/v1/chat/conversations?page=1&pageSize=20
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "conversationId": "conv-123",
      "otherMember": {
        "memberId": "MEMBER-060",
        "companyName": "TechCorp Solutions",
        "memberLogoUrl": "https://storage.azure.com/logos/member-060.png"
      },
      "otherUser": {
        "userId": "entra-uuid-primary-1",
        "firstName": "John",
        "lastName": "Smith",
        "email": "owner@techcorp.com",
        "profileImageUrl": "https://storage.azure.com/profiles/user-1.jpg",
        "userType": "Primary"
      },
      "lastMessage": {
        "content": "I'm good, thanks!",
        "type": "text",
        "createdAt": "2026-01-21T12:01:00.000Z",
        "isRead": false,
        "senderId": "MEMBER-060"
      },
      "unreadCount": 3,
      "blockStatus": {
        "isBlocked": false,
        "iBlockedThem": false,
        "theyBlockedMe": false
      },
      "isUserChat": true,
      "updatedAt": "2026-01-21T12:01:00.000Z"
    },
    {
      "conversationId": "conv-124",
      "otherMember": {
        "memberId": "MEMBER-045",
        "companyName": "Manufacturing Inc",
        "memberLogoUrl": "https://storage.azure.com/logos/member-045.png"
      },
      "otherUser": null,
      "lastMessage": {
        "content": "Let's schedule a meeting",
        "type": "text",
        "createdAt": "2026-01-20T16:30:00.000Z",
        "isRead": true,
        "senderId": "MEMBER-001"
      },
      "unreadCount": 0,
      "blockStatus": {
        "isBlocked": true,
        "iBlockedThem": true,
        "theyBlockedMe": false
      },
      "isUserChat": false,
      "updatedAt": "2026-01-20T16:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 12,
    "hasMore": false
  }
}
```

---

## 5. Error Responses

### 5.1 Standard Error Format

All errors follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description here",
  "error": "Bad Request"
}
```

### 5.2 Common Error Codes

**400 Bad Request**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot send connection request to yourself",
  "error": "Bad Request"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You must be connected with this member to send messages",
  "error": "Forbidden"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Connection not found",
  "error": "Not Found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 6. Frontend Implementation Guide

### 6.1 Displaying Block Status

**Connection Card**:
```typescript
// TypeScript interface
interface Connection {
  connectionId: string;
  member: {
    memberId: string;
    organisationInfo: {
      companyName: string;
      memberLogoUrl: string;
    };
    primaryUsers: User[];
    secondaryUsers: User[];
    memberBlockStatus: {
      isBlocked: boolean;
      blockedBy: string | null;
      blockedAt: string | null;
    };
  };
  status: string;
}

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  blockStatus: {
    isBlocked: boolean;
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
  };
}

// UI Logic
function renderUserBlockStatus(user: User) {
  if (user.blockStatus.iBlockedThem) {
    return <Badge color="red">Blocked by you</Badge>;
  }
  if (user.blockStatus.theyBlockedMe) {
    return <Badge color="orange">Blocked you</Badge>;
  }
  return null;
}

function renderMemberBlockStatus(member: Member) {
  if (member.memberBlockStatus.isBlocked) {
    return (
      <Alert type="warning">
        This organization has been blocked. 
        All users from both organizations cannot communicate.
      </Alert>
    );
  }
  return null;
}
```

### 6.2 Handling Message Send

```typescript
async function sendMessage(data: SendMessagePayload) {
  try {
    const response = await fetch('/wfzo/api/v1/chat/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.data?.isBlockedMessage) {
      // Message sent but blocked - show warning to user
      showWarning('Message sent but may not be delivered due to blocking.');
    }
    
    return result;
  } catch (error) {
    // Handle error
    if (error.statusCode === 403) {
      showError('Cannot send message. Connection may be removed or you are blocked.');
    }
  }
}
```

### 6.3 Real-time Updates (WebSocket)

When receiving real-time updates, check for:

```typescript
// When connection is removed
socket.on('connection_removed', (data) => {
  // Remove from connections list
  removeConnectionFromList(data.connectionId);
  
  // Close any open chat windows with users from that member
  closeChatsWithMember(data.memberId);
  
  // Show notification
  showNotification('Connection with ' + data.companyName + ' has been removed');
});

// When member is blocked
socket.on('member_blocked', (data) => {
  // Update connection status
  updateConnectionBlockStatus(data.connectionId, {
    isBlocked: true,
    blockedBy: data.blockedBy,
    blockedAt: data.blockedAt
  });
  
  // Disable message input for all users from that member
  disableMessagingWithMember(data.memberId);
});

// When user is blocked
socket.on('user_blocked', (data) => {
  // Update specific user's block status
  updateUserBlockStatus(data.userId, {
    isBlocked: true,
    iBlockedThem: true,
    theyBlockedMe: false
  });
  
  // Disable message input for that specific user
  disableMessagingWithUser(data.userId);
});
```

---

## 7. Summary Table

### Connection Management

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/connections` | GET | Get connections with block status | ✅ |
| `/connections/request` | POST | Send connection request | ✅ |
| `/connections/:id/accept` | PUT | Accept connection | ✅ |
| `/connections/:id/reject` | PUT | Reject connection | ✅ |
| `/connections/:id` | DELETE | Remove connection (hard delete) | ✅ |

### Member-Level Blocking

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/connections/:id/block-member` | POST | Block entire organization | ✅ |
| `/connections/:id/unblock-member` | POST | Unblock entire organization | ✅ |

### User-Level Blocking

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/chat/block-user` | POST | Block specific user | ✅ |
| `/chat/unblock-user` | POST | Unblock specific user | ✅ |
| `/chat/blocked-users` | GET | Get list of blocked users | ✅ |

### Chat/Messaging

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/chat/send` | POST | Send message | ✅ |
| `/chat/messages` | GET | Get conversation messages | ✅ |
| `/chat/conversations` | GET | Get all conversations | ✅ |

---

## 8. Testing Credentials

Use Postman or similar tool with these headers:

```
Authorization: Bearer <your_entra_id_token>
Content-Type: application/json
```

**Base URL**: `https://your-api-domain.com/wfzo/api/v1`

---

## End of API Reference

For detailed implementation logic and testing scenarios, refer to:
- `MEMBER_BLOCKING_IMPLEMENTATION.md` - Implementation details
- `TESTING_GUIDE_BLOCKING.md` - Step-by-step testing guide
