# Email Notifications for Chat Messages

## Overview

Email notifications are automatically sent when users **start a new chat conversation**. The system sends an email **only for the first message** in a new conversation, not for subsequent messages in the same chat.

## Features

✅ **New Chat Detection**: Emails sent only for the first message in a conversation  
✅ **Prevents Email Spam**: No emails for follow-up messages in existing chats  
✅ **Non-Blocking**: Email failures don't prevent message delivery  
✅ **Message Preview**: Shows first 100 characters or file type indicator  
✅ **Beautiful HTML Templates**: Professional email design with gradient styling  
✅ **Smart Routing**: Different templates for User Chat vs Member Chat  

## Email Templates

### 1. NEW_CHAT_MESSAGE (User Chat)
**Used when**: A user starts a new chat with another user (first message only)

**Recipients**: The specific user who received the first message

**Parameters**:
- `recipientName`: Recipient's full name
- `senderName`: Sender's full name  
- `senderCompany`: Sender's company name
- `messagePreview`: First 100 chars of text or file indicator
- `chatUrl`: Link to chat interface

**Example**:
```
Subject: New chat from John Doe
Body: You have received a new message from John Doe at Acme Corporation...
```

### 2. NEW_CHAT_MESSAGE_MEMBER (Member Chat)
**Used when**: A member starts a new chat with another member (first message only)

**Recipients**: Primary user of the receiving member

**Parameters**:
- `recipientName`: Recipient's full name
- `senderCompany`: Sender's company name
- `messagePreview`: First 100 chars of text or file indicator
- `chatUrl`: Link to chat interface

**Example**:
```
Subject: New chat from Acme Corporation
Body: You have received a new message from Acme Corporation...
```

## Message Preview Logic

The system automatically formats message previews based on message type:

- **Text Messages**: First 100 characters (truncated with "..." if longer)
- **Images**: "📷 Sent an image"
- **Documents**: "📎 Sent a document"

## Setup

### 1. Email Templates Created
Run the migration script to create email templates:

```bash
npx ts-node scripts/migrations/create-chat-email-templates.ts
```

### 2. Verify Templates
Check that templates exist in database:

```bash
mongosh $MONGODB_URI --eval "db.emailtemplates.find({templateCode: {\$in: ['NEW_CHAT_MESSAGE', 'NEW_CHAT_MESSAGE_MEMBER']}}).pretty()"
```

### 3. Environment Variables
Ensure Azure Communication Services is configured in `.env`:

```env
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...
AZURE_COMMUNICATION_SENDER_EMAIL=noreply@yourdomain.com
```

## Implementation Details

### Code Location
- **Service**: `src/modules/chat/chat.service.ts`
- **Methods**: 
  - `sendNewMessageEmail()` - Main email sending logic
  - `getMessagePreview()` - Format message preview
- **Trigger**: Called in `sendMessage()` after message is saved

### Email Sending Flow

1. **Message Sent** → `sendMessage()` saves message to database
2. **New Chat Check** → Count previous messages between the two parties
3. **First Message Detection** → If count = 0, this is a new chat
4. **Email Trigger** → Only triggered for new chats (first message)
5. **Recipient Lookup** → Extract email from `userSnapshots`
6. **Template Selection** → Choose based on `isUserChat` flag
7. **Email Dispatch** → `emailService.sendTemplatedEmail()` sends email
8. **Error Handling** → Failures logged but don't block message sending

**Important**: Subsequent messages in the same conversation do NOT trigger emails.

### New Chat Detection Logic

The system determines if a chat is new by counting previous messages:

```typescript
// Count all messages between sender and recipient (bidirectional)
const previousMessageCount = await this.messageModel.countDocuments({
  $or: [
    { senderId: A, recipientId: B },  // A → B
    { senderId: B, recipientId: A }   // B → A
  ],
  _id: { $ne: currentMessageId } // Exclude current message
});

const isNewChat = previousMessageCount === 0;
// Email sent only when isNewChat === true
```

**Example Scenarios**:

1. **First message from A to B**: Email sent ✅
2. **B replies to A**: No email (existing chat) ❌
3. **A sends another message**: No email (existing chat) ❌
4. **C sends first message to A**: Email sent ✅ (new chat with C)

### Fire-and-Forget Pattern

```typescript
// Only send email for new chats (first message)
const isNewChat = previousMessageCount === 0;

if (isNewChat) {
  // Email sent asynchronously - doesn't block message sending
  this.sendNewMessageEmail(/* params */)
    .catch(error => {
      // Log error but don't throw
      this.logger.error(`Failed to send email notification: ${errorMessage}`);
    });
} else {
  this.logger.log('Existing chat - skipping email notification');
}
```

