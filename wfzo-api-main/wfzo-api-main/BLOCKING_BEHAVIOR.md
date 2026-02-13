# Block User - Updated Behavior

**Date**: January 20, 2026  
**Status**: ✅ Updated - Bidirectional Blocking

---

## How Blocking Works Now

### Bidirectional Blocking

When **User A blocks User B**:

1. ❌ **User A cannot send messages to User B** (403 error)
2. ❌ **User B cannot send messages to User A** (403 error)
3. ✅ **Both users see blocking indicator in conversation list**
4. ✅ **Chat history is preserved and visible to both**
5. ✅ **Messages are stored in DB but don't reach the blocked user**

---

## API Response - Conversation List

### NEW: `blockStatus` Field

`GET /chat/conversations` now includes blocking information:

```json
{
  "success": true,
  "data": [
    {
      "chatType": "user",
      "isStarred": false,
      "blockStatus": {
        "isBlocked": true,         // True if either user blocked the other
        "iBlockedThem": true,       // True if current user blocked the other
        "theyBlockedMe": false      // True if other user blocked current user
      },
      "member": { ... },
      "user": { ... },
      "lastMessage": { ... },
      "unreadCount": 2
    }
  ]
}
```

**For Member Chat**: `blockStatus` is `null` (blocking only applies to User Chat)

---

## API Response - Messages List

### NEW: `blockStatus` Field

`GET /chat/messages` also includes blocking information:

```json
{
  "success": true,
  "data": [
    {
      "_id": "msg1",
      "content": "Hello",
      "senderId": "MEMBER-001",
      "senderUserId": "user-123",
      "recipientId": "MEMBER-002",
      "recipientUserId": "user-456",
      "createdAt": "2026-01-20T10:00:00Z",
      "isRead": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 42,
    "hasMore": false
  },
  "blockStatus": {
    "isBlocked": true,
    "iBlockedThem": false,
    "theyBlockedMe": true
  }
}
```

**For Member Chat**: `blockStatus` is `null`

**Use this to:**
- Disable message input field
- Show "You are blocked" notice
- Display "Unblock" button if `iBlockedThem: true`

---

## Blocking Scenarios

### Scenario 1: User A Blocks User B

**User A's perspective:**
```json
{
  "blockStatus": {
    "isBlocked": true,
    "iBlockedThem": true,      // ← I blocked them
    "theyBlockedMe": false
  }
}
```

**User B's perspective:**
```json
{
  "blockStatus": {
    "isBlocked": true,
    "iBlockedThem": false,
    "theyBlockedMe": true       // ← They blocked me
  }
}
```

### Scenario 2: Both Users Block Each Other

**Both users see:**
```json
{
  "blockStatus": {
    "isBlocked": true,
    "iBlockedThem": true,       // ← Mutual block
    "theyBlockedMe": true
  }
}
```

### Scenario 3: No Blocking

```json
{
  "blockStatus": {
    "isBlocked": false,
    "iBlockedThem": false,
    "theyBlockedMe": false
  }
}
```

---

## Message Sending Behavior

### When User A has blocked User B:

#### User A tries to send to User B:
```bash
POST /chat/send
{
  "recipientId": "MEMBER-B",
  "recipientUserId": "user-B",
  "content": "Hello"
}
```
**Response**: `403 Forbidden`
```json
{
  "statusCode": 403,
  "message": "You cannot send messages to this user. They have blocked you.",
  "error": "Forbidden"
}
```

#### User B tries to send to User A:
```bash
POST /chat/send
{
  "recipientId": "MEMBER-A",
  "recipientUserId": "user-A",
  "content": "Hello"
}
```
**Response**: `403 Forbidden`
```json
{
  "statusCode": 403,
  "message": "You cannot send messages to this user. They have blocked you.",
  "error": "Forbidden"
}
```

---

## Frontend Implementation

### 1. Show Blocking Indicator in Conversation List

