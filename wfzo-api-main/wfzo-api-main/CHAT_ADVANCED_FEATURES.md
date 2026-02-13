# Chat Advanced Features - Implementation Guide

**Date**: January 20, 2026  
**Version**: 2.0  
**Status**: ✅ Implemented

## Overview

This document covers three advanced chat features added to the WFZO Chat system:

1. **Star / Unstar Conversations** - Users can mark conversations as favorites
2. **Block User from Messaging** - Individual user-level blocking for both internal and external chats
3. **Delete Message** - Soft deletion of messages with proper authorization

All features maintain **100% backward compatibility** with existing chat flows.

---

## 1. Star / Unstar Conversations

### Purpose
Allow users to mark important conversations as "starred" for quick access and organization.

### Schema: ConversationPreferences

**File**: `src/modules/chat/schemas/conversation-preferences.schema.ts`

```typescript
{
  userId: string;           // User ID who owns this preference
  memberId: string;         // User's member ID
  otherMemberId: string;    // The other member in conversation
  otherUserId?: string;     // The other user (if User Chat)
  isStarred: boolean;       // Whether conversation is starred
  starredAt?: Date;         // When it was starred
  createdAt: Date;          // Auto-generated
  updatedAt: Date;          // Auto-generated
}
```

**Indexes**:
- Compound unique index: `{ userId, memberId, otherMemberId, otherUserId }`
- Query index: `{ userId, isStarred }`

### API Endpoints

#### Star a Conversation
```
POST /wfzo/api/v1/chat/star
Authorization: Bearer <token>
Content-Type: application/json

{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"  // Optional: for User Chat
}
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation starred successfully"
}
```

#### Unstar a Conversation
```
POST /wfzo/api/v1/chat/unstar
Authorization: Bearer <token>
Content-Type: application/json

{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"  // Optional: for User Chat
}
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation unstarred successfully"
}
```

### Integration with Conversations List

The `GET /wfzo/api/v1/chat/conversations` endpoint **now includes** `isStarred` field:

```json
{
  "success": true,
  "data": [
    {
      "chatType": "user",
      "isStarred": true,  // ← NEW FIELD
      "member": { ... },
      "user": { ... },
      "lastMessage": { ... },
      "unreadCount": 2
    }
  ],
  "pagination": { ... }
}
```

### Frontend Usage

```javascript
// Star a conversation
async function starConversation(otherMemberId, otherUserId) {
  const response = await fetch('/wfzo/api/v1/chat/star', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ otherMemberId, otherUserId })
  });
  return response.json();
}

// Filter starred conversations from the list
const starredConversations = conversations.filter(c => c.isStarred);
```

---

## 2. Block User from Messaging

### Purpose
Allow users to block specific individuals from sending them messages in both:
- **Internal Team Chat** (same organization)
- **External User Chat** (different organizations)

**Important**: This is **user-level** blocking, different from connection-level blocking at `/connections/:id/block`.

### Schema: UserBlock

**File**: `src/modules/chat/schemas/user-block.schema.ts`

```typescript
{
  blockerId: string;         // User ID who blocked
  blockerMemberId: string;   // Blocker's member ID
  blockedUserId: string;     // User ID who is blocked
  blockedMemberId: string;   // Blocked user's member ID
  blockedAt: Date;           // When the block was created
  isActive: boolean;         // Active status (for soft unblock)
  createdAt: Date;           // Auto-generated
  updatedAt: Date;           // Auto-generated
}
```

**Indexes**:
- Compound unique index: `{ blockerId, blockedUserId }`
- Query indexes: `{ blockedUserId, isActive }`, `{ blockerId, isActive }`

### API Endpoints

#### Block a User
```
POST /wfzo/api/v1/chat/block-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockedUserId": "user-456",
  "blockedMemberId": "MEMBER-002"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

**Validation**:
- ✅ User must exist in the system
- ❌ Cannot block yourself
- ✅ Blocking is upserted (reactivates if previously unblocked)

#### Unblock a User
```
POST /wfzo/api/v1/chat/unblock-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockedUserId": "user-456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

