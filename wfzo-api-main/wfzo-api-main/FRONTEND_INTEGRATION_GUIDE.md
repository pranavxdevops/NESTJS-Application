# Frontend Integration Guide - Chat & Connections API Updates

## 🎯 Overview

This document outlines the **new chat capabilities** added to the existing chat system. All changes are **backward compatible** - existing UI flows will continue to work without modifications.

## ⚠️ Important Notes

1. ✅ **All existing member-to-member chat works unchanged**
2. ✅ **No breaking changes to existing API responses**
3. ✅ **New fields are additive only**
4. ✅ **Existing UI will continue to function**

---

## 📋 What's New

### New Capabilities
1. **User-to-User Chat** - Chat with specific users (Primary or Secondary) at connected organizations
2. **Internal Team Chat** - Chat with users within your own organization
3. **User Discovery** - Get list of all users (Primary + Secondary) at connected organizations
4. **Enhanced Conversations** - See which conversations are organization-level vs user-level

---

## 🔌 API Changes

### 1. Get Connections (Enhanced)

**Endpoint:** `GET /wfzo/api/v1/connections`

#### What Changed
- **BEFORE:** Only returned connected member organizations
- **AFTER:** Now includes `primaryUsers[]` and `secondaryUsers[]` arrays + internal team members

#### Request (Unchanged)
```http
GET /wfzo/api/v1/connections
Authorization: Bearer {token}
```

#### Response (Enhanced)

<details>
<summary><b>OLD Response Structure (Still Works)</b></summary>

```json
{
  "success": true,
  "data": [
    {
      "connectionId": "abc123",
      "member": {
        "memberId": "MEMBER-060",
        "organisationInfo": {
          "companyName": "ABC Corp",
          "memberLogoUrl": "https://...",
          "industries": ["Technology"]
        }
      },
      "connectedAt": "2026-01-10T10:00:00Z",
      "status": "accepted"
    }
  ]
}
```
</details>

<details>
<summary><b>NEW Response Structure (Enhanced with Internal Team)</b></summary>

```json
{
  "success": true,
  "data": [
    {
      "connectionId": null,  // ← NULL for internal team
      "member": {
        "memberId": "MEMBER-005",  // ← SAME as your memberId (internal team)
        "organisationInfo": {
          "companyName": "Your Company",
          "memberLogoUrl": "https://...",
          "industries": ["Technology"]
        },
        "primaryUsers": [  // ← Your company's primary users (excluding you)
          {
            "userId": "entra-uuid-1",
            "email": "ceo@yourcompany.com",
            "firstName": "John",
            "lastName": "Doe",
            "designation": "CEO",
            "userType": "Primary",
            "profileImageUrl": "https://...",
            "memberLogoUrl": "https://..."
          }
        ],
        "secondaryUsers": [  // ← Your company's secondary users (excluding you)
          {
            "userId": "entra-uuid-2",
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
      "connectedAt": null,  // ← NULL for internal team
      "status": "internal",  // ← "internal" status
      "isInternalTeam": true  // ← NEW: Flag to identify internal team
    },
    {
      "connectionId": "abc123",  // ← Has ID for external connections
      "member": {
        "memberId": "MEMBER-060",  // ← DIFFERENT from your memberId (external)
        "organisationInfo": {
          "companyName": "ABC Corp",
          "memberLogoUrl": "https://...",
          "industries": ["Technology"]
        },
        "primaryUsers": [  // ← Connected company's users
          {
            "userId": "entra-uuid-3",
            "email": "owner@abccorp.com",
            "firstName": "Bob",
            "lastName": "Wilson",
            "designation": "CEO",
            "userType": "Primary",
            "profileImageUrl": "https://...",
            "memberLogoUrl": "https://..."
          }
        ],
        "secondaryUsers": [
          {
            "userId": "entra-uuid-4",
            "email": "staff@abccorp.com",
            "firstName": "Alice",
            "lastName": "Brown",
            "designation": "Engineer",
            "userType": "Secondary",
            "profileImageUrl": "https://...",
            "userLogoUrl": "https://..."
          }
        ]
      },
      "connectedAt": "2026-01-10T10:00:00Z",  // ← Has connection date
      "status": "accepted",  // ← "accepted" status
      "isInternalTeam": false  // ← NEW: External connection
    }
  ]
}
```
</details>

