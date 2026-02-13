# API Examples - Quick Reference

## Authentication
All requests require Bearer token:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 1. Get Connections (with Block Status)

### Request
```http
GET /wfzo/api/v1/connections?page=1&pageSize=10
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "connectionId": "679abc123def456789",
      "member": {
        "memberId": "MEMBER-060",
        "organisationInfo": {
          "companyName": "TechCorp Solutions",
          "memberLogoUrl": "https://storage.azure.com/logos/member-060.png",
          "industries": ["technology", "software"]
        },
        "primaryUsers": [
          {
            "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "email": "owner@techcorp.com",
            "firstName": "John",
            "lastName": "Smith",
            "designation": "CEO",
            "userType": "Primary",
            "profileImageUrl": "https://storage.azure.com/profiles/john.jpg",
            "blockStatus": {
              "isBlocked": false,
              "iBlockedThem": false,
              "theyBlockedMe": false
            }
          }
        ],
        "secondaryUsers": [
          {
            "userId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            "email": "staff@techcorp.com",
            "firstName": "Jane",
            "lastName": "Doe",
            "designation": "Marketing Manager",
            "userType": "Secondary",
            "profileImageUrl": "https://storage.azure.com/profiles/jane.jpg",
            "blockStatus": {
              "isBlocked": true,
              "iBlockedThem": true,
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
      "connectedAt": "2026-01-15T10:30:00.000Z",
      "status": "accepted",
      "isInternalTeam": false
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

---

## 2. Block Member (Organization-Wide)

### Request
```http
POST /wfzo/api/v1/connections/679abc123def456789/block-member
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "blockedMemberId": "MEMBER-060"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Member blocked successfully. All users from both organizations are now blocked from communicating.",
  "data": {
    "connectionId": "679abc123def456789",
    "blockedBy": "MEMBER-001",
    "memberBlockedAt": "2026-01-22T14:30:00.000Z",
    "blockEntriesCount": 8
  }
}
```

### What Happens:
- ✅ All users from MEMBER-001 blocked from ALL users from MEMBER-060
- ❌ Users from MEMBER-001 **cannot send** messages to MEMBER-060 users
- ✅ Users from MEMBER-060 **can send** but messages **not delivered** (silent block)
- 📊 8 block entries = 2 users × 2 users × 2 directions

---

## 3. Unblock Member (Organization-Wide)

### Request
```http
POST /wfzo/api/v1/connections/679abc123def456789/unblock-member
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "unblockedMemberId": "MEMBER-060"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Member unblocked successfully. All block restrictions have been removed for both organizations.",
  "data": {
    "connectionId": "679abc123def456789",
    "remainingBlocksCount": 0
  }
}
```

### What Happens:
- ✅ All member-level blocks removed
- ✅ Communication restored between organizations
- ⚠️ User-level blocks (if any) remain intact
- ❌ Messages sent during block period are **NOT** delivered retroactively

---

## 4. Block User (Individual)

### Request
```http
POST /wfzo/api/v1/chat/block-user
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "blockedUserId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "blockedMemberId": "MEMBER-060"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

### What Happens:
- ✅ Only blocks this specific user-to-user communication
- ✅ Other users from both organizations can still communicate
- ❌ You **cannot send** to this user
- ✅ They **can send** but messages **not delivered** to you

---

## 5. Unblock User