**Error** (404 if not blocked):
```json
{
  "statusCode": 404,
  "message": "Block record not found",
  "error": "Not Found"
}
```

#### Get Blocked Users List
```
GET /wfzo/api/v1/chat/blocked-users
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-456",
      "memberId": "MEMBER-002",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "profileImageUrl": "https://...",
      "userType": "Secondary",
      "companyName": "ABC Corporation",
      "blockedAt": "2026-01-20T10:30:00.000Z"
    }
  ]
}
```

### Enforcement in Message Sending

When a user tries to send a message, the system checks:

```typescript
// In ChatService.sendMessage()
if (isUserChat && recipientUserId) {
  const isBlocked = await this.isUserBlocked(senderUserId, recipientUserId);
  if (isBlocked) {
    throw new ForbiddenException('You cannot send messages to this user. They have blocked you.');
  }
}
```

**Error Response** (403):
```json
{
  "statusCode": 403,
  "message": "You cannot send messages to this user. They have blocked you.",
  "error": "Forbidden"
}
```

### Important Notes

1. **User Chat Only**: Blocking only applies to User Chat (internal & external). Member Chat is unaffected.
2. **Chat History Preserved**: Past messages remain visible to both parties.
3. **One-Way Block**: If User A blocks User B:
   - ✅ User A can still send messages to User B
   - ❌ User B **cannot** send messages to User A
4. **Different from Connection Block**:
   - Connection block: Prevents all interaction at member level
   - User block: Prevents messaging at individual user level

---

## 3. Delete Message

### Purpose
Allow users to delete their own sent messages from the conversation view.

### Schema Updates: Message

**File**: `src/modules/chat/schemas/message.schema.ts`

**New Fields**:
```typescript
{
  // ... existing fields ...
  isDeleted: boolean;    // Soft delete flag (default: false)
  deletedAt?: Date;      // When message was deleted
  deletedBy?: string;    // User ID who deleted the message
}
```

**New Indexes**:
- `{ isDeleted: 1 }`
- `{ senderId, recipientId, isDeleted }`

### API Endpoint

#### Delete a Message
```
DELETE /wfzo/api/v1/chat/message/:messageId
Authorization: Bearer <token>
```

**Example**:
```
DELETE /wfzo/api/v1/chat/message/507f1f77bcf86cd799439011
```

**Response**:
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Authorization**:
- ✅ Only the **sender** can delete their own messages
- ❌ Recipients cannot delete messages sent to them

**Error** (403 if not sender):
```json
{
  "statusCode": 403,
  "message": "You can only delete your own messages",
  "error": "Forbidden"
}
```

**Error** (404 if message not found):
```json
{
  "statusCode": 404,
  "message": "Message not found",
  "error": "Not Found"
}
```

### Soft Delete Implementation

Messages are **soft deleted**:
- Set `isDeleted = true`
- Set `deletedAt = current timestamp`
- Set `deletedBy = current user ID`
- **Message document remains in database**

### Impact on Existing APIs

#### 1. Get Messages (`GET /chat/messages`)

Deleted messages are **automatically filtered out**:
```typescript
filter.isDeleted = { $ne: true };
```

**Before deletion**:
```json
{
  "messages": [
    { "_id": "msg1", "content": "Hello" },
    { "_id": "msg2", "content": "How are you?" },
    { "_id": "msg3", "content": "Great!" }
  ]
}
```

**After deleting msg2**:
```json
{
  "messages": [
    { "_id": "msg1", "content": "Hello" },
    { "_id": "msg3", "content": "Great!" }
  ]
}
```

#### 2. Get Conversations (`GET /chat/conversations`)

Deleted messages are **excluded from aggregation**:
- Last message will skip deleted messages
- Unread count excludes deleted messages
- If all messages deleted, conversation may disappear from list

### Frontend Handling

```javascript
// Delete a message
async function deleteMessage(messageId) {
  const response = await fetch(`/wfzo/api/v1/chat/message/${messageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    // Remove message from UI
    removeMessageFromView(messageId);
  }
}

