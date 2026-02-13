# User-Level Chat & Connections Implementation - UPDATED

## Overview
This implementation extends the existing member-based chat system to support user-level messaging while maintaining **strict separation** between Member Chat and User Chat.

**Critical Rule:** Connections exist **ONLY between Members** (Primary users). Once members are connected, all users under those members can chat.

## Chat Routing Rules (CRITICAL)

### Member Chat
- **Participants:** Primary ↔ Primary
- **Condition:** No `recipientUserId` provided AND sender is Primary
- **Storage:** Messages stored WITHOUT `senderUserId` or `recipientUserId` fields
- **Access:** Only Primary users can see Member Chat

### User Chat
- **Participants:** Any combination involving at least one Secondary user:
  - Secondary ↔ Secondary
  - Secondary ↔ Primary  
  - Primary ↔ Secondary (when `recipientUserId` is provided)
- **Storage:** Messages stored WITH `senderUserId` AND `recipientUserId` fields
- **Access:** Both Primary and Secondary users can see User Chat

### Authorization
- Before any chat: **Verify members (Primary users) are connected**
- No user-level connection records are created
- Secondary users inherit chat permission from their member's connection

## Implementation Details

### 1. Message Schema
**File:** `src/modules/chat/schemas/message.schema.ts`

Fields:
- `senderId` (required): Member ID
- `recipientId` (required): Member ID
- `senderUserId` (optional): User ID when User Chat
- `recipientUserId` (optional): User ID when User Chat

**Routing Logic:**
- If `senderUserId` and `recipientUserId` are present → **User Chat**
- If both are absent → **Member Chat**

### 2. Service Logic
**File:** `src/modules/chat/chat.service.ts`

#### `sendMessage()`
1. Get sender info (member, user, isPrimary)
2. Validate recipient member exists
3. **Check members are connected** (throws ForbiddenException if not)
4. Determine chat type:
   - If `recipientUserId` provided → User Chat
   - Else if sender is Secondary → User Chat (default to recipient's Primary user)
   - Else → Member Chat
5. Store message with appropriate fields

#### `getConversations()`
1. Get current user info
2. Query messages where user participated
3. For Primary users: Include both Member Chat and User Chat
4. For Secondary users: Include only User Chat
5. Return conversations with `chatType` field ('member' or 'user')

#### `getMessages()`
1. Get current user info
2. If `otherUserId` provided → Filter User Chat messages
3. Else if current user is Primary → Filter Member Chat messages (no userId fields)
4. Else (Secondary without userId) → Return empty

#### `markAsRead()`
1. Similar routing logic to `getMessages()`
2. Update only messages in the specified chat type

### 3. Connection Authorization
**Key Check:** `areMembersConnected(memberId1, memberId2)`
- Queries Connection collection
- Checks for ACCEPTED status
- Used before allowing any chat

## API Usage Examples

### 1. Member Chat (Primary ↔ Primary)

**Send Message:**
```json
POST /wfzo/api/v1/chat/send
{
  "recipientId": "MEMBER-002",
  "content": "Hello from our organization"
}
```
**Note:** No `recipientUserId` → Goes to Member Chat

**Get Messages:**
```
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002
```
**Note:** No `otherUserId` → Returns Member Chat only

### 2. User Chat (Secondary ↔ Secondary)

**Send Message:**
```json
POST /wfzo/api/v1/chat/send
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-456",
  "content": "Hello from user to user"
}
```
**Note:** `recipientUserId` provided → Goes to User Chat

**Get Messages:**
```
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002&otherUserId=user-456
```
**Note:** `otherUserId` provided → Returns User Chat only

### 3. Get Conversations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "chatType": "member",
      "member": {...},
      "user": null,
      "lastMessage": {...},
      "unreadCount": 2
    },
    {
      "chatType": "user",
      "member": {...},
      "user": {
        "userId": "user-456",
        "firstName": "John",
        "userType": "Secondary"
      },
      "lastMessage": {...},
      "unreadCount": 5
    }
  ]
}
```
**Note:** `chatType` clearly indicates Member Chat vs User Chat

### 4. Get Connections (Updated with User Details)

```
GET /wfzo/api/v1/connections
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
**Note:** Users are now grouped as `primaryUsers` and `secondaryUsers` for easy chat initiation