#### Frontend Changes (Recommended)

**Identify Connection Type:**
```typescript
// BEFORE: Only external connections
connections.forEach(conn => {
  displayConnection(conn.member.organisationInfo.companyName);
});

// AFTER: Distinguish internal team from external connections
connections.forEach(conn => {
  // NEW: Check if internal team
  if (conn.isInternalTeam || conn.member.memberId === myMemberId) {
    displayInternalTeam(conn);  // "Your Team" section
  } else {
    displayExternalConnection(conn);  // "Connections" section
  }
  
  // Show users for both types
  conn.member.primaryUsers?.forEach(user => {
    displayUser(user.firstName, user.lastName, 'Primary');
  });
  
  conn.member.secondaryUsers?.forEach(user => {
    displayUser(user.firstName, user.lastName, 'Team Member');
  });
});
```

**Helper Function:**
```typescript
function identifyConnectionType(connection, myMemberId) {
  // Method 1: Use new isInternalTeam flag (recommended)
  if (connection.isInternalTeam) {
    return {
      type: 'internal',
      label: 'Your Team',
      icon: '👥',
      color: 'green'
    };
  }
  
  // Method 2: Check memberId (fallback)
  if (connection.member.memberId === myMemberId) {
    return {
      type: 'internal',
      label: 'Your Team',
      icon: '👥',
      color: 'green'
    };
  }
  
  // External connection
  return {
    type: 'external',
    label: connection.member.organisationInfo.companyName,
    icon: '🏢',
    color: 'blue'
  };
}
```

---

### 2. Send Message (Enhanced)

**Endpoint:** `POST /wfzo/api/v1/chat/send`

#### What Changed
- **BEFORE:** Could only send to member organizations
- **AFTER:** Can optionally send to specific users via `recipientUserId`

#### Request Options

<details>
<summary><b>Option 1: Organization Chat (UNCHANGED)</b></summary>

```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "MEMBER-060",
  "content": "Hello ABC Corp!"
}
```

**Use Case:** Send message to organization level (Primary user only)

</details>

<details>
<summary><b>Option 2: User Chat (NEW)</b></summary>

```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "MEMBER-060",
  "recipientUserId": "entra-uuid-2",  // ← NEW: Specific user
  "content": "Hello Jane!"
}
```

**Use Case:** Send message to specific user at connected organization

</details>

<details>
<summary><b>Option 3: Internal Team Chat (NEW)</b></summary>

```http
POST /wfzo/api/v1/chat/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": "MEMBER-005",  // ← Same as your memberId
  "recipientUserId": "team-member-uuid",  // ← Your team member
  "content": "Hey team!"
}
```

**Use Case:** Chat with your own team members

</details>

#### Response (Unchanged)

```json
{
  "senderId": "MEMBER-005",
  "recipientId": "MEMBER-060",
  "senderUserId": "your-user-id",      // ← NEW (only if user chat)
  "recipientUserId": "entra-uuid-2",   // ← NEW (only if user chat)
  "content": "Hello Jane!",
  "type": "text",
  "isRead": false,
  "createdAt": "2026-01-14T12:00:00Z",
  "_id": "message-id-123"
}
```

#### Frontend Changes (Optional)

```typescript
// BEFORE: Only organization chat
function sendMessage(recipientMemberId, content) {
  return fetch('/wfzo/api/v1/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: recipientMemberId,
      content: content
    })
  });
}

// AFTER: Support both organization and user chat
function sendMessage(recipientMemberId, content, recipientUserId = null) {
  const body = {
    recipientId: recipientMemberId,
    content: content
  };
  
  // NEW: Add recipientUserId for user-level chat
  if (recipientUserId) {
    body.recipientUserId = recipientUserId;
  }
  
  return fetch('/wfzo/api/v1/chat/send', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// Usage examples:
sendMessage('MEMBER-060', 'Hello org');              // Organization chat
sendMessage('MEMBER-060', 'Hello Jane', 'user-id');  // User chat
```

---

### 3. Get Conversations (Enhanced)

**Endpoint:** `GET /wfzo/api/v1/chat/conversations`

#### What Changed
- **BEFORE:** Only returned member info
- **AFTER:** Now includes `chatType` and `user` object

#### Request (Unchanged)
```http
GET /wfzo/api/v1/chat/conversations?page=1&pageSize=10
Authorization: Bearer {token}
```

