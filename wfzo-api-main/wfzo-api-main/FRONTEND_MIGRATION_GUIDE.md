# Frontend Migration Guide - Chat Advanced Features

**Target**: Frontend Team  
**Impact**: Low (Optional enhancements, fully backward compatible)  
**Effort**: Medium (New UI components needed)

---

## What's New?

Three new feature sets are available:

1. **Star/Unstar Conversations** - Mark important chats as favorites
2. **Block User** - Block specific users from messaging you
3. **Delete Message** - Remove sent messages from view

**All features are optional** - your existing chat UI will continue to work unchanged.

---

## Breaking Changes

### ❌ NONE

All existing endpoints return the same data structure with optional additions.

---

## Optional Enhancements

### 1. Star/Unstar Conversations

#### Backend Changes
- `GET /chat/conversations` now includes `isStarred: boolean` in each conversation

#### Frontend Implementation

**Before**:
```typescript
interface Conversation {
  chatType: 'member' | 'user';
  member: {...};
  user?: {...};
  lastMessage: {...};
  unreadCount: number;
}
```

**After**:
```typescript
interface Conversation {
  chatType: 'member' | 'user';
  isStarred: boolean;  // ← NEW
  member: {...};
  user?: {...};
  lastMessage: {...};
  unreadCount: number;
}
```

**UI Implementation**:

```jsx
// Add star button to conversation item
function ConversationItem({ conversation }) {
  const [isStarred, setIsStarred] = useState(conversation.isStarred);
  
  const toggleStar = async () => {
    const endpoint = isStarred ? '/chat/unstar' : '/chat/star';
    const body = {
      otherMemberId: conversation.member.memberId,
      otherUserId: conversation.user?.userId
    };
    
    await fetch(`/wfzo/api/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    setIsStarred(!isStarred);
  };
  
  return (
    <div className="conversation-item">
      <button onClick={toggleStar}>
        {isStarred ? '★' : '☆'}
      </button>
      {/* Rest of conversation UI */}
    </div>
  );
}

// Add starred filter
function ConversationList({ conversations }) {
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  
  const filtered = showStarredOnly 
    ? conversations.filter(c => c.isStarred)
    : conversations;
  
  return (
    <>
      <button onClick={() => setShowStarredOnly(!showStarredOnly)}>
        {showStarredOnly ? 'Show All' : 'Show Starred Only'}
      </button>
      {filtered.map(conv => <ConversationItem key={...} conversation={conv} />)}
    </>
  );
}
```

---

### 2. Block User from Messaging

#### New Endpoints
- `POST /chat/block-user` - Block a user
- `POST /chat/unblock-user` - Unblock a user
- `GET /chat/blocked-users` - Get list of blocked users

#### When to Use

**Block from conversation view**:
```jsx
function ConversationHeader({ conversation }) {
  const handleBlock = async () => {
    if (!conversation.user) return; // Only for User Chat
    
    const confirmed = confirm(`Block ${conversation.user.firstName}?`);
    if (!confirmed) return;
    
    await fetch('/wfzo/api/v1/chat/block-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blockedUserId: conversation.user.userId,
        blockedMemberId: conversation.member.memberId
      })
    });
    
    alert('User blocked successfully');
  };
  
  return (
    <div className="conversation-header">
      {/* ... */}
      {conversation.chatType === 'user' && (
        <button onClick={handleBlock}>Block User</button>
      )}
    </div>
  );
}
```

**Blocked users settings page**:
```jsx
function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  
  useEffect(() => {
    fetch('/wfzo/api/v1/chat/blocked-users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBlockedUsers(data.data));
  }, []);
  
  const handleUnblock = async (userId) => {
    await fetch('/wfzo/api/v1/chat/unblock-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ blockedUserId: userId })
    });
    
    setBlockedUsers(prev => prev.filter(u => u.userId !== userId));
  };
  
  return (
    <div>
      <h2>Blocked Users</h2>
      {blockedUsers.map(user => (
        <div key={user.userId}>
          <img src={user.profileImageUrl} alt={user.name} />
          <span>{user.name}</span>
          <span>{user.companyName}</span>
          <button onClick={() => handleUnblock(user.userId)}>Unblock</button>
        </div>
      ))}
    </div>
  );
}
```

#### Error Handling

When blocked users try to send messages:
```json
{
  "statusCode": 403,
  "message": "You cannot send messages to this user. They have blocked you.",
  "error": "Forbidden"
}
```

**Show user-friendly message**:
```jsx
async function sendMessage(content) {
  try {
    const response = await fetch('/wfzo/api/v1/chat/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...messageData, content })
    });
    
    if (response.status === 403) {
      alert('This user has blocked you from sending messages.');
      return;
    }
    
    // Handle success
  } catch (error) {
    console.error(error);
  }
}
```

---

### 3. Delete Message

#### New Endpoint
- `DELETE /chat/message/:messageId` - Delete a message (sender only)

#### UI Implementation

**Add delete button to messages**:
```jsx
function Message({ message, currentUserId }) {
  const canDelete = message.senderUserId === currentUserId;
  
  const handleDelete = async () => {
    const confirmed = confirm('Delete this message?');
    if (!confirmed) return;
    
    const response = await fetch(`/wfzo/api/v1/chat/message/${message._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      // Remove from UI
      removeMessageFromView(message._id);
    } else if (response.status === 403) {
      alert('You can only delete your own messages');
    }
  };
  
  return (
    <div className={`message ${message.senderUserId === currentUserId ? 'sent' : 'received'}`}>
      <p>{message.content}</p>
      {canDelete && (
        <button onClick={handleDelete} className="delete-btn">🗑️</button>
      )}
    </div>
  );
}
```

**Optimistic UI update**:
```jsx
function ChatView() {
  const [messages, setMessages] = useState([]);
  
  const deleteMessage = async (messageId) => {
    // Optimistic update
    setMessages(prev => prev.filter(m => m._id !== messageId));
    
    try {
      await fetch(`/wfzo/api/v1/chat/message/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      // Revert on error
      fetchMessages();
    }
  };
  
  return (
    <div>
      {messages.map(msg => (
        <Message 
          key={msg._id} 
          message={msg} 
          onDelete={deleteMessage}
          currentUserId={currentUser.id}
        />
      ))}
    </div>
  );
}
```

---

## Automatic Changes (No Action Required)

### 1. Deleted Messages Are Hidden

`GET /chat/messages` automatically filters deleted messages.

**Before**: Messages array might include deleted messages  
**After**: Deleted messages never appear in response

**No frontend changes needed** - messages just won't appear.

### 2. Conversations Show Starred Status

`GET /chat/conversations` includes `isStarred` field.

**If you don't implement star UI**: Simply ignore this field.

---

## TypeScript Types Update

```typescript
// Update your types file
interface Conversation {
  chatType: 'member' | 'user';
  isStarred: boolean;  // ← ADD THIS
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

interface BlockedUser {
  userId: string;
  memberId: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  userType: 'Primary' | 'Secondary';
  companyName?: string;
  blockedAt: string;
}

// New API methods
interface ChatAPI {
  // Existing
  sendMessage(data: SendMessageDto): Promise<Message>;
  getConversations(params: { page: number; pageSize: number }): Promise<ConversationsResponse>;
  getMessages(params: GetMessagesParams): Promise<MessagesResponse>;
  markAsRead(data: MarkAsReadDto): Promise<{ modifiedCount: number }>;
  uploadFile(file: File): Promise<FileUploadResponse>;
  