## Chat Flow Examples

### Example 1: Secondary ↔ Secondary (User Chat Only)
1. User A (Secondary) from MEMBER-001 wants to message User B (Secondary) from MEMBER-002
2. System checks: Are MEMBER-001 and MEMBER-002 connected? ✅
3. Message stored with:
   - `senderId`: "MEMBER-001"
   - `senderUserId`: "user-123"
   - `recipientId`: "MEMBER-002"
   - `recipientUserId`: "user-456"
4. **This message NEVER appears in Member Chat**

### Example 2: Primary ↔ Primary (Member Chat Only)
1. Primary user from MEMBER-001 messages MEMBER-002 (no `recipientUserId`)
2. Message stored with:
   - `senderId`: "MEMBER-001"
   - `recipientId`: "MEMBER-002"
   - No `senderUserId` or `recipientUserId`
3. **This message appears ONLY in Member Chat**
4. Secondary users cannot see this message

### Example 3: Primary Acting as User (User Chat)
1. Primary user from MEMBER-001 wants to message Secondary user from MEMBER-002
2. Provide `recipientUserId`: "user-456"
3. Message stored with:
   - `senderId`: "MEMBER-001"
   - `senderUserId`: "primary-user-id"
   - `recipientId`: "MEMBER-002"
   - `recipientUserId`: "user-456"
4. **This message goes to User Chat, NOT Member Chat**

## Key Features

✅ **Strict Chat Separation**: Member Chat and User Chat are completely separate
✅ **Connection-Based Authorization**: Members must be connected
✅ **No User Connections**: Connections exist only between members
✅ **Clear Routing**: `chatType` field indicates message thread type
✅ **Access Control**: Secondary users see only User Chat
✅ **Backward Compatible**: Existing member chat unchanged

## Database Indexes

Existing indexes:
- `{ senderId: 1, recipientId: 1, createdAt: -1 }`
- `{ recipientId: 1, isRead: 1 }`

New indexes for user chat:
- `{ senderUserId: 1, recipientUserId: 1 }`
- `{ senderUserId: 1 }`
- `{ recipientUserId: 1 }`

## Testing Scenarios

### Test 1: Member Chat Isolation
- Primary ↔ Primary chat
- Verify Secondary users cannot see these messages
- Verify messages have no userId fields

### Test 2: User Chat Isolation
- Secondary ↔ Secondary chat
- Verify messages have userId fields
- Verify they don't appear in Member Chat

### Test 3: Connection Check
- Try to chat with non-connected member
- Verify ForbiddenException is thrown

### Test 4: Conversations List
- Primary user sees both Member Chat and User Chat
- Secondary user sees only User Chat
- Each conversation has correct `chatType`

## Frontend Integration Guide

### 1. Display Connections with Users
```typescript
// Fetch connections
const response = await fetch('/wfzo/api/v1/connections');
const { data: connections } = await response.json();

connections.forEach(conn => {
  // Display organization info
  console.log(conn.member.organisationInfo.companyName);
  
  // Display primary users (organization representatives)
  conn.member.primaryUsers.forEach(user => {
    console.log(`${user.firstName} ${user.lastName} (${user.userType})`);
    // Use user.memberLogoUrl for avatar
  });
  
  // Display secondary users (team members)
  conn.member.secondaryUsers.forEach(user => {
    console.log(`${user.firstName} ${user.lastName} (${user.userType})`);
    // Use user.userLogoUrl for avatar
  });
});
```

### 2. Display Conversations
```typescript
conversations.forEach(conv => {
  if (conv.chatType === 'member') {
    // Show as organization chat
    displayName = conv.member.companyName;
    icon = conv.member.logo;
  } else {
    // Show as user chat
    displayName = `${conv.user.firstName} ${conv.user.lastName}`;
    icon = conv.user.profileImageUrl;
  }
});
```