### Request
```http
POST /wfzo/api/v1/chat/unblock-user
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "blockedUserId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

## 6. Get Blocked Users List

### Request
```http
GET /wfzo/api/v1/chat/blocked-users
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "email": "staff@techcorp.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "memberId": "MEMBER-060",
      "companyName": "TechCorp Solutions",
      "blockedAt": "2026-01-20T15:30:00.000Z",
      "blockType": "user-to-user"
    },
    {
      "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "email": "owner@anotherco.com",
      "firstName": "Mike",
      "lastName": "Wilson",
      "memberId": "MEMBER-045",
      "companyName": "Another Company",
      "blockedAt": "2026-01-18T09:00:00.000Z",
      "blockType": "member-to-member"
    }
  ]
}
```

---

## 7. Remove Connection (Hard Delete)

### Request
```http
DELETE /wfzo/api/v1/connections/679abc123def456789
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Connection permanently removed. All team members have been automatically disconnected. No messaging allowed between any users from both organizations."
}
```

### What Happens:
- 🗑️ Connection **permanently deleted** from database
- ❌ Member and all team members **no longer appear** in GET /connections
- ❌ All users from both organizations **cannot message** each other
- ⚠️ Attempting to send message will return **403 Forbidden**

---

## 8. Send Message (Text)

### Request
```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "recipientId": "MEMBER-060",
  "recipientUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "content": "Hello! How are you today?",
  "type": "text"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "679message123abc456",
    "senderId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "senderUserId": "d4e5f6a7-b8c9-0123-defg-234567890123",
    "recipientUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "content": "Hello! How are you today?",
    "type": "text",
    "isRead": false,
    "isBlockedMessage": false,
    "createdAt": "2026-01-22T15:00:00.000Z",
    "updatedAt": "2026-01-22T15:00:00.000Z"
  }
}
```

---

## 9. Send Message (File/Document)

### Request
```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "recipientId": "MEMBER-060",
  "recipientUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "content": "Please review this proposal",
  "type": "document",
  "fileUrl": "https://storage.azure.com/files/proposal-2026.pdf",
  "fileName": "proposal-2026.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "679message456def789",
    "senderId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "senderUserId": "d4e5f6a7-b8c9-0123-defg-234567890123",
    "recipientUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "content": "Please review this proposal",
    "type": "document",
    "fileUrl": "https://storage.azure.com/files/proposal-2026.pdf",
    "fileName": "proposal-2026.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "isRead": false,
    "isBlockedMessage": false,
    "createdAt": "2026-01-22T15:05:00.000Z"
  }
}
```

---

## 10. Send Message (Blocked User - Silent Block)

### Request
```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer <token-from-blocked-user>
Content-Type: application/json
```

### Payload
```json
{
  "recipientId": "MEMBER-001",
  "recipientUserId": "d4e5f6a7-b8c9-0123-defg-234567890123",
  "content": "Can we talk?",
  "type": "text"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "679message789ghi012",
    "senderId": "MEMBER-060",
    "recipientId": "MEMBER-001",
    "senderUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "recipientUserId": "d4e5f6a7-b8c9-0123-defg-234567890123",
    "content": "Can we talk?",
    "type": "text",
    "isRead": false,
    "isBlockedMessage": true,
    "blockedAt": "2026-01-22T15:10:00.000Z",
    "createdAt": "2026-01-22T15:10:00.000Z"
  }
}
```

### What Happens:
- ✅ Message appears **sent** to blocked user
- ❌ Message **NOT delivered** to recipient
- 📌 Marked with `isBlockedMessage: true`
- 👁️ Only visible to sender (silent block)

---

## 11. Get Messages (Conversation)

### Request
```http
GET /wfzo/api/v1/chat/messages?recipientId=MEMBER-060&recipientUserId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&page=1&pageSize=50
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "679message123abc456",
        "senderId": "MEMBER-001",
        "recipientId": "MEMBER-060",
        "senderUserId": "d4e5f6a7-b8c9-0123-defg-234567890123",
        "recipientUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "content": "Hello! How are you today?",
        "type": "text",
        "isRead": true,
        "isBlockedMessage": false,
        "createdAt": "2026-01-22T15:00:00.000Z",
        "senderSnapshot": {
          "firstName": "Alice",
          "lastName": "Wilson",
          "email": "me@mycompany.com",
          "profileImageUrl": "https://storage.azure.com/profiles/alice.jpg",
          "companyName": "My Company"
        }
      },
      {
        "_id": "679message456def789",
        "senderId": "MEMBER-060",
        "recipientId": "MEMBER-001",
        "senderUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "recipientUserId": "d4e5f6a7-b8c9-0123-defg-234567890123",
        "content": "I'm doing well, thanks!",
        "type": "text",
        "isRead": false,
        "isBlockedMessage": false,
        "createdAt": "2026-01-22T15:01:00.000Z",
        "senderSnapshot": {
          "firstName": "John",
          "lastName": "Smith",
          "email": "owner@techcorp.com",
          "profileImageUrl": "https://storage.azure.com/profiles/john.jpg",
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

---

## 12. Get Conversations List

### Request
```http
GET /wfzo/api/v1/chat/conversations?page=1&pageSize=20
Authorization: Bearer <token>
```

### Response (200 OK)
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
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "firstName": "John",
        "lastName": "Smith",
        "email": "owner@techcorp.com",
        "profileImageUrl": "https://storage.azure.com/profiles/john.jpg",
        "userType": "Primary"
      },
      "lastMessage": {
        "content": "I'm doing well, thanks!",
        "type": "text",
        "createdAt": "2026-01-22T15:01:00.000Z",
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
      "updatedAt": "2026-01-22T15:01:00.000Z"
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

## 13. Send Connection Request

### Request
```http
POST /wfzo/api/v1/connections/request
Authorization: Bearer <token>
Content-Type: application/json
```

### Payload
```json
{
  "recipientId": "MEMBER-060",
  "note": "Would love to connect and discuss partnership opportunities"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Connection request sent successfully",
  "data": {
    "_id": "679conn123abc456",
    "requesterId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "status": "pending",
    "note": "Would love to connect and discuss partnership opportunities",
    "createdAt": "2026-01-22T16:00:00.000Z",
    "updatedAt": "2026-01-22T16:00:00.000Z"
  }
}
```

---

## 14. Accept Connection Request

### Request
```http
PUT /wfzo/api/v1/connections/679conn123abc456/accept
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Connection accepted successfully",
  "data": {
    "_id": "679conn123abc456",
    "requesterId": "MEMBER-001",
    "recipientId": "MEMBER-060",
    "status": "accepted",
    "acceptedAt": "2026-01-22T16:05:00.000Z",
    "createdAt": "2026-01-22T16:00:00.000Z",
    "updatedAt": "2026-01-22T16:05:00.000Z"
  }
}
```

---

## Error Examples

### 400 Bad Request (Invalid Payload)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot send connection request to yourself",
  "error": "Bad Request"
}
```

### 401 Unauthorized (Missing/Invalid Token)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden (Connection Removed/Blocked)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You must be connected with this member to send messages",
  "error": "Forbidden"
}
```

### 404 Not Found (Connection/User Not Found)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Connection not found",
  "error": "Not Found"
}
```

---

## Quick Testing with cURL

### Block Member
```bash
curl -X POST https://your-api.com/wfzo/api/v1/connections/679abc123def456789/block-member \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedMemberId": "MEMBER-060"}'
```

### Send Message
```bash
curl -X POST https://your-api.com/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "MEMBER-060",
    "recipientUserId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "content": "Hello!",
    "type": "text"
  }'
```

### Remove Connection
```bash
curl -X DELETE https://your-api.com/wfzo/api/v1/connections/679abc123def456789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Points to Remember

### Block Behavior
- **Member-Level Block**: Organization-wide, affects ALL users
- **User-Level Block**: Only affects specific user pair
- **Silent Block**: Blocked user can send but messages not delivered
- **Blocker**: Cannot send messages
- **Blocked**: Can send, messages marked `isBlockedMessage: true`

### Connection States
- **PENDING**: Awaiting acceptance
- **ACCEPTED**: Active connection
- **REJECTED**: Request declined
- **BLOCKED**: Blocked at connection level (old behavior)
- **REMOVED**: Permanently deleted (no longer exists in DB)

### Message Types
- `text` - Plain text message
- `image` - Image file
- `video` - Video file
- `audio` - Audio file
- `document` - Document/PDF

### Block Status Fields
- `isBlocked`: TRUE if any block exists (user OR member level)
- `iBlockedThem`: TRUE if current user blocked the other user
- `theyBlockedMe`: TRUE if other user blocked current user

---

For complete API documentation, see: **FRONTEND_API_REFERENCE.md**
