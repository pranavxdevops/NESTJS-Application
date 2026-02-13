# Silent Block Implementation

## Overview
The chat system implements a **silent block** mechanism where blocking is unidirectional and transparent to the blocked user. This provides a non-confrontational way for users to stop receiving unwanted messages.

## Behavior Definition

### 1. When User A Blocks User B

**What User B Can Do:**
- ✅ User B CAN send messages to User A
- ✅ Messages are saved successfully in the database
- ✅ User B sees all their sent messages in their own chat history
- ✅ No error or feedback that they have been blocked

**What Happens to Messages:**
- ❌ Messages are NOT delivered to User A
- ❌ Messages do NOT appear in User A's inbox
- ❌ Messages do NOT appear in User A's conversation list
- ❌ Messages do NOT appear in User A's message history
- ❌ No email notifications are sent to User A

**Database Storage:**
```typescript
{
  senderId: "MEMBER-B",
  senderUserId: "user-b-id",
  recipientId: "MEMBER-A",
  recipientUserId: "user-a-id",
  content: "Hello...",
  isBlockedMessage: true,        // Marked as blocked
  blockedAt: "2026-01-21T...",   // Timestamp when blocked
  createdAt: "2026-01-21T...",
  isRead: false
}
```

### 2. Message Persistence Rules

**While Block is Active:**
- Messages sent by blocked user are stored with `isBlockedMessage: true`
- Messages remain in blocked state permanently
- Only the sender (blocked user) can see these messages

**When User A Unblocks User B:**
- ❌ Previously blocked messages are NEVER retroactively delivered
- ❌ Previously blocked messages NEVER appear in User A's history
- ✅ Only NEW messages sent AFTER unblock are delivered normally
- ✅ New messages after unblock have `isBlockedMessage: false`

### 3. Silent Block Characteristics

**No Notification to Blocked User:**
- No error message when sending
- No indication that recipient has blocked them
- Messages appear normal in sender's view
- Sender sees all messages they sent (including blocked ones)

**Recipient Experience:**
- Clean inbox, no blocked messages visible
- Blocked messages don't affect unread counts
- Blocked messages don't create conversations
- Complete silence from blocked user

## Technical Implementation

### Message Schema Changes

```typescript
@Schema({ timestamps: true })
export class Message {
  // ... existing fields ...
  
  @Prop({ type: Boolean, default: false })
  isBlockedMessage!: boolean; // True if sent while recipient had blocked sender
  
  @Prop({ type: Date })
  blockedAt?: Date; // Timestamp when message was marked as blocked
}
```

**Indexes Added:**
```typescript
MessageSchema.index({ isBlockedMessage: 1 });
MessageSchema.index({ recipientId: 1, recipientUserId: 1, isBlockedMessage: 1 });
```

### Send Message Flow

```typescript
// When sending a message
if (isUserChat && recipientUserId) {
  // Check if recipient has blocked sender (one-way check)
  const recipientBlockedSender = await this.isBlockedByUser(senderUserId, recipientUserId);
  
  if (recipientBlockedSender) {
    isBlockedMessage = true; // Mark but don't prevent sending
  }
}

// Save message with blocked status
const message = new this.messageModel({
  // ... other fields ...
  isBlockedMessage,
  blockedAt: isBlockedMessage ? new Date() : undefined,
});
```

### Get Messages Flow

```typescript
// Recipient's view filters out blocked messages
$match: {
  isDeleted: { $ne: true },
  $or: [
    // Show all messages where current user is sender (including blocked)
    { senderId: currentMemberId, senderUserId: currentUserId },
    // Show messages where current user is recipient BUT exclude blocked
    { 
      recipientId: currentMemberId, 
      recipientUserId: currentUserId,
      isBlockedMessage: { $ne: true }  // Filter out blocked messages
    }
  ]
}
```

### Get Conversations Flow

```typescript
// Conversations aggregation excludes blocked messages for recipient
$match: {
  isDeleted: { $ne: true },
  $or: [
    // Messages sent by current user (show all, including blocked ones they sent)
    { senderId: currentMemberId, senderUserId: currentUserId },
    // Messages received by current user (exclude blocked messages)
    { 
      recipientId: currentMemberId, 
      recipientUserId: currentUserId,
      isBlockedMessage: { $ne: true }
    },
  ]
}

// Unread count excludes blocked messages
unreadCount: {
  $sum: {
    $cond: [
      {
        $and: [
          { $eq: ['$recipientId', currentMemberId] },
          { $eq: ['$recipientUserId', currentUserId] },
          { $eq: ['$isRead', false] },
          { $ne: ['$isBlockedMessage', true] }, // Don't count blocked
        ],
      },
      1,
      0,
    ],
  },
}
```

### Email Notifications

```typescript
// Only send email for new chats AND if message is not blocked
if (isNewChat && !isBlockedMessage) {
  this.sendNewMessageEmail(...);
} else if (isBlockedMessage) {
  this.logger.log('Message blocked - skipping email notification');
}
```

## User Experience Examples

### Example 1: Active Block

**Setup:**
- User A (Primary user of Member A) blocks User B (Primary user of Member B)
- Block is active

**User B sends message "Hi there!":**

**User B's View (Sender):**
```
Chat with User A:
[10:30 AM] Hi there!  ✓ Sent
```

**User A's View (Recipient/Blocker):**
```
(No messages visible)
(No conversation appears)
(No unread count)
(No email notification)
```