### 3. Send Message
```typescript
// For Member Chat (Primary users only)
sendMessage({
  recipientId: memberId,
  content: text
});

// For User Chat
sendMessage({
  recipientId: memberId,
  recipientUserId: userId,  // Include this!
  content: text
});
```

### 4. Load Messages
```typescript
// Member Chat
getMessages({ otherMemberId: memberId });

// User Chat
getMessages({ 
  otherMemberId: memberId,
  otherUserId: userId  // Include this!
});
```

## Summary

🔒 **Connections:** Member-only (Primary ↔ Primary)
💬 **Member Chat:** Primary ↔ Primary, no userId fields
👥 **User Chat:** Any involving Secondary, has userId fields
✅ **Authorization:** Check member connection before chat
🚫 **No Cross-Pollut**: User chats never appear in Member chat

This implementation ensures complete separation while allowing flexible communication once members are connected.


## What Was Added

### 1. Message Schema Extensions
**File:** `src/modules/chat/schemas/message.schema.ts`

Added optional fields to support user identities:
- `senderUserId?: string` - User ID from userSnapshots when sender is a user
- `recipientUserId?: string` - User ID from userSnapshots when recipient is a user

**Backward Compatibility:** Existing messages without these fields continue to work as member-to-member messages.

### 2. Chat DTOs Extensions
**File:** `src/modules/chat/dto/chat.dto.ts`

Extended DTOs with optional user fields:
- `SendMessageDto`: Added `recipientUserId?: string`
- `GetMessagesQueryDto`: Added `otherUserId?: string`
- `MarkAsReadDto`: Added `otherUserId?: string`

**Backward Compatibility:** All fields are optional. Existing API calls without userId work as before.

### 3. Chat Service Enhancements
**File:** `src/modules/chat/chat.service.ts`

#### New Helper Method
- `findUserByEmail()` - Finds user data from userSnapshots

#### Enhanced Methods
- **`sendMessage()`**: Now supports three chat types:
  - Member ↔ Member (existing)
  - User ↔ User (new)
  - Member ↔ User (new)
  
- **`getConversations()`**: Returns both member and user conversations with user details when applicable

- **`getMessages()`**: Filters messages by userId when provided, otherwise uses member-only filter

- **`markAsRead()`**: Marks messages as read for both member and user-level conversations

**Backward Compatibility:** When `recipientUserId` or `otherUserId` are not provided, the methods use the original member-only logic.

### 4. Connection Service Extensions
**File:** `src/modules/connection/connection.service.ts`

#### Enhanced Method
- **`getMyConnections()`**: Now includes a `users` array for each connected member, extracted from `userSnapshots`

User fields included:
- `userId`
- `firstName`
- `lastName`
- `email`
- `userType`
- `profileImageUrl`
- `designation`

**Backward Compatibility:** Existing `member` field structure is unchanged. `users` array is an additional field.

## API Usage

### 1. Send Message to a User

**Endpoint:** `POST /wfzo/api/v1/chat/send`

**Member-to-Member (Existing):**
```json
{
  "recipientId": "MEMBER-002",
  "content": "Hello from organization"
}
```

**User-to-User (New):**
```json
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-456",
  "content": "Hello from user to user"
}
```

### 2. Get Conversations

**Endpoint:** `GET /wfzo/api/v1/chat/conversations`

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "member": {
        "memberId": "MEMBER-002",
        "companyName": "ABC Corp",
        "logo": "...",
        "address": {...}
      },
      "user": {
        "userId": "user-456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@abc.com",
        "userType": "Secondary",
        "profileImageUrl": "..."
      },
      "lastMessage": {...},
      "unreadCount": 3
    }
  ]
}
```

**Note:** `user` field is `null` for member-only conversations.

### 3. Get Messages with a User

**Endpoint:** `GET /wfzo/api/v1/chat/messages`

**Member-to-Member (Existing):**
```
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002
```

**User-to-User (New):**
```
GET /wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002&otherUserId=user-456
```

### 4. Mark Messages as Read

**Endpoint:** `PUT /wfzo/api/v1/chat/mark-read`

**Member-to-Member (Existing):**
```json
{
  "otherMemberId": "MEMBER-002"
}
```

**User-to-User (New):**
```json
{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"
}
```

### 5. Get Connections (with Users)

**Endpoint:** `GET /wfzo/api/v1/connections`

**Response Format:**
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "connectionId": "...",
        "member": {
          "memberId": "MEMBER-002",
          "organisationInfo": {...}
        },
        "users": [
          {
            "userId": "user-123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@abc.com",
            "userType": "Primary",
            "profileImageUrl": "...",
            "designation": "CEO"
          },
          {
            "userId": "user-456",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@abc.com",
            "userType": "Secondary",
            "profileImageUrl": "...",
            "designation": "Manager"
          }
        ],
        "connectedAt": "...",
        "status": "accepted"
      }
    ]
  }
}
```

