# API Calls for Secondary User Chat - Complete Guide

## Scenario: Anna (Secondary) wants to chat with Mike (Secondary)

### Prerequisites
- Anna is logged in → Has JWT token
- Anna and Mike are under members that are connected

---

## 1️⃣ Get Connections (Find Available Users to Chat With)

### API Call
```http
GET /wfzo/api/v1/connections
Authorization: Bearer <Anna's_JWT_Token>
```

### Request Details
```typescript
// Headers
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}

// No query parameters needed for basic list
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "connectionId": "6965de480df16a5864de9225",
      "member": {
        "memberId": "MEMBER-002",
        "organisationInfo": {
          "companyName": "Tech Corp",
          "memberLogoUrl": "https://storage.example.com/logos/techcorp.png",
          "industries": ["technology"]
        },
        "primaryUsers": [
          {
            "userId": "bob-uuid-123",
            "email": "bob@techcorp.com",
            "firstName": "Bob",
            "lastName": "Johnson",
            "designation": "CEO",
            "userType": "Primary",
            "memberLogoUrl": "https://storage.example.com/logos/techcorp.png"
          }
        ],
        "secondaryUsers": [
          {
            "userId": "mike-uuid-456",     // ← SAVE THIS for chat
            "email": "mike@techcorp.com",
            "firstName": "Mike",
            "lastName": "Chen",
            "designation": "Engineer",
            "userType": "Secondary",
            "userLogoUrl": "https://storage.example.com/users/mike.jpg"
          },
          {
            "userId": "sarah-uuid-789",
            "email": "sarah@techcorp.com",
            "firstName": "Sarah",
            "lastName": "Lee",
            "designation": "Manager",
            "userType": "Secondary",
            "userLogoUrl": "https://storage.example.com/users/sarah.jpg"
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
    "total": 1,
    "totalPages": 1
  }
}
```

### Frontend Code
```typescript
// Fetch connections
const response = await fetch('/wfzo/api/v1/connections', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const { data: connections } = await response.json();

// Extract users for chat
connections.forEach(conn => {
  // Show secondary users as chat options
  conn.member.secondaryUsers.forEach(user => {
    console.log(`Can chat with: ${user.firstName} ${user.lastName}`);
    console.log(`User ID: ${user.userId}`);        // Save this!
    console.log(`Member ID: ${conn.member.memberId}`); // Save this!
  });
});
```

---

## 2️⃣ Send Message to Secondary User (Mike)

### API Call
```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer <Anna's_JWT_Token>
Content-Type: application/json
```

### Request Payload
```json
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "mike-uuid-456",
  "content": "Hi Mike! Can you help me with the project?"
}
```

### Complete Request
```typescript
const messageData = {
  recipientId: "MEMBER-002",           // From connections response
  recipientUserId: "mike-uuid-456",    // From secondaryUsers array
  content: "Hi Mike! Can you help me with the project?"
};

const response = await fetch('/wfzo/api/v1/chat/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(messageData)
});

const result = await response.json();
```

### Response
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "senderId": "MEMBER-001",
    "senderUserId": "anna-uuid-789",
    "recipientId": "MEMBER-002",
    "recipientUserId": "mike-uuid-456",
    "content": "Hi Mike! Can you help me with the project?",
    "type": "text",
    "isRead": false,
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 3️⃣ Get Conversations List

### API Call
```http
GET /wfzo/api/v1/chat/conversations
Authorization: Bearer <Anna's_JWT_Token>
```

### Request Details
```typescript
// Optional query parameters
const params = new URLSearchParams({
  page: '1',
  pageSize: '20'
});

const response = await fetch(`/wfzo/api/v1/chat/conversations?${params}`, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "chatType": "user",                    // ← User Chat (not Member Chat)
      "member": {
        "memberId": "MEMBER-002",
        "companyName": "Tech Corp",
        "memberLogoUrl": "https://...",
        "address": {
          "city": "San Francisco",
          "state": "CA",
          "country": "USA"
        }
      },
      "user": {                              // ← User details present
        "userId": "mike-uuid-456",
        "firstName": "Mike",
        "lastName": "Chen",
        "email": "mike@techcorp.com",
        "userType": "Secondary",
        "profileImageUrl": "https://storage.example.com/users/mike.jpg"
      },
      "lastMessage": {
        "content": "Hi Mike! Can you help me with the project?",
        "createdAt": "2026-01-14T10:30:00.000Z",
        "type": "text",
        "senderId": "MEMBER-001",
        "senderUserId": "anna-uuid-789"
      },
      "unreadCount": 0
    },
    {
      "chatType": "user",
      "member": {
        "memberId": "MEMBER-002",
        "companyName": "Tech Corp"
      },
      "user": {
        "userId": "sarah-uuid-789",
        "firstName": "Sarah",
        "lastName": "Lee",
        "userType": "Secondary"
      },
      "lastMessage": {
        "content": "Thanks!",
        "createdAt": "2026-01-14T09:15:00.000Z"
      },
      "unreadCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 4️⃣ Get Messages with Mike

### API Call
```http
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002&otherUserId=mike-uuid-456
Authorization: Bearer <Anna's_JWT_Token>
```

### Request Details
```typescript
const params = new URLSearchParams({
  otherMemberId: 'MEMBER-002',           // Mike's member
  otherUserId: 'mike-uuid-456',          // Mike's user ID - REQUIRED for User Chat
  page: '1',
  pageSize: '50'
});

