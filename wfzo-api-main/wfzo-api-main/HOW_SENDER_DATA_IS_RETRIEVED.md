# How senderId and senderUserId Are Automatically Retrieved

## The Magic: JWT Token + Database Lookup

You only send the **message content**, but the system automatically knows **who you are** through authentication.

## Step-by-Step Data Flow

### 1. Frontend Makes Request

**What YOU send:**
```typescript
POST /wfzo/api/v1/chat/send
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "mike-uuid",
  "content": "Hello Mike!"
}
```

**Notice:** You don't send `senderId` or `senderUserId` - only the **recipient** info!

### 2. Authentication Layer Extracts Email

**Code Location:** `UnifiedAuthGuard` (JWT authentication)

```typescript
@UseGuards(UnifiedAuthGuard)  // ← This runs BEFORE your controller method
export class ChatController {
  
  @Post('send')
  async sendMessage(@Request() req: ExpressRequest & { user: any }, @Body() dto: SendMessageDto) {
    const email = req.user.email;  // ← Email comes from JWT token!
    //         ↑
    //         JWT decoded by UnifiedAuthGuard
    //         Token contains: { email: "anna@company.com", ... }
    
    const message = await this.chatService.sendMessage(email, dto);
  }
}
```

**JWT Token Payload (decoded):**
```json
{
  "email": "anna@company.com",
  "sub": "entra-user-id-abc-123",
  "name": "Anna Lee",
  "iat": 1736870400,
  "exp": 1736956800
}
```

### 3. Service Looks Up Full User Data

**Code Location:** `chat.service.ts` → `findUserByEmail()`

```typescript
async sendMessage(email: string, dto: SendMessageDto) {
  // Step 1: Get complete sender info from email
  const senderData = await this.findUserByEmail(email);
  //                                              ↑
  //                                    "anna@company.com"
  
  // This returns:
  // {
  //   member: MemberDocument,        // ← Full member data
  //   user: UserSnapshot,            // ← User from userSnapshots[]
  //   isPrimary: boolean             // ← User type check
  // }
}
```

**Inside `findUserByEmail()`:**

```typescript
private async findUserByEmail(email: string): Promise<{...}> {
  // Step 1: Find member that has this user
  const member = await this.memberModel.findOne({
    'userSnapshots.email': email,  // ← Search in userSnapshots array
    status: 'active',
  });
  
  // Result: Found MEMBER-001 because Anna is in its userSnapshots[]
  // member = {
  //   _id: ObjectId("..."),
  //   memberId: "MEMBER-001",  ← THIS BECOMES senderId
  //   organisationInfo: {...},
  //   userSnapshots: [
  //     {
  //       id: "anna-uuid",    ← THIS BECOMES senderUserId
  //       email: "anna@company.com",  ← MATCHED!
  //       firstName: "Anna",
  //       lastName: "Lee",
  //       userType: "Secondary"
  //     },
  //     {...}
  //   ]
  // }
  
  // Step 2: Extract the specific user from userSnapshots
  const userSnapshot = member.userSnapshots?.find(u => u.email === email);
  
  // userSnapshot = {
  //   id: "anna-uuid",
  //   email: "anna@company.com",
  //   firstName: "Anna",
  //   userType: "Secondary"
  // }
  
  // Step 3: Check if Primary or Secondary
  const isPrimary = userSnapshot.userType === 'Primary';
  // isPrimary = false (Anna is Secondary)
  
  return { 
    member,         // Full member document
    user: userSnapshot,  // User data from userSnapshots
    isPrimary      // Type flag
  };
}
```

### 4. Extract Values for Message

**Back in `sendMessage()`:**