  // New
  starConversation(data: { otherMemberId: string; otherUserId?: string }): Promise<SuccessResponse>;
  unstarConversation(data: { otherMemberId: string; otherUserId?: string }): Promise<SuccessResponse>;
  blockUser(data: { blockedUserId: string; blockedMemberId: string }): Promise<SuccessResponse>;
  unblockUser(data: { blockedUserId: string }): Promise<SuccessResponse>;
  getBlockedUsers(): Promise<{ data: BlockedUser[] }>;
  deleteMessage(messageId: string): Promise<SuccessResponse>;
}
```

---

## Testing Checklist

### Star/Unstar
- [ ] Star button appears in conversation list
- [ ] Click star toggles state
- [ ] Starred conversations persist after refresh
- [ ] "Show Starred Only" filter works
- [ ] Unstar removes from starred list

### Block User
- [ ] Block option available only in User Chat
- [ ] Block confirmation dialog appears
- [ ] User appears in blocked users list
- [ ] Sending message shows "blocked" error to blocked user
- [ ] Unblock removes from blocked list
- [ ] Can send messages again after unblock

### Delete Message
- [ ] Delete button appears only on own messages
- [ ] Delete confirmation dialog appears
- [ ] Message disappears from view immediately
- [ ] Message doesn't reappear after refresh
- [ ] Other user doesn't see deleted message
- [ ] Last message in conversation updates if deleted

---

## Migration Steps

1. **Update TypeScript types** (add `isStarred` to Conversation)
2. **Test existing chat** (should work unchanged)
3. **Implement star UI** (optional)
4. **Implement block UI** (optional)
5. **Implement delete UI** (optional)
6. **Add blocked users settings page** (optional)
7. **Test all scenarios**

---

## Need Help?

- **API Documentation**: `CHAT_API_REFERENCE.md`
- **Feature Details**: `CHAT_ADVANCED_FEATURES.md`
- **Routing Logic**: `CHAT_ROUTING_LOGIC.md`

All features are optional and backward compatible. Implement at your own pace!
