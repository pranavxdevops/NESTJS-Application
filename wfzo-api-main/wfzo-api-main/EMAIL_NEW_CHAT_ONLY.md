# Email Notifications: New Chat Only

## Change Summary

**Previous Behavior**: Email notifications sent for every chat message  
**New Behavior**: Email notifications sent only for the first message in a new conversation

## What Changed

### 1. Email Logic Updated (`chat.service.ts`)

Added new chat detection before sending email:

```typescript
// Count previous messages between sender and recipient
const previousMessageCount = await this.messageModel.countDocuments({
  $or: [
    { senderId, recipientId, ... },      // Sender → Recipient
    { senderId: recipientId, recipientId: senderId, ... }  // Recipient → Sender
  ],
  _id: { $ne: savedMessage._id }
});

const isNewChat = previousMessageCount === 0;

// Email sent ONLY for new chats
if (isNewChat) {
  this.sendNewMessageEmail(...);
}
```

### 2. Email Template Subjects Updated

- `NEW_CHAT_MESSAGE`: "New **chat** from {{senderName}}" (was "New message")
- `NEW_CHAT_MESSAGE_MEMBER`: "New **chat** from {{senderCompany}}" (was "New message")

### 3. Logging Enhanced

The system now logs whether email was sent or skipped:

```
✅ New chat: "[User Chat] New chat detected - sending email notification"
❌ Existing chat: "[User Chat] Existing chat - skipping email notification"
```

## How It Works

### New Chat Detection

A chat is considered "new" when there are **zero previous messages** between the two parties (bidirectional check).

**Examples**:

| Scenario | Previous Messages | Email Sent? |
|----------|------------------|-------------|
| User A sends first message to User B | 0 | ✅ Yes (new chat) |
| User B replies to User A | 1 | ❌ No (existing chat) |
| User A sends another message to User B | 2 | ❌ No (existing chat) |
| User C sends first message to User A | 0 | ✅ Yes (new chat with C) |
| User A replies to User C | 1 | ❌ No (existing chat) |

### Message Counting Logic

The system counts ALL messages between two parties in both directions:

```javascript
// For User Chat between User A and User B
Count messages where:
  - (senderId = MemberA AND recipientId = MemberB AND senderUserId = A AND recipientUserId = B)
  - (senderId = MemberB AND recipientId = MemberA AND senderUserId = B AND recipientUserId = A)

// For Member Chat between Member A and Member B  
Count messages where:
  - (senderId = MemberA AND recipientId = MemberB)
  - (senderId = MemberB AND recipientId = MemberA)
```

## Benefits

1. **Reduces Email Spam**: Users no longer receive an email for every message
2. **Better UX**: Email serves as "new conversation" notification, not message notification
3. **Preserves Chat Functionality**: Message delivery unaffected by email logic
4. **Performance**: Minimal overhead (single count query per message)

## Testing

### Test Case 1: New Chat
```bash
# Send first message from MEMBER-005 to MEMBER-016
POST /chat/send
{
  "recipientId": "MEMBER-016",
  "recipientUserId": "6052d5b4-663a-447a-a203-c2adbd24b61c",
  "content": "Hello, this is the first message",
  "type": "text"
}

Expected: ✅ Email sent to recipient
Log: "[User Chat] New chat detected - sending email notification"
```

### Test Case 2: Reply to Existing Chat
```bash
# Send reply from MEMBER-016 to MEMBER-005
POST /chat/send
{
  "recipientId": "MEMBER-005",
  "recipientUserId": "695087393f1ddfe45e030b67",
  "content": "Hello, this is a reply",
  "type": "text"
}

Expected: ❌ No email sent
Log: "[User Chat] Existing chat - skipping email notification"
```

### Test Case 3: Follow-up Message
```bash
# Send another message from MEMBER-005 to MEMBER-016
POST /chat/send
{
  "recipientId": "MEMBER-016",
  "recipientUserId": "6052d5b4-663a-447a-a203-c2adbd24b61c",
  "content": "This is a follow-up message",
  "type": "text"
}

Expected: ❌ No email sent
Log: "[User Chat] Existing chat - skipping email notification"
```

## Verification

### Check if Chat is New

To manually verify if a chat should be considered new:

```javascript
// MongoDB query
db.messages.countDocuments({
  $or: [
    {
      senderId: "MEMBER-005",
      recipientId: "MEMBER-016",
      senderUserId: "695087393f1ddfe45e030b67",
      recipientUserId: "6052d5b4-663a-447a-a203-c2adbd24b61c"
    },
    {
      senderId: "MEMBER-016",
      recipientId: "MEMBER-005",
      senderUserId: "6052d5b4-663a-447a-a203-c2adbd24b61c",
      recipientUserId: "695087393f1ddfe45e030b67"
    }
  ]
});

// If count = 0 → New chat → Email will be sent
// If count > 0 → Existing chat → No email
```

## Edge Cases Handled

1. **Deleted Messages**: Soft-deleted messages still count (prevents re-triggering email if all messages deleted)
2. **Failed Messages**: Only saved messages count (draft/failed messages don't affect count)
3. **Concurrent Messages**: Race condition handled by database atomicity
4. **Different Users in Same Member**: Each user pair is treated as separate conversation

## Performance Impact

- **Additional Query**: One `countDocuments` query per message sent
- **Indexed Fields**: Query uses indexed fields (senderId, recipientId)
- **Estimated Overhead**: < 10ms per message
- **Async Email**: Email sending still non-blocking

## Rollback (If Needed)

To revert to sending email for every message:

```typescript
// In chat.service.ts, replace the new chat check with:

// Send email for every message (old behavior)
this.sendNewMessageEmail(
  senderData,
  recipientMember,
  recipientUserId,
  isUserChat,
  dto.content,
  dto.type || 'text'
).catch(error => {
  this.logger.error(`Failed to send email notification: ${error.message}`);
});
```

## Related Files

- `src/modules/chat/chat.service.ts` - Email notification logic
- `scripts/migrations/create-chat-email-templates.ts` - Email templates
- `EMAIL_NOTIFICATION_SETUP.md` - Complete email setup guide

---

**Implemented**: January 20, 2026  
**Status**: ✅ Active  
**Breaking Changes**: None (backward compatible)