```typescript
async sendMessage(email: string, dto: SendMessageDto) {
  const senderData = await this.findUserByEmail(email);
  
  // Extract the values
  const senderId = senderData.member.memberId;     // "MEMBER-001"
  const senderUserId = senderData.user.id;         // "anna-uuid"
  const senderIsPrimary = senderData.isPrimary;    // false
  
  // ... routing logic ...
  
  // Create message with auto-populated sender info
  const message = new this.messageModel({
    senderId: senderId,              // ← "MEMBER-001" (from member.memberId)
    senderUserId: senderUserId,      // ← "anna-uuid" (from user.id)
    recipientId: dto.recipientId,    // ← "MEMBER-002" (from your request)
    recipientUserId: dto.recipientUserId, // ← "mike-uuid" (from your request)
    content: dto.content,            // ← "Hello Mike!" (from your request)
  });
  
  return await message.save();
}
```

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Frontend Request                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  POST /chat/send                                                 │
│  Authorization: Bearer <JWT_TOKEN>                               │
│  {                                                               │
│    "recipientId": "MEMBER-002",                                  │
│    "recipientUserId": "mike-uuid",                               │
│    "content": "Hello Mike!"                                      │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. UnifiedAuthGuard Decodes JWT                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  JWT Payload:                                                    │
│  {                                                               │
│    "email": "anna@company.com"  ← Extracted                     │
│  }                                                               │
│                                                                  │
│  Sets: req.user.email = "anna@company.com"                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. Controller Extracts Email                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  const email = req.user.email;  // "anna@company.com"           │
│  await chatService.sendMessage(email, dto);                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. Service: findUserByEmail("anna@company.com")                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Database Query:                                                 │
│  memberModel.findOne({                                           │
│    'userSnapshots.email': "anna@company.com",                   │
│    status: 'active'                                              │
│  })                                                              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. Database Returns Member Document                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  {                                                               │
│    _id: ObjectId("..."),                                         │
│    memberId: "MEMBER-001",  ← Extract this for senderId        │
│    organisationInfo: {...},                                      │
│    userSnapshots: [                                              │
│      {                                                           │
│        id: "anna-uuid",  ← Extract this for senderUserId        │
│        email: "anna@company.com",  ← MATCHED!                   │
│        firstName: "Anna",                                        │
│        lastName: "Lee",                                          │
│        userType: "Secondary"  ← Extract for isPrimary check     │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. Extract Values                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  senderId = "MEMBER-001"       (from member.memberId)           │
│  senderUserId = "anna-uuid"    (from userSnapshot.id)           │
│  senderIsPrimary = false       (Secondary user)                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. Create Message Document                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  {                                                               │
│    senderId: "MEMBER-001",        ← Auto-populated from DB      │
│    senderUserId: "anna-uuid",     ← Auto-populated from DB      │
│    recipientId: "MEMBER-002",     ← From your request           │
│    recipientUserId: "mike-uuid",  ← From your request           │
│    content: "Hello Mike!",        ← From your request           │
│    isRead: false,                                                │
│    createdAt: ISODate(...)                                       │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  8. Save to Database                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Messages Collection ✅                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Design?

### Security Benefits

✅ **Can't Forge Sender:** You can't pretend to be someone else
- JWT token is signed by authentication server
- Email is cryptographically verified
- Backend looks up YOUR member/user from database

✅ **No Trust in Client:** Server doesn't trust client-provided sender info
- Even if you send `senderId` in request, it's ignored
- Server always uses email from JWT to find sender

✅ **Consistent Data:** Sender info always matches authenticated user
- Prevents spoofing attacks
- Audit trail is reliable

### Comparison: What If You Could Send senderId?

**❌ Insecure Design (what we DON'T do):**
```typescript
// BAD - Don't do this!
POST /chat/send
{
  "senderId": "MEMBER-001",      // ← Could be forged!
  "senderUserId": "anna-uuid",   // ← Could be forged!
  "recipientId": "MEMBER-002",
  "content": "Fake message from CEO!"
}
```

**✅ Secure Design (what we DO):**
```typescript
// GOOD - Current implementation
POST /chat/send
Authorization: Bearer <VERIFIED_JWT>  // ← Can't be forged
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "mike-uuid",
  "content": "Hello!"
}

// Backend automatically determines:
// - Who you are (from JWT → email → database lookup)
// - Your member (senderId)
// - Your user ID (senderUserId)
// - Your type (Primary/Secondary)
```

## Key Takeaways

| Data Field | Source | How It's Retrieved |
|------------|--------|-------------------|
| `senderId` | Database | JWT email → Member lookup → `member.memberId` |
| `senderUserId` | Database | JWT email → userSnapshots lookup → `user.id` |
| `recipientId` | Your Request | From request body |
| `recipientUserId` | Your Request | From request body (optional) |

**You provide:** WHO to send to
**System provides:** WHO you are

## Real Example

**Anna logs in:**
1. Microsoft Entra ID authenticates Anna
2. Returns JWT with `email: "anna@company.com"`
3. Frontend stores JWT token

**Anna sends message:**
1. Frontend: `POST /chat/send` with JWT in header
2. Backend decodes JWT → gets email
3. Backend queries: "Find member with userSnapshots.email = anna@company.com"
4. Finds MEMBER-001 with Anna in userSnapshots
5. Extracts: `memberId: "MEMBER-001"`, `user.id: "anna-uuid"`
6. Creates message with both sender fields auto-filled

**Result:** Anna can never impersonate someone else, and the system always knows who the real sender is! 🔒