```jsx
function ConversationItem({ conversation }) {
  const { blockStatus } = conversation;
  
  // Determine blocking display
  let blockIndicator = null;
  if (blockStatus?.isBlocked) {
    if (blockStatus.iBlockedThem && blockStatus.theyBlockedMe) {
      blockIndicator = <span className="block-badge mutual">🚫 Mutual Block</span>;
    } else if (blockStatus.iBlockedThem) {
      blockIndicator = <span className="block-badge">🚫 Blocked</span>;
    } else if (blockStatus.theyBlockedMe) {
      blockIndicator = <span className="block-badge warning">⚠️ You are blocked</span>;
    }
  }
  
  return (
    <div className="conversation-item">
      <div className="conversation-header">
        <h3>{conversation.member.companyName}</h3>
        {blockIndicator}
      </div>
      {/* Rest of conversation UI */}
    </div>
  );
}
```

### 2. Get Blocking Status from Messages Endpoint

**Option A: Use blockStatus from GET /chat/messages response**

This is the **recommended approach** when user opens a chat view:

```jsx
function ChatView({ otherMemberId, otherUserId }) {
  const [messages, setMessages] = useState([]);
  const [blockStatus, setBlockStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/wfzo/api/v1/chat/messages?otherMemberId=${otherMemberId}&otherUserId=${otherUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.data);
        setBlockStatus(data.blockStatus);  // ← Available here!
        setLoading(false);
      });
  }, [otherMemberId, otherUserId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="chat-view">
      <ChatHeader blockStatus={blockStatus} />
      <MessageList messages={messages} />
      <MessageInput blockStatus={blockStatus} />
    </div>
  );
}
```

**Option B: Use blockStatus from conversation object (passed from list)**

If you already have the conversation object from the conversations list:

```jsx
function ChatView({ conversation }) {
  const [messages, setMessages] = useState([]);
  
  // Use blockStatus from conversation prop
  const blockStatus = conversation.blockStatus;
  
  useEffect(() => {
    fetch(`/wfzo/api/v1/chat/messages?otherMemberId=${conversation.member.memberId}&otherUserId=${conversation.user?.userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data.data));
  }, [conversation]);
  
  return (
    <div className="chat-view">
      <ChatHeader blockStatus={blockStatus} />
      <MessageList messages={messages} />
      <MessageInput blockStatus={blockStatus} />
    </div>
  );
}
```

### 3. Disable Message Input Based on Block Status

```jsx
function MessageInput({ blockStatus }) {
  const [message, setMessage] = useState('');
  
  const isBlocked = blockStatus?.isBlocked;
  const iBlockedThem = blockStatus?.iBlockedThem;
  const theyBlockedMe = blockStatus?.theyBlockedMe;
  
  if (isBlocked) {
    return (
      <div className="blocked-notice">
        {iBlockedThem && (
          <div className="i-blocked">
            <p>🚫 You have blocked this user</p>
            <button onClick={handleUnblock} className="unblock-btn">
              Unblock to send messages
            </button>
          </div>
        )}
        {theyBlockedMe && !iBlockedThem && (
          <div className="they-blocked">
            <p>⚠️ This user has blocked you. You cannot send messages.</p>
          </div>
        )}
        {iBlockedThem && theyBlockedMe && (
          <div className="mutual-block">
            <p>🚫 Mutual block - Neither can send messages</p>
            <button onClick={handleUnblock} className="unblock-btn">
              Unblock
            </button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="message-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### 4. Show Blocking Header in Chat View

```jsx
function ChatHeader({ blockStatus, otherUser }) {
  const handleUnblock = async () => {
    await fetch('/wfzo/api/v1/chat/unblock-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ blockedUserId: otherUser.userId })
    });
    
    // Refresh chat view
    window.location.reload();
  };
  
  return (
    <div className="chat-header">
      <div className="user-info">
        <img src={otherUser.profileImageUrl} alt={otherUser.firstName} />
        <h2>{otherUser.firstName} {otherUser.lastName}</h2>
      </div>
      
      {blockStatus?.isBlocked && (
        <div className="block-indicator">
          {blockStatus.iBlockedThem && (
            <span className="badge blocked">Blocked</span>
          )}
          {blockStatus.theyBlockedMe && (
            <span className="badge warning">Blocked you</span>
          )}
        </div>
      )}
      
      <div className="actions">
        {blockStatus?.iBlockedThem && (
          <button onClick={handleUnblock} className="unblock-btn">
            Unblock User
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## TypeScript Types Update

```typescript
interface BlockStatus {
  isBlocked: boolean;      // True if either blocked
  iBlockedThem: boolean;   // True if current user blocked the other
  theyBlockedMe: boolean;  // True if other user blocked current user
}

interface Conversation {
  chatType: 'member' | 'user';
  isStarred: boolean;
  blockStatus: BlockStatus | null;  // ← NEW (null for Member Chat)
  member: {
    _id: string;
    memberId: string;
    companyName: string;
    logo?: string;
    address: {
      city?: string;
      country?: string;
    };
  };
  user?: {
    userId: string;
    firstName?: string;
    lastName?: string;
    email: string;
    userType: 'Primary' | 'Secondary';
    profileImageUrl?: string;
  };
  lastMessage: {
    content: string;
    senderId: string;
    senderUserId?: string;
    recipientId: string;
    recipientUserId?: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}
```

---

## CSS Styling Examples

```css
/* Blocking indicator badges */
.block-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.block-badge {
  background: #f44336;
  color: white;
}

.block-badge.warning {
  background: #ff9800;
  color: white;
}

.block-badge.mutual {
  background: #9c27b0;
  color: white;
}

/* Blocked conversation styling */
.conversation-item.blocked {
  opacity: 0.7;
  border-left: 3px solid #f44336;
}

/* Blocked notice in chat view */
.blocked-notice {
  padding: 16px;
  background: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 8px;
  text-align: center;
  color: #e65100;
}
```

---

## Testing Scenarios

### Test 1: Block User
```bash
# User A blocks User B
curl -X POST /chat/block-user \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"blockedUserId":"user-B","blockedMemberId":"MEMBER-B"}'

# User A tries to send (should fail)
curl -X POST /chat/send \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"recipientId":"MEMBER-B","recipientUserId":"user-B","content":"Test"}'
# Expected: 403 Forbidden

# User B tries to send (should fail)
curl -X POST /chat/send \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -d '{"recipientId":"MEMBER-A","recipientUserId":"user-A","content":"Test"}'
# Expected: 403 Forbidden
```

### Test 2: Check Blocking Status in Conversations
```bash
# User A gets conversations
curl -X GET /chat/conversations \
  -H "Authorization: Bearer $USER_A_TOKEN"
# Expected: blockStatus.iBlockedThem = true

# User B gets conversations
curl -X GET /chat/conversations \
  -H "Authorization: Bearer $USER_B_TOKEN"
# Expected: blockStatus.theyBlockedMe = true
```

### Test 3: Unblock and Resume Chat
```bash
# User A unblocks User B
curl -X POST /chat/unblock-user \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"blockedUserId":"user-B"}'

# Both can send messages again
curl -X POST /chat/send \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"recipientId":"MEMBER-B","recipientUserId":"user-B","content":"Test"}'
# Expected: 201 Success
```

---

## Summary

| Aspect | Behavior |
|--------|----------|
| **Blocking Type** | Bidirectional |
| **Message Sending** | Both blocked users get 403 error |
| **Chat History** | Preserved and visible |
| **Conversation List** | Shows `blockStatus` with detailed info |
| **Unblocking** | Only blocker can unblock |
| **UI Indicator** | Visual badge showing block status |
| **Member Chat** | Not affected by user blocking |

---

**All changes are backward compatible!** Frontend can still ignore `blockStatus` if not implementing the UI.
