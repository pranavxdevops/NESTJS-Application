# How GET /chat/conversations Works - Complete Breakdown

## API Call
```http
GET /wfzo/api/v1/chat/conversations?page=1&pageSize=10
Authorization: Bearer <JWT_TOKEN>
```

## Step-by-Step Flow

### Step 1: Authentication & User Identification

**Code:**
```typescript
const senderData = await this.findUserByEmail(email);
// Email comes from JWT token decoded by UnifiedAuthGuard

const currentMemberId = senderData.member.memberId;  // e.g., "MEMBER-005"
const currentUserId = senderData.user.id;            // e.g., "anna-uuid-123"
const currentIsPrimary = senderData.isPrimary;       // true or false
```

**Example:**
- Logged in user: Anna (Secondary user)
- currentMemberId: "MEMBER-005"
- currentUserId: "anna-uuid-123"
- currentIsPrimary: false

---

### Step 2: Build Query Filter

**For Primary Users (currentIsPrimary = true):**
```typescript
$match: {
  $or: [
    // User Chat where I'm the sender
    { senderId: "MEMBER-005", senderUserId: "primary-uuid" },
    
    // User Chat where I'm the recipient
    { recipientId: "MEMBER-005", recipientUserId: "primary-uuid" },
    
    // Member Chat where I'm the sender (no userId fields)
    { senderId: "MEMBER-005", senderUserId: { $exists: false } },
    
    // Member Chat where I'm the recipient (no userId fields)
    { recipientId: "MEMBER-005", recipientUserId: { $exists: false } }
  ]
}
```
**Result:** Primary users see BOTH Member Chat and User Chat

---

**For Secondary Users (currentIsPrimary = false):**
```typescript
$match: {
  $or: [
    // User Chat where I'm the sender
    { senderId: "MEMBER-005", senderUserId: "anna-uuid-123" },
    
    // User Chat where I'm the recipient
    { recipientId: "MEMBER-005", recipientUserId: "anna-uuid-123" }
    
    // ❌ NO Member Chat queries (no $exists: false conditions)
  ]
}
```
**Result:** Secondary users see ONLY User Chat

---

### Step 3: MongoDB Aggregation Pipeline

#### Stage 1: Match Messages
```javascript
{
  $match: {
    // Filter based on user type (as shown above)
  }
}
```
**Example Result:**
```javascript
[
  { senderId: "MEMBER-005", senderUserId: "anna-uuid", recipientId: "MEMBER-014", recipientUserId: "mike-uuid", content: "Hi Mike!" },
  { senderId: "MEMBER-014", senderUserId: "mike-uuid", recipientId: "MEMBER-005", recipientUserId: "anna-uuid", content: "Hi Anna!" },
  { senderId: "MEMBER-005", senderUserId: "anna-uuid", recipientId: "MEMBER-020", recipientUserId: "sarah-uuid", content: "Hello Sarah!" }
]
```

#### Stage 2: Sort by Most Recent
```javascript
{
  $sort: { createdAt: -1 }
}
```
**Effect:** Newest messages first

#### Stage 3: Group by Conversation
```javascript
{
  $group: {
    _id: {
      memberId: <other member's ID>,
      userId: <other user's ID or null>
    },
    lastMessage: { $first: '$$ROOT' },  // Most recent message
    unreadCount: { $sum: <count unread> }
  }
}
```

**Example Result:**
```javascript
[
  {
    _id: { memberId: "MEMBER-014", userId: "mike-uuid" },
    lastMessage: { content: "Hi Anna!", createdAt: "2026-01-14T10:00:00Z", isRead: false },
    unreadCount: 1
  },
  {
    _id: { memberId: "MEMBER-020", userId: "sarah-uuid" },
    lastMessage: { content: "See you!", createdAt: "2026-01-14T09:00:00Z", isRead: true },
    unreadCount: 0
  }
]
```