#### Response (Enhanced)

<details>
<summary><b>OLD Response (Still Works)</b></summary>

```json
{
  "conversations": [
    {
      "member": {
        "memberId": "MEMBER-060",
        "companyName": "ABC Corp",
        "logo": "https://..."
      },
      "lastMessage": {
        "content": "Hello",
        "senderId": "MEMBER-005",
        "createdAt": "2026-01-14T10:00:00Z"
      },
      "unreadCount": 2
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```
</details>

<details>
<summary><b>NEW Response (Enhanced)</b></summary>

```json
{
  "conversations": [
    {
      "chatType": "member",  // ← NEW: "member" or "user"
      "member": {
        "_id": "abc123",
        "memberId": "MEMBER-060",
        "companyName": "ABC Corp",
        "logo": "https://...",
        "address": {
          "city": "San Francisco",
          "country": "USA"
        }
      },
      "user": null,  // ← NEW: null for organization chat
      "lastMessage": {
        "content": "Hello",
        "senderId": "MEMBER-005",
        "createdAt": "2026-01-14T10:00:00Z",
        "isRead": false
      },
      "unreadCount": 2
    },
    {
      "chatType": "user",  // ← NEW: User-level chat
      "member": {
        "_id": "def456",
        "memberId": "MEMBER-060",
        "companyName": "ABC Corp",
        "logo": "https://...",
        "address": {
          "city": "San Francisco",
          "country": "USA"
        }
      },
      "user": {  // ← NEW: Specific user info
        "userId": "entra-uuid-2",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "engineer@abccorp.com",
        "userType": "Secondary",
        "profileImageUrl": "https://..."
      },
      "lastMessage": {
        "content": "Hello Jane!",
        "senderId": "MEMBER-005",
        "createdAt": "2026-01-14T11:00:00Z",
        "isRead": false
      },
      "unreadCount": 1
    },
    {
      "chatType": "user",  // ← Internal team chat
      "member": {
        "_id": "ghi789",
        "memberId": "MEMBER-005",  // ← Same as your memberId!
        "companyName": "Your Company",
        "logo": "https://..."
      },
      "user": {  // ← Your team member
        "userId": "team-member-uuid",
        "firstName": "Bob",
        "lastName": "Johnson",
        "email": "bob@yourcompany.com",
        "userType": "Secondary",
        "profileImageUrl": "https://..."
      },
      "lastMessage": {
        "content": "Hey team!",
        "senderId": "MEMBER-005",
        "createdAt": "2026-01-14T09:00:00Z",
        "isRead": true
      },
      "unreadCount": 0
    }
  ],
  "total": 3,
  "page": 1,
  "pageSize": 10
}
```
</details>

#### Frontend Changes (Recommended)

```typescript
// Helper function to identify chat type
function identifyChatType(conversation, myMemberId) {
  if (conversation.chatType === 'member') {
    return {
      type: 'organization',
      displayName: conversation.member.companyName,
      avatar: conversation.member.logo,
      badge: '🏢'
    };
  }
  
  if (conversation.chatType === 'user' && conversation.user) {
    const isInternal = conversation.member.memberId === myMemberId;
    const userName = `${conversation.user.firstName} ${conversation.user.lastName}`;
    
    if (isInternal) {
      return {
        type: 'team',
        displayName: userName,
        subtitle: 'Team Member',
        avatar: conversation.user.profileImageUrl,
        badge: '👥'
      };
    } else {
      return {
        type: 'external-user',
        displayName: userName,
        subtitle: `at ${conversation.member.companyName}`,
        avatar: conversation.user.profileImageUrl,
        badge: '💬'
      };
    }
  }
}

// Usage:
const myMemberId = "MEMBER-005";
conversations.forEach(conv => {
  const info = identifyChatType(conv, myMemberId);
  displayConversation(info.displayName, info.avatar, info.badge);
});
```

---

### 4. Get Messages (Enhanced)

**Endpoint:** `GET /wfzo/api/v1/chat/messages`

#### What Changed
- **BEFORE:** Only filtered by `otherMemberId`
- **AFTER:** Can optionally filter by `otherUserId` for user-level chat

#### Request Options

<details>
<summary><b>Option 1: Organization Messages (UNCHANGED)</b></summary>

```http
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-060&page=1&pageSize=50
Authorization: Bearer {token}
```