## Chat Flow Examples

### Example 1: User-to-User Chat
1. User A from MEMBER-001 sends message to User B from MEMBER-002
2. Message is stored with:
   - `senderId`: "MEMBER-001"
   - `senderUserId`: "user-123"
   - `recipientId`: "MEMBER-002"
   - `recipientUserId`: "user-456"

### Example 2: Member-to-User Chat
1. Primary user from MEMBER-001 sends message to User B from MEMBER-002
2. Message is stored with:
   - `senderId`: "MEMBER-001"
   - `senderUserId`: "primary-user-id"
   - `recipientId`: "MEMBER-002"
   - `recipientUserId`: "user-456"

### Example 3: Member-to-Member Chat (Unchanged)
1. Primary user from MEMBER-001 sends message to MEMBER-002
2. Message is stored with:
   - `senderId`: "MEMBER-001"
   - `recipientId`: "MEMBER-002"
   - No `senderUserId` or `recipientUserId`

## Data Model

### Message Document Structure
```typescript
{
  senderId: "MEMBER-001",           // Required: Sender's member ID
  recipientId: "MEMBER-002",        // Required: Recipient's member ID
  senderUserId: "user-123",         // Optional: Sender's user ID from userSnapshots
  recipientUserId: "user-456",      // Optional: Recipient's user ID from userSnapshots
  content: "Hello",
  type: "text",
  isRead: false,
  createdAt: "2026-01-13T...",
  updatedAt: "2026-01-13T..."
}
```

### Connection Response Structure
```typescript
{
  connectionId: "...",
  member: {
    memberId: "MEMBER-002",
    organisationInfo: {...}
  },
  users: [                          // NEW: Array of users from userSnapshots
    {
      userId: "user-123",
      firstName: "John",
      lastName: "Doe",
      email: "john@abc.com",
      userType: "Primary",
      profileImageUrl: "...",
      designation: "CEO"
    }
  ],
  connectedAt: "...",
  status: "accepted"
}
```

## Key Features

✅ **Backward Compatible**: All existing member-to-member functionality unchanged
✅ **Additive Only**: No breaking changes to schemas, APIs, or responses
✅ **Three Chat Types**: Member↔Member, User↔User, Member↔User
✅ **User Discovery**: Connected members now show their users for easy selection
✅ **Proper Filtering**: Chat queries correctly filter by user IDs when provided
✅ **Clean Separation**: User fields are optional and clearly marked as ADD-ON

## Database Indexes

New indexes added for efficient user-level chat queries:
- `{ senderUserId: 1, recipientUserId: 1 }`
- `{ senderUserId: 1 }`
- `{ recipientUserId: 1 }`

Existing indexes remain unchanged.

## Testing Recommendations

1. **Member-to-Member Chat**: Verify existing functionality works
2. **User-to-User Chat**: Test sending messages between users of connected members
3. **Conversations List**: Verify both member and user conversations appear
4. **Connections List**: Check that users array is populated correctly
5. **Mark as Read**: Test both member and user-level read receipts

## Notes

- User data is always sourced from `member.userSnapshots` - no separate user collection
- Users can only chat if their parent members are connected
- All user identity is derived from `userSnapshots.id` and `userSnapshots.email`
- No migration required - existing data continues to work
- Frontend can check for presence of `user` field to determine conversation type