**Key Logic:**
```typescript
// Determine the OTHER person's memberId
memberId: {
  $cond: [
    { $eq: ['$senderId', currentMemberId] },  // If I'm the sender
    '$recipientId',                            // → Other person is recipient
    '$senderId'                                // → Other person is sender
  ]
}

// Determine the OTHER person's userId (or null for Member Chat)
userId: {
  $cond: [
    { $eq: ['$senderId', currentMemberId] },  // If I'm the sender
    { $ifNull: ['$recipientUserId', null] },  // → Other person's userId or null
    { $ifNull: ['$senderUserId', null] }      // → Other person's userId or null
  ]
}
```

#### Stage 4: Sort Conversations by Last Message
```javascript
{
  $sort: { 'lastMessage.createdAt': -1 }
}
```

#### Stage 5 & 6: Pagination
```javascript
{
  $skip: (page - 1) * pageSize  // Skip 0 for page 1
},
{
  $limit: pageSize              // Limit 10
}
```

---

### Step 4: Populate Member & User Details

For each conversation, the backend:

1. **Fetches member info:**
```typescript
const otherMember = await memberModel.findOne({ memberId: "MEMBER-014" })
  .select('memberId organisationInfo.companyName organisationInfo.memberLogoUrl ...')
```

2. **Determines chat type:**
```typescript
const isUserChat = otherUserId !== null;
// If userId is null → Member Chat
// If userId exists → User Chat
```

3. **If User Chat, extracts user details:**
```typescript
if (isUserChat && otherMember?.userSnapshots) {
  const userSnapshot = otherMember.userSnapshots.find(u => u.id === "mike-uuid");
  userDetails = {
    userId: userSnapshot.id,
    firstName: userSnapshot.firstName,
    lastName: userSnapshot.lastName,
    email: userSnapshot.email,
    userType: userSnapshot.userType,
    profileImageUrl: userSnapshot.profileImageUrl
  };
}
```

---

### Step 5: Build Response

```javascript
{
  chatType: "user",  // or "member"
  member: {
    memberId: "MEMBER-014",
    companyName: "Tech Corp",
    logo: "https://...",
    address: {
      city: "San Francisco",
      country: "USA"
    }
  },
  user: {
    userId: "mike-uuid",
    firstName: "Mike",
    lastName: "Chen",
    email: "mike@techcorp.com",
    userType: "Secondary",
    profileImageUrl: "https://..."
  },
  lastMessage: {
    content: "Hi Anna!",
    senderId: "MEMBER-014",
    createdAt: "2026-01-14T10:00:00Z",
    isRead: false
  },
  unreadCount: 1
}
```

---

## Complete Example

### Request
```http
GET /wfzo/api/v1/chat/conversations?page=1&pageSize=10
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Logged-in User: Anna (Secondary, MEMBER-005)

### Database Messages:
```javascript
// Message 1: Anna → Mike (User Chat)
{
  _id: "msg1",
  senderId: "MEMBER-005",
  senderUserId: "anna-uuid",
  recipientId: "MEMBER-014",
  recipientUserId: "mike-uuid",
  content: "Hi Mike!",
  createdAt: "2026-01-14T10:00:00Z",
  isRead: true
}

// Message 2: Mike → Anna (User Chat)
{
  _id: "msg2",
  senderId: "MEMBER-014",
  senderUserId: "mike-uuid",
  recipientId: "MEMBER-005",
  recipientUserId: "anna-uuid",
  content: "Hi Anna!",
  createdAt: "2026-01-14T10:05:00Z",
  isRead: false
}

// Message 3: Anna → Sarah (User Chat)
{
  _id: "msg3",
  senderId: "MEMBER-005",
  senderUserId: "anna-uuid",
  recipientId: "MEMBER-020",
  recipientUserId: "sarah-uuid",
  content: "Hello Sarah!",
  createdAt: "2026-01-14T09:00:00Z",
  isRead: true
}