## Testing

### 1. Send a Test Message

```bash
curl -X POST http://localhost:3001/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "MEMBER-016",
    "recipientUserId": "6052d5b4-663a-447a-a203-c2adbd24b61c",
    "content": "Test message for email notification",
    "type": "text"
  }'
```

### 2. Check Server Logs

Look for these log entries:

```
✅ New Chat (Email Sent):
[User Chat] Message sent from user X to user Y, type: text
[User Chat] New chat detected - sending email notification
[EmailService] Sending email using template NEW_CHAT_MESSAGE to recipient@email.com
[EmailService] Email sent successfully to recipient@email.com

❌ Existing Chat (No Email):
[User Chat] Message sent from user X to user Y, type: text
[User Chat] Existing chat - skipping email notification

⚠️ Email Failure:
[User Chat] New chat detected - sending email notification
[ChatService] Failed to send email notification: <error details>
```

### 3. Verify Email Delivery

- Check recipient's inbox (including spam folder)
- Verify email contains correct sender information
- Check message preview is formatted correctly
- Click "View Message" button to ensure link works

## Troubleshooting

### Email Not Sent

**Check 1: Template Exists**
```bash
mongosh $MONGODB_URI --eval "db.emailtemplates.countDocuments({templateCode: 'NEW_CHAT_MESSAGE'})"
```
Expected: `1` or more

**Check 2: Recipient Has Email**
```javascript
// In member document, verify userSnapshots contain email
{
  userSnapshots: [
    {
      id: "user-id",
      email: "user@example.com", // Must exist
      firstName: "John",
      lastName: "Doe"
    }
  ]
}
```

**Check 3: Azure Communication Service Configured**
```bash
echo $AZURE_COMMUNICATION_CONNECTION_STRING
echo $AZURE_COMMUNICATION_SENDER_EMAIL
```

**Check 4: Server Logs**
```bash
tail -f /tmp/nestjs-*.log | grep -i "email"
```

### Email Sent But Not Received

1. **Check spam folder**
2. **Verify sender email is not blocked**
3. **Check Azure Communication Service logs** in Azure Portal
4. **Verify recipient email is valid**

### Template Errors

If you see `Email template with code NEW_CHAT_MESSAGE not found`:

1. Run migration script again
2. Verify database connection
3. Check template `isActive` is `true`

## Email Template Management

### Update Template Content

```javascript
// Update email template in database
db.emailtemplates.updateOne(
  { templateCode: 'NEW_CHAT_MESSAGE' },
  { 
    $set: { 
      'translations.0.subject': 'New subject line',
      'translations.0.htmlBody': '<html>...</html>',
      updatedAt: new Date()
    } 
  }
)
```

### Add New Language Translation

```javascript
db.emailtemplates.updateOne(
  { templateCode: 'NEW_CHAT_MESSAGE' },
  { 
    $push: { 
      translations: {
        language: 'de',
        subject: 'Neue Nachricht von {{senderName}}',
        htmlBody: '<html>...</html>',
        textBody: 'Neue Nachricht...'
      }
    } 
  }
)
```

### Disable Email Notifications

```javascript
// Temporarily disable without deleting
db.emailtemplates.updateMany(
  { templateCode: { $in: ['NEW_CHAT_MESSAGE', 'NEW_CHAT_MESSAGE_MEMBER'] } },
  { $set: { isActive: false } }
)
```

## Performance Considerations

- **Async Processing**: Emails sent asynchronously to avoid blocking chat
- **Error Isolation**: Email failures don't affect message delivery
- **Logging**: All email attempts logged for debugging
- **No Retries**: Failed emails are not retried automatically

## Future Enhancements

Potential improvements for the email notification system:

- [ ] Email preferences per user (opt-in/opt-out)
- [ ] Digest emails (batch multiple messages)
- [ ] Push notifications instead of/in addition to email
- [ ] Email delivery tracking and analytics
- [ ] Retry mechanism for failed emails
- [ ] Support for additional languages
- [ ] Custom email templates per organization

## Related Documentation

- [CHAT_ADVANCED_FEATURES.md](./CHAT_ADVANCED_FEATURES.md) - All chat features
- [CHAT_API_REFERENCE.md](./CHAT_API_REFERENCE.md) - API endpoints
- [Email Service](./src/shared/email/email.service.ts) - Core email functionality

## Support

For issues with email notifications:

1. Check server logs for errors
2. Verify email templates exist in database
3. Ensure Azure Communication Service is configured
4. Test with different recipient email addresses
5. Check Azure Communication Service delivery logs

---

**Last Updated**: January 20, 2026  
**Status**: ✅ Implemented and Tested
