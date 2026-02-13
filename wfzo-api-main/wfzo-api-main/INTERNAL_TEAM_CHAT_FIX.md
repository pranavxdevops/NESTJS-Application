# Internal Team Chat Fix

## Issue
Users could not chat with secondary users **under the same memberId** (internal team chat).

**Error:**
```json
{
  "code": "ERR_FORBIDDEN",
  "message": "You must be connected with this member to send messages"
}
```

## Root Cause
The authorization check required a **connection** between two members, but:
- Connections are **member-to-member** (external relationships)
- Internal team members share the **same memberId**
- No connection record exists for same memberId

## Solution Applied

### Updated Authorization Logic in `sendMessage()`

**Before:**
```typescript
// Always checked connection - blocked same-member chats
const connected = await this.areMembersConnected(senderId, dto.recipientId);
if (!connected) {
  throw new ForbiddenException('You must be connected with this member to send messages');
}
```

**After:**
```typescript
// Authorization check
if (senderId === dto.recipientId) {
  // Same member - internal team chat
  if (!dto.recipientUserId) {
    throw new BadRequestException('Cannot send message to yourself. Provide recipientUserId to chat with team members.');
  }
  // Allow internal team chat (same memberId, different users)
  if (dto.recipientUserId === senderUserId) {
    throw new BadRequestException('Cannot send message to yourself');
  }
} else {
  // Different members - must be connected
  const connected = await this.areMembersConnected(senderId, dto.recipientId);
  if (!connected) {
    throw new ForbiddenException('You must be connected with this member to send messages');
  }
}
```

## What This Enables

### ✅ Internal Team Chat (NEW)
Chat between users **within the same member organization**:

```json
POST /chat/send
{
  "recipientId": "MEMBER-005",  // ← Same as sender's memberId
  "recipientUserId": "dc8e08a3-ccaf-481f-b6fc-5ec25356b56f",  // ← Required
  "content": "Hello team member!"
}
```

**Requirements:**
- `recipientId` = sender's memberId (same organization)
- `recipientUserId` is **REQUIRED** (cannot be blank)
- Users must be different (cannot message yourself)

### ✅ External Member Chat (Existing)
Chat between **connected members**:

```json
POST /chat/send
{
  "recipientId": "MEMBER-014",  // ← Different memberId
  "content": "Hello connected member!"
}
```

**Requirements:**
- Members must be **connected** (status: accepted)
- This is **Member Chat** (no user IDs stored)

### ✅ External User Chat (Existing)
Chat with specific user at **connected member**:

```json
POST /chat/send
{
  "recipientId": "MEMBER-014",  // ← Different memberId
  "recipientUserId": "xyz-user-id",  // ← Optional, specific user
  "content": "Hello connected member's user!"
}
```

**Requirements:**
- Members must be **connected**
- This is **User Chat** (user IDs stored)

## Authorization Matrix

| Scenario | recipientId | recipientUserId | Authorization Check | Result |
|----------|-------------|-----------------|---------------------|--------|
| **Internal Team Chat** | Same as sender | Required | Same member? | ✅ Allowed |
| **External Member Chat** | Different | Not provided | Connection exists? | ✅ If connected |
| **External User Chat** | Different | Provided | Connection exists? | ✅ If connected |
| **Self Message** | Same as sender | Same as sender | Always blocked | ❌ Error |

## Example: User Achu's Scenarios

**Achu's Profile:**
- memberId: `MEMBER-005`
- userId: `entra-achu-uuid`
- userType: Primary or Secondary

### 1️⃣ Chat with Sreerag (Same Company)

**Sreerag:**
- memberId: `MEMBER-005` (same)
- userId: `dc8e08a3-ccaf-481f-b6fc-5ec25356b56f`

**Request:**
```json
POST /chat/send
{
  "recipientId": "MEMBER-005",
  "recipientUserId": "dc8e08a3-ccaf-481f-b6fc-5ec25356b56f",
  "content": "Hello Sreerag!"
}
```