// Message 4: Primary of MEMBER-005 → Primary of MEMBER-014 (Member Chat)
{
  _id: "msg4",
  senderId: "MEMBER-005",
  // NO senderUserId
  recipientId: "MEMBER-014",
  // NO recipientUserId
  content: "Official business",
  createdAt: "2026-01-14T08:00:00Z",
  isRead: true
}
```

### Response:
```json
{
  "success": true,
  "data": [
    {
      "chatType": "user",
      "member": {
        "memberId": "MEMBER-014",
        "companyName": "Tech Corp",
        "logo": "https://storage.example.com/logos/techcorp.png",
        "address": {
          "city": "San Francisco",
          "country": "USA"
        }
      },
      "user": {
        "userId": "mike-uuid",
        "firstName": "Mike",
        "lastName": "Chen",
        "email": "mike@techcorp.com",
        "userType": "Secondary",
        "profileImageUrl": "https://storage.example.com/users/mike.jpg"
      },
      "lastMessage": {
        "content": "Hi Anna!",
        "senderId": "MEMBER-014",
        "createdAt": "2026-01-14T10:05:00.000Z",
        "isRead": false
      },
      "unreadCount": 1
    },
    {
      "chatType": "user",
      "member": {
        "memberId": "MEMBER-020",
        "companyName": "Design Co",
        "logo": "https://storage.example.com/logos/designco.png",
        "address": {
          "city": "New York",
          "country": "USA"
        }
      },
      "user": {
        "userId": "sarah-uuid",
        "firstName": "Sarah",
        "lastName": "Lee",
        "email": "sarah@designco.com",
        "userType": "Secondary",
        "profileImageUrl": "https://storage.example.com/users/sarah.jpg"
      },
      "lastMessage": {
        "content": "Hello Sarah!",
        "senderId": "MEMBER-005",
        "createdAt": "2026-01-14T09:00:00.000Z",
        "isRead": true
      },
      "unreadCount": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 2,
    "hasMore": false
  }
}
```

**Note:** Message 4 (Member Chat) is NOT included because Anna is a Secondary user.

---

## Key Behaviors

### 1. Deduplication
Each conversation appears only ONCE, showing the most recent message.

**Example:**
- Anna sends: "Hi Mike!" at 10:00
- Mike replies: "Hi Anna!" at 10:05
- **Result:** ONE conversation with Mike, last message = "Hi Anna!" at 10:05

### 2. User Type Filtering

**Primary User:**
- Sees both Member Chat and User Chat conversations
- `chatType` field distinguishes them

**Secondary User:**
- Sees ONLY User Chat conversations
- All conversations have `chatType: "user"`

### 3. Unread Count
Counts only messages where:
- `recipientId` = current user's member
- `recipientUserId` = current user's ID (for User Chat) OR null (for Member Chat, Primary only)
- `isRead` = false

### 4. Sorting
Conversations sorted by most recent message timestamp (newest first)

### 5. Chat Type Detection
```typescript
chatType: isUserChat ? 'user' : 'member'

// isUserChat = (otherUserId !== null)
```

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Request with JWT Token                                   │
│  GET /chat/conversations?page=1&pageSize=10                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Extract User Info from Token                             │
│  email → findUserByEmail() → member, user, isPrimary         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Build MongoDB Query                                      │
│  • Primary: Include Member Chat + User Chat                  │
│  • Secondary: Include only User Chat                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Aggregate Pipeline                                       │
│  $match → $sort → $group → $sort → $skip → $limit           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. For Each Conversation                                    │
│  • Fetch member details                                      │
│  • If User Chat: Extract user from userSnapshots             │
│  • Build response object                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Return JSON Response                                     │
│  • conversations[] with chatType, member, user               │
│  • pagination info                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

| Aspect | How It Works |
|--------|-------------|
| **Authentication** | JWT token → email → user lookup |
| **Filtering** | Primary sees all, Secondary sees only User Chat |
| **Grouping** | By (memberId, userId) pair |
| **Deduplication** | One conversation per unique pair |
| **Sorting** | Most recent message first |
| **Chat Type** | Determined by presence of userId field |
| **User Details** | Extracted from member.userSnapshots |
| **Unread Count** | Counts unread messages for current user |
| **Pagination** | Controlled by page & pageSize params |

**The endpoint automatically shows the right conversations based on who you are (Primary vs Secondary) without needing to specify filters!**
