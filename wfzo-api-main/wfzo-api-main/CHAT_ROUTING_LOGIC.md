# Chat Routing Logic - Quick Reference

## Core Principle
**Connections = Member-Only | Chat = Member + User**

Once two members (Primary users) are connected, all users under those members can chat.

## Chat Types

### 1. Member Chat
- **WHO:** Primary ↔ Primary only
- **WHEN:** No `recipientUserId` in request
- **STORAGE:** No `senderUserId`/`recipientUserId` fields
- **ACCESS:** Primary users only

### 2. User Chat  
- **WHO:** Any chat involving a Secondary user
- **WHEN:** `recipientUserId` provided OR sender is Secondary
- **STORAGE:** Has `senderUserId` AND `recipientUserId` fields
- **ACCESS:** All users (Primary + Secondary)

## Request/Response Patterns

### Send Message

**Member Chat:**
```json
POST /chat/send
{
  "recipientId": "MEMBER-002",
  "content": "Hello"
}
```
→ Goes to Member Chat thread

**User Chat:**
```json
POST /chat/send
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-456",
  "content": "Hello"
}
```
→ Goes to User Chat thread

### Get Messages

**Member Chat:**
```
GET /chat/messages?otherMemberId=MEMBER-002
```
→ Returns Member Chat only (no userId fields)

**User Chat:**
```
GET /chat/messages?otherMemberId=MEMBER-002&otherUserId=user-456
```
→ Returns User Chat only (has userId fields)

## Get Connections

**Response includes grouped users:**
```
GET /connections
```

**Response:**
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
          "memberLogoUrl": "https://...",
          "industries": ["manufacturing"]
        },
        "primaryUsers": [
          {
            "userId": "entra-uuid-1",
            "email": "owner@jparksky.com",
            "firstName": "John",
            "lastName": "Park",
            "designation": "Director",
            "userType": "Primary",
            "memberLogoUrl": "https://..."
          }
        ],
        "secondaryUsers": [
          {
            "userId": "entra-uuid-2",
            "email": "staff@jparksky.com",
            "firstName": "Anna",
            "lastName": "Lee",
            "designation": "Engineer",
            "userType": "Secondary",
            "userLogoUrl": "https://..."
          }
        ]
      },
      "connectedAt": "2026-01-13T07:16:17.366Z",
      "status": "accepted"
    }
  ]
}
```

### Conversations

**Response includes `chatType`:**
```json
{
  "conversations": [
    {
      "chatType": "member",  // ← Member Chat
      "member": {...},
      "user": null,
      ...
    },
    {
      "chatType": "user",    // ← User Chat
      "member": {...},
      "user": {...},         // ← User details present
      ...
    }
  ]
}
```

## Authorization Flow

```
User wants to send message
↓
1. Get sender info (member, user, isPrimary)
↓
2. Check: Are the two MEMBERS connected?
   ↓ No → ForbiddenException
   ↓ Yes
3. Determine chat type:
   - recipientUserId provided? → User Chat
   - sender is Secondary? → User Chat
   - else → Member Chat
↓
4. Store message with correct fields
```

## Message Storage

**Member Chat Message:**
```typescript
{
  senderId: "MEMBER-001",
  recipientId: "MEMBER-002",
  // senderUserId: NOT SET
  // recipientUserId: NOT SET
  content: "..."
}
```

**User Chat Message:**
```typescript
{
  senderId: "MEMBER-001",
  recipientId: "MEMBER-002",
  senderUserId: "user-123",      // SET
  recipientUserId: "user-456",   // SET
  content: "..."
}
```

## Access Rules

| User Type | Member Chat | User Chat |
|-----------|-------------|-----------|
| Primary   | ✅ Yes      | ✅ Yes    |
| Secondary | ❌ No       | ✅ Yes    |

## Frontend Decision Tree

```
User views connections list
↓
For each connection, display:
├─ primaryUsers[] → Show as "Organization Representatives"
│   - Use for Member Chat initiation
│   - Display with member logo
│
└─ secondaryUsers[] → Show as "Team Members"
    - Use for User Chat initiation
    - Display with user profile image

When user clicks on chat:
↓
Check selected user type
├─ Primary user selected → Initiate Member Chat
│   - Send without recipientUserId
│   - Show company name/logo in chat header
│
└─ Secondary user selected → Initiate User Chat
    - Send WITH recipientUserId
    - Show user name/photo in chat header
```

## Key Methods

### ChatService

**sendMessage()**
- Checks member connection
- Determines chat type
- Sets userId fields accordingly

**getConversations()**
- Primary users: Returns both chat types
- Secondary users: Returns User Chat only
- Adds `chatType` field to each

**getMessages()**
- `otherUserId` provided? → User Chat filter
- Current user is Primary + no `otherUserId`? → Member Chat filter
- Secondary user without `otherUserId`? → Empty

**markAsRead()**
- Same routing logic as getMessages()

## Common Pitfalls

❌ **DON'T:** Create user-to-user connection records
✅ **DO:** Check member connection before chat

❌ **DON'T:** Mix Member Chat and User Chat messages
✅ **DO:** Keep them completely separate

❌ **DON'T:** Show Member Chat to Secondary users
✅ **DO:** Filter by user type

❌ **DON'T:** Forget to pass `recipientUserId` for user chat
✅ **DO:** Include it for any user-level messaging

## Testing Checklist

- [ ] Primary ↔ Primary without userId → Member Chat
- [ ] Primary ↔ Primary with userId → User Chat
- [ ] Secondary → Anyone → User Chat
- [ ] Secondary cannot see Member Chat
- [ ] Conversations show correct `chatType`
- [ ] Non-connected members cannot chat (403)
- [ ] Get Connections returns primaryUsers and secondaryUsers arrays
- [ ] primaryUsers array contains only Primary user type
- [ ] secondaryUsers array contains only Secondary user type

## Summary

🔐 **Connections:** Members only
💬 **Member Chat:** Primary ↔ Primary (no userIds)
👥 **User Chat:** Any Secondary involved (has userIds)
🚫 **Separation:** Never mix the two
✅ **Simple Rule:** If `recipientUserId` or Secondary involved → User Chat, else Member Chat