**✅ Result:** Internal team chat created (no connection check)

### 2️⃣ Chat with Member-014 (Different Company)

**Request:**
```json
POST /chat/send
{
  "recipientId": "MEMBER-014",
  "content": "Hello Member-014!"
}
```

**✅ Result:** If connected → Member Chat created  
**❌ Result:** If not connected → 403 Forbidden

### 3️⃣ Chat with User at Member-014

**Request:**
```json
POST /chat/send
{
  "recipientId": "MEMBER-014",
  "recipientUserId": "user-at-member-014-id",
  "content": "Hello user!"
}
```

**✅ Result:** If connected → User Chat created  
**❌ Result:** If not connected → 403 Forbidden

## Message Storage

### Internal Team Chat
```typescript
{
  senderId: "MEMBER-005",
  recipientId: "MEMBER-005",  // ← Same memberId
  senderUserId: "entra-achu-uuid",  // ← Set
  recipientUserId: "dc8e08a3-ccaf-481f-b6fc-5ec25356b56f",  // ← Set
  content: "Hello Sreerag!"
}
```

### External Member Chat
```typescript
{
  senderId: "MEMBER-005",
  recipientId: "MEMBER-014",  // ← Different memberId
  senderUserId: undefined,  // ← Not set
  recipientUserId: undefined,  // ← Not set
  content: "Hello Member-014!"
}
```

### External User Chat
```typescript
{
  senderId: "MEMBER-005",
  recipientId: "MEMBER-014",  // ← Different memberId
  senderUserId: "entra-achu-uuid",  // ← Set
  recipientUserId: "user-at-member-014-id",  // ← Set
  content: "Hello user!"
}
```

## Conversations API Response

After sending internal team chat, `GET /chat/conversations` will show:

```json
{
  "conversations": [
    {
      "chatType": "user",  // ← User Chat (has userId)
      "member": {
        "memberId": "MEMBER-005",  // ← Same as yours!
        "companyName": "Your Company",
        "logo": "..."
      },
      "user": {
        "userId": "dc8e08a3-ccaf-481f-b6fc-5ec25356b56f",
        "firstName": "Sreerag",
        "lastName": "...",
        "email": "sreerag@yourcompany.com"
      },
      "lastMessage": {
        "content": "Hello Sreerag!",
        "senderId": "MEMBER-005",
        "createdAt": "2026-01-14T12:20:00Z"
      },
      "unreadCount": 0
    }
  ]
}
```

**Key Points:**
- `chatType: "user"` (because user IDs are stored)
- `member.memberId` is **your own memberId** (internal chat)
- `user` object shows **the other team member** you're chatting with

## Testing Checklist

- [x] Primary → Secondary (same member) = ✅ Internal team chat
- [x] Secondary → Primary (same member) = ✅ Internal team chat
- [x] Secondary → Secondary (same member) = ✅ Internal team chat
- [ ] Primary → Primary (same member) = Should require recipientUserId
- [ ] Primary → Primary (different members, connected) = ✅ Member Chat
- [ ] Primary → Primary (different members, not connected) = ❌ 403
- [ ] Any user → Any user (different members, connected) = ✅ User Chat
- [ ] Cannot message yourself (same userId) = ❌ 400

## Files Modified

- `src/modules/chat/chat.service.ts`
  - Updated `sendMessage()` authorization logic
  - Now checks if same member before requiring connection

## No Changes Needed

- `getMessages()` - Already filters by userId fields correctly
- `markAsRead()` - Already uses userId fields correctly
- `getConversations()` - Already groups by memberId + userId
- Message schema - Already has all required fields

## Summary

**Before:** Could only chat with users at **connected member organizations**  
**After:** Can chat with users at:
1. ✅ **Same member organization** (internal team)
2. ✅ **Connected member organizations** (external)

**Key Rule:** 
- Same memberId? → Allow (internal team)
- Different memberId? → Check connection (external)