**Returns:** Organization-level messages only

</details>

<details>
<summary><b>Option 2: User Messages (NEW)</b></summary>

```http
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-060&otherUserId=entra-uuid-2&page=1&pageSize=50
Authorization: Bearer {token}
```

**Returns:** Messages with specific user only

</details>

#### Response (Same Structure)

```json
{
  "messages": [
    {
      "senderId": "MEMBER-005",
      "recipientId": "MEMBER-060",
      "senderUserId": "your-user-id",      // ← Present if user chat
      "recipientUserId": "entra-uuid-2",   // ← Present if user chat
      "content": "Hello Jane!",
      "type": "text",
      "isRead": true,
      "createdAt": "2026-01-14T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 50
}
```

#### Frontend Changes (Optional)

```typescript
// BEFORE: Only organization messages
function getMessages(otherMemberId, page = 1) {
  return fetch(`/wfzo/api/v1/chat/messages?otherMemberId=${otherMemberId}&page=${page}`);
}

// AFTER: Support both organization and user messages
function getMessages(otherMemberId, otherUserId = null, page = 1) {
  let url = `/wfzo/api/v1/chat/messages?otherMemberId=${otherMemberId}&page=${page}`;
  
  // NEW: Add otherUserId for user-level chat
  if (otherUserId) {
    url += `&otherUserId=${otherUserId}`;
  }
  
  return fetch(url);
}

// Usage:
getMessages('MEMBER-060');                    // Organization messages
getMessages('MEMBER-060', 'entra-uuid-2');    // User messages
```

---

### 5. Mark as Read (Enhanced)

**Endpoint:** `POST /wfzo/api/v1/chat/mark-as-read`

#### What Changed
- **BEFORE:** Only marked organization messages as read
- **AFTER:** Can optionally mark user-level messages with `otherUserId`

#### Request Options

<details>
<summary><b>Option 1: Organization Chat (UNCHANGED)</b></summary>

```http
POST /wfzo/api/v1/chat/mark-as-read
Authorization: Bearer {token}
Content-Type: application/json

{
  "otherMemberId": "MEMBER-060"
}
```
</details>

<details>
<summary><b>Option 2: User Chat (NEW)</b></summary>

```http
POST /wfzo/api/v1/chat/mark-as-read
Authorization: Bearer {token}
Content-Type: application/json

{
  "otherMemberId": "MEMBER-060",
  "otherUserId": "entra-uuid-2"  // ← NEW
}
```
</details>

#### Response (Unchanged)

```json
{
  "modifiedCount": 5
}
```

---

## 🎨 UI/UX Recommendations

### 1. Connections List UI

```
┌─────────────────────────────────────────┐
│ ABC Corp                        🏢      │  ← Organization
│ Connected on Jan 10, 2026               │
│                                         │
│ 👤 John Doe (CEO)              Primary  │  ← Click to chat with John
│ 👤 Jane Smith (Engineer)       Team     │  ← Click to chat with Jane
└─────────────────────────────────────────┘
```

### 2. Conversations List UI

```
┌─────────────────────────────────────────┐
│ 🏢 ABC Corp                      2      │  ← Organization chat
│    "Hello ABC Corp"                     │
│                                         │
│ 💬 Jane Smith at ABC Corp       1      │  ← User chat (external)
│    "Hello Jane!"                        │
│                                         │
│ 👥 Bob Johnson                  0      │  ← Team member chat
│    "Hey team!"                          │
└─────────────────────────────────────────┘
```

### 3. Chat Selection Flow

```javascript
// When user clicks on a connection
function onConnectionClick(connection) {
  // Show organization chat option
  showChatOption({
    type: 'organization',
    name: connection.member.organisationInfo.companyName,
    recipientId: connection.member.memberId,
    recipientUserId: null  // No user ID for org chat
  });
  
  // NEW: Show individual user chat options
  connection.member.primaryUsers?.forEach(user => {
    showChatOption({
      type: 'user',
      name: `${user.firstName} ${user.lastName} (Primary)`,
      recipientId: connection.member.memberId,
      recipientUserId: user.userId  // Specific user
    });
  });
  
  connection.member.secondaryUsers?.forEach(user => {
    showChatOption({
      type: 'user',
      name: `${user.firstName} ${user.lastName} (Team Member)`,
      recipientId: connection.member.memberId,
      recipientUserId: user.userId  // Specific user
    });
  });
}
```