const response = await fetch(`/wfzo/api/v1/chat/messages?${params}`, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "senderId": "MEMBER-001",
      "senderUserId": "anna-uuid-789",
      "recipientId": "MEMBER-002",
      "recipientUserId": "mike-uuid-456",
      "content": "Hi Mike! Can you help me with the project?",
      "type": "text",
      "isRead": true,
      "createdAt": "2026-01-14T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "senderId": "MEMBER-002",
      "senderUserId": "mike-uuid-456",
      "recipientId": "MEMBER-001",
      "recipientUserId": "anna-uuid-789",
      "content": "Sure Anna! What do you need?",
      "type": "text",
      "isRead": false,
      "createdAt": "2026-01-14T10:32:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 5️⃣ Mark Messages as Read

### API Call
```http
PUT /wfzo/api/v1/chat/mark-read
Authorization: Bearer <Anna's_JWT_Token>
Content-Type: application/json
```

### Request Payload
```json
{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "mike-uuid-456"
}
```

### Complete Request
```typescript
const markReadData = {
  otherMemberId: "MEMBER-002",
  otherUserId: "mike-uuid-456"    // REQUIRED for User Chat
};

const response = await fetch('/wfzo/api/v1/chat/mark-read', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(markReadData)
});

const result = await response.json();
```

### Response
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "modifiedCount": 1
  }
}
```

---

## Complete Frontend Flow Example

### React/TypeScript Example

```typescript
import { useState, useEffect } from 'react';

interface SecondaryUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  designation: string;
  userType: string;
  userLogoUrl?: string;
}

interface Connection {
  member: {
    memberId: string;
    organisationInfo: {
      companyName: string;
    };
    secondaryUsers: SecondaryUser[];
  };
}

// Step 1: Load connections and users
async function loadConnections(jwtToken: string): Promise<Connection[]> {
  const response = await fetch('/wfzo/api/v1/connections', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const { data } = await response.json();
  return data;
}

// Step 2: Send message to secondary user
async function sendMessageToUser(
  jwtToken: string,
  recipientMemberId: string,
  recipientUserId: string,
  message: string
) {
  const response = await fetch('/wfzo/api/v1/chat/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipientId: recipientMemberId,
      recipientUserId: recipientUserId,    // ← CRITICAL for User Chat
      content: message
    })
  });
  
  return response.json();
}

// Step 3: Get conversation messages
async function getMessagesWithUser(
  jwtToken: string,
  otherMemberId: string,
  otherUserId: string
) {
  const params = new URLSearchParams({
    otherMemberId: otherMemberId,
    otherUserId: otherUserId,              // ← CRITICAL for User Chat
    page: '1',
    pageSize: '50'
  });
  
  const response = await fetch(`/wfzo/api/v1/chat/messages?${params}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const { data } = await response.json();
  return data;
}

// Usage Example
function ChatComponent() {
  const jwtToken = "your-jwt-token";
  
  useEffect(() => {
    // Load connections
    loadConnections(jwtToken).then(connections => {
      // Find Mike in secondary users
      const techCorp = connections.find(
        c => c.member.memberId === "MEMBER-002"
      );
      
      if (techCorp) {
        const mike = techCorp.member.secondaryUsers.find(
          u => u.userId === "mike-uuid-456"
        );
        
        if (mike) {
          // Send message to Mike
          sendMessageToUser(
            jwtToken,
            "MEMBER-002",
            "mike-uuid-456",
            "Hi Mike!"
          );
          
          // Get conversation history
          getMessagesWithUser(
            jwtToken,
            "MEMBER-002",
            "mike-uuid-456"
          ).then(messages => {
            console.log("Chat history:", messages);
          });
        }
      }
    });
  }, []);
  
  return <div>Chat UI...</div>;
}
```

---

## Quick Reference Table

| Action | Endpoint | Method | Required Fields |
|--------|----------|--------|----------------|
| **Get Users** | `/connections` | GET | None |
| **Send Message** | `/chat/send` | POST | `recipientId`, `recipientUserId`, `content` |
| **Get Conversations** | `/chat/conversations` | GET | None (auto-filtered) |
| **Get Messages** | `/chat/messages` | GET | `otherMemberId`, `otherUserId` |
| **Mark Read** | `/chat/mark-read` | PUT | `otherMemberId`, `otherUserId` |

---

## Key Points

✅ **Always include `recipientUserId`** when sending to Secondary users
✅ **Always include `otherUserId`** when fetching User Chat messages
✅ **Get userIds from `/connections`** API response
✅ **Use `secondaryUsers` array** for Secondary user chat options
✅ **JWT token required** in all requests (Authorization header)

## Common Mistakes

❌ **DON'T:** Forget `recipientUserId` → Will go to Member Chat instead
❌ **DON'T:** Forget `otherUserId` in GET messages → Will return wrong chat
❌ **DON'T:** Hardcode user IDs → Get them from `/connections` API

✅ **DO:** Store memberId and userId from connections response
✅ **DO:** Include both IDs in all User Chat operations
✅ **DO:** Check `chatType` field in conversations response