**Database:**
```json
{
  "senderId": "MEMBER-B",
  "senderUserId": "user-b-id",
  "recipientId": "MEMBER-A",
  "recipientUserId": "user-a-id",
  "content": "Hi there!",
  "isBlockedMessage": true,
  "blockedAt": "2026-01-21T10:30:00Z"
}
```

### Example 2: After Unblock

**Setup:**
- User A had blocked User B
- While blocked, User B sent 5 messages
- User A unblocks User B on Jan 22

**What Happens:**
- ❌ The 5 previous messages remain `isBlockedMessage: true`
- ❌ User A never sees those 5 messages
- ❌ Messages are not retroactively delivered
- ✅ New messages sent after Jan 22 are delivered normally
- ✅ New messages have `isBlockedMessage: false`

**Timeline:**
```
Jan 20: User A blocks User B
Jan 20: User B sends "Message 1" [BLOCKED, User A never sees it]
Jan 21: User B sends "Message 2" [BLOCKED, User A never sees it]
Jan 21: User B sends "Message 3" [BLOCKED, User A never sees it]
Jan 22: User A unblocks User B
Jan 22: User B sends "Message 4" [DELIVERED, User A sees it]
Jan 23: User B sends "Message 5" [DELIVERED, User A sees it]
```

**User A's View After Unblock:**
```
Chat with User B:
[Jan 22, 3:00 PM] Message 4
[Jan 23, 9:00 AM] Message 5
```

**User B's View:**
```
Chat with User A:
[Jan 20, 10:00 AM] Message 1 ✓
[Jan 21, 11:30 AM] Message 2 ✓
[Jan 21, 2:00 PM] Message 3 ✓
[Jan 22, 3:00 PM] Message 4 ✓
[Jan 23, 9:00 AM] Message 5 ✓
```

## Key Differences from Hard Block

| Feature | Silent Block (Implemented) | Hard Block |
|---------|---------------------------|------------|
| Can blocked user send? | ✅ Yes | ❌ No |
| Sender gets error? | ❌ No | ✅ Yes |
| Message saved? | ✅ Yes (with flag) | ❌ No |
| Visible to sender? | ✅ Yes | ❌ No |
| Visible to recipient? | ❌ Never | N/A |
| Retroactive delivery? | ❌ Never | N/A |
| Email notification? | ❌ No | N/A |

## Migration

Run the migration to add fields to existing messages:

```bash
# Add isBlockedMessage and blockedAt fields to all existing messages
# All existing messages will have isBlockedMessage: false
npm run migration:run
```

**Migration File:** `src/database/migrations/007-add-blocked-message-fields.migration.ts`

**What it does:**
1. Adds `isBlockedMessage: false` to all existing messages
2. Creates indexes for efficient querying
3. Supports rollback if needed

## API Impact

### No Changes to Public API

The silent block is completely transparent:
- ✅ POST `/chat/messages` - Still accepts messages (no error)
- ✅ GET `/chat/messages` - Filters blocked messages for recipient
- ✅ GET `/chat/conversations` - Excludes conversations with only blocked messages
- ✅ All existing block/unblock endpoints work as before

### Response Format Unchanged

Messages still return the same structure:
```typescript
{
  id: "msg-123",
  senderId: "MEMBER-B",
  recipientId: "MEMBER-A",
  content: "Hello",
  // isBlockedMessage is NOT exposed in API response
  createdAt: "2026-01-21T10:00:00Z"
}
```

## Testing Scenarios

### Test 1: Send While Blocked
1. User A blocks User B
2. User B sends message
3. ✅ Message saved with `isBlockedMessage: true`
4. ✅ User B sees message in their history
5. ❌ User A does NOT see message
6. ❌ User A gets NO notification

### Test 2: Unblock Doesn't Deliver Old Messages
1. User A blocks User B
2. User B sends 3 messages (all blocked)
3. User A unblocks User B
4. ❌ User A still doesn't see the 3 messages
5. User B sends new message
6. ✅ User A sees only the new message

### Test 3: Conversation List
1. User A blocks User B
2. User B sends message
3. ❌ Conversation does NOT appear in User A's list
4. ✅ Conversation DOES appear in User B's list

### Test 4: Unread Count
1. User A blocks User B
2. User B sends 5 messages
3. ❌ User A's unread count remains 0
4. ✅ User B sees 5 unread (from their own perspective)

## Compatibility

### Member Chat
- ❌ Silent block ONLY applies to User Chat (with userIds)
- ✅ Member Chat (Primary-to-Primary without userIds) unchanged
- ✅ No blocking mechanism for Member Chat

### Internal Team Chat
- ❌ Silent block applies to Internal Team Chat
- ✅ Team members can block each other
- ✅ Same silent block rules apply

## Logging

The system logs blocked message activity:

```
[User Chat] Silent block: Message from user-b-id to user-a-id will be marked as blocked
[User Chat] Message sent from user user-b-id to user user-a-id, type: text [BLOCKED - NOT DELIVERED]
[User Chat] Message blocked - skipping email notification
```

## Summary

This implementation provides:
- ✅ **Privacy**: Recipient doesn't see unwanted messages
- ✅ **No confrontation**: Blocked user doesn't know they're blocked  
- ✅ **Permanent block**: Messages stay blocked even after unblock
- ✅ **Clean experience**: No clutter, no notifications, no unread counts
- ✅ **Complete transparency**: Works silently in the background
- ✅ **No API changes**: Fully backward compatible