---

## 📊 Chat Type Decision Matrix

| Scenario | `chatType` | `user` | `member.memberId` | UI Label | Icon |
|----------|------------|--------|-------------------|----------|------|
| Org ↔ Org | `"member"` | `null` | Different | Company Name | 🏢 |
| You ↔ Team Member | `"user"` | Exists | **Same** | "FirstName LastName (Team)" | 👥 |
| You ↔ External User | `"user"` | Exists | Different | "FirstName at Company" | 💬 |

---

## 🔄 Migration Strategy

### Phase 1: No Changes (Current State)
- Existing UI works as-is
- Only organization-level chat visible
- No code changes needed

### Phase 2: Read New Data (Safe Update)
```typescript
// Just read the new fields, don't use them yet
connections.forEach(conn => {
  console.log('Primary users:', conn.member.primaryUsers);
  console.log('Secondary users:', conn.member.secondaryUsers);
});

conversations.forEach(conv => {
  console.log('Chat type:', conv.chatType);
  console.log('User:', conv.user);
});
```

### Phase 3: Display New Options (Enhancement)
- Show user list in connections
- Show user badges in conversations
- Add "Chat with user" buttons

### Phase 4: Enable User Chat (Full Integration)
- Implement user selection UI
- Pass `recipientUserId` when sending messages
- Filter messages by `otherUserId`

---

## 🧪 Testing Scenarios

### Test 1: Existing Flow (No Changes)
```javascript
// Should work exactly as before
sendMessage('MEMBER-060', 'Hello');
getConversations();
getMessages('MEMBER-060');
```
**Expected:** No errors, same behavior

### Test 2: New Fields Present
```javascript
getConnections().then(response => {
  assert(response.data[0].member.primaryUsers !== undefined);
  assert(response.data[0].member.secondaryUsers !== undefined);
});
```
**Expected:** New fields exist but can be ignored

### Test 3: User Chat
```javascript
// Get user ID from connections
const userId = connections[0].member.primaryUsers[0].userId;

// Send to specific user
sendMessage('MEMBER-060', 'Hello Jane', userId);

// Get user messages
getMessages('MEMBER-060', userId);
```
**Expected:** User-level chat works

---

## ❓ FAQ

### Q: Will my existing chat UI break?
**A:** No. All new fields are optional. Existing API calls work unchanged.

### Q: Do I need to update my UI immediately?
**A:** No. You can update gradually:
1. Keep using organization chat only (current)
2. Display new user data (optional)
3. Enable user chat (when ready)

### Q: How do I know if a conversation is organization vs user level?
**A:** Check `chatType` field:
- `"member"` = Organization chat
- `"user"` = User chat

### Q: Can I ignore the new fields?
**A:** Yes. If you don't pass `recipientUserId`, it works like before.

### Q: What if `primaryUsers` or `secondaryUsers` is empty?
**A:** It means no users of that type exist. Array will be `[]` (empty array).

### Q: How do I distinguish internal team chat from external user chat?
**A:** Compare `member.memberId` with your own:
- Same memberId = Internal team
- Different memberId = External user

---

## 📞 Support

If you have questions or need clarification:
1. Check Swagger docs: `http://localhost:3001/docs`
2. Review example responses in this document
3. Test in development environment first

---

## 📝 Summary of Changes

| Feature | Old Behavior | New Behavior | Breaking? |
|---------|-------------|--------------|-----------|
| Get Connections | Returns connected members only | Returns connected members + internal team | ❌ No |
| Send Message | Member only | Member or User (optional) | ❌ No |
| Get Conversations | Member info only | Member + user info + chatType | ❌ No |
| Get Messages | Member filter only | Member + User filter (optional) | ❌ No |
| Mark as Read | Member only | Member or User (optional) | ❌ No |

### New Fields in Connections Response

| Field | Type | Description | When Present |
|-------|------|-------------|--------------|
| `isInternalTeam` | `boolean` | `true` for internal team, `false` for external | Always |
| `connectionId` | `string \| null` | Connection ID or `null` for internal team | Always |
| `connectedAt` | `string \| null` | Connection date or `null` for internal team | Always |
| `status` | `string` | `"internal"` or `"accepted"` | Always |

**All changes are backward compatible. Existing implementation will continue to work.**