// Show delete button only for own messages
function canDeleteMessage(message, currentUserId) {
  return message.senderUserId === currentUserId;
}
```

---

## Backward Compatibility

### ✅ All existing endpoints work unchanged

1. **Send Message** - Still works, now with blocking check
2. **Get Conversations** - Returns existing fields + `isStarred`
3. **Get Messages** - Returns existing messages (deleted ones filtered)
4. **Mark as Read** - Unchanged behavior
5. **Upload File** - Unchanged behavior

### ✅ Database Changes

All new fields have **default values**:
- `isDeleted: false` (Message schema)
- `isStarred: false` (ConversationPreferences)
- `isActive: true` (UserBlock)

Existing messages continue to work without migration.

### ✅ Optional Features

Frontend can:
- Ignore `isStarred` field if not implementing favorites
- Skip implementing block/unblock UI
- Skip implementing delete message UI

Core chat functionality remains intact.

---

## Testing Guide

### Test Scenario 1: Star/Unstar

```bash
# Star a conversation
curl -X POST http://localhost:3000/wfzo/api/v1/chat/star \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherMemberId":"MEMBER-002","otherUserId":"user-456"}'

# Verify in conversations list
curl -X GET "http://localhost:3000/wfzo/api/v1/chat/conversations" \
  -H "Authorization: Bearer $TOKEN"

# Unstar
curl -X POST http://localhost:3000/wfzo/api/v1/chat/unstar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherMemberId":"MEMBER-002","otherUserId":"user-456"}'
```

### Test Scenario 2: Block/Unblock User

```bash
# Block a user
curl -X POST http://localhost:3000/wfzo/api/v1/chat/block-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedUserId":"user-456","blockedMemberId":"MEMBER-002"}'

# Try to send message (as blocked user) - should fail
curl -X POST http://localhost:3000/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer $BLOCKED_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"MEMBER-001","recipientUserId":"user-123","content":"Test"}'

# Get blocked users list
curl -X GET http://localhost:3000/wfzo/api/v1/chat/blocked-users \
  -H "Authorization: Bearer $TOKEN"

# Unblock
curl -X POST http://localhost:3000/wfzo/api/v1/chat/unblock-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedUserId":"user-456"}'
```

### Test Scenario 3: Delete Message

```bash
# Send a message first
curl -X POST http://localhost:3000/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"MEMBER-002","recipientUserId":"user-456","content":"Test message"}'

# Get message ID from response, then delete
curl -X DELETE http://localhost:3000/wfzo/api/v1/chat/message/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"

# Verify message is gone from messages list
curl -X GET "http://localhost:3000/wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002&otherUserId=user-456" \
  -H "Authorization: Bearer $TOKEN"
```

---

## MongoDB Queries

### Check starred conversations
```javascript
db.conversationpreferences.find({
  userId: "user-123",
  isStarred: true
})
```

### Check who blocked whom
```javascript
db.userblocks.find({
  isActive: true
})
```

### Check deleted messages
```javascript
db.messages.find({
  isDeleted: true
})
```

---

## Summary

| Feature | Endpoint | Method | Status |
|---------|----------|--------|--------|
| Star conversation | `/chat/star` | POST | ✅ Implemented |
| Unstar conversation | `/chat/unstar` | POST | ✅ Implemented |
| Block user | `/chat/block-user` | POST | ✅ Implemented |
| Unblock user | `/chat/unblock-user` | POST | ✅ Implemented |
| Get blocked users | `/chat/blocked-users` | GET | ✅ Implemented |
| Delete message | `/chat/message/:id` | DELETE | ✅ Implemented |
| Starred status in list | `/chat/conversations` | GET | ✅ Enhanced |

**All features**:
- ✅ Server-side enforcement
- ✅ Backward compatible
- ✅ Properly indexed
- ✅ Authorization checks
- ✅ Error handling
- ✅ Logging

---

**Next Steps**:
1. Restart the server: `npm run start:dev`
2. Test all endpoints using the test scenarios above
3. Update frontend to use new features
4. Monitor logs for blocking enforcement

**Related Documentation**:
- [Chat Routing Logic](./CHAT_ROUTING_LOGIC.md)
- [User Level Chat Implementation](./USER_LEVEL_CHAT_IMPLEMENTATION.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)
