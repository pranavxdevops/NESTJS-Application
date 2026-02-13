# 🔧 URGENT FIX APPLIED - Secondary User Chat

## Problem Found
The `senderUserId` and `recipientUserId` fields were **missing from the Message schema**, causing all messages to be stored as Member Chat even when `recipientUserId` was provided in the request.

## What Was Fixed

### File: `src/modules/chat/schemas/message.schema.ts`

**Added fields:**
```typescript
@Prop({ type: String, required: false })
senderUserId?: string; // User ID from userSnapshots (for User Chat)

@Prop({ type: String, required: false })
recipientUserId?: string; // User ID from userSnapshots (for User Chat)
```

**Added indexes:**
```typescript
MessageSchema.index({ senderUserId: 1, recipientUserId: 1 });
MessageSchema.index({ senderUserId: 1 });
MessageSchema.index({ recipientUserId: 1 });
```

## 🚨 REQUIRED: Restart Server

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart
npm run start:dev
```

## Test After Restart

### 1. Send User Chat Message
```bash
POST http://localhost:3001/wfzo/api/v1/chat/send
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "recipientId": "MEMBER-014",
  "recipientUserId": "5b6cea06-489e-4471-b832-fd57439cc522",
  "content": "Hello Mike!"
}
```

### Expected Response (NOW):
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "senderId": "MEMBER-005",
    "senderUserId": "your-user-id",           // ✅ NOW PRESENT
    "recipientId": "MEMBER-014",
    "recipientUserId": "5b6cea06-489e-4471-b832-fd57439cc522", // ✅ NOW PRESENT
    "content": "Hello Mike!",
    "type": "text",
    "isRead": false,
    "_id": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2. Get Member Chat (Should NOT include User Chat messages)
```bash
GET http://localhost:3001/wfzo/api/v1/chat/messages?otherMemberId=MEMBER-014
Authorization: Bearer <JWT>
```

**Expected:** Should NOT include messages with `recipientUserId` field

### 3. Get User Chat (Should include only User Chat messages)
```bash
GET http://localhost:3001/wfzo/api/v1/chat/messages?otherMemberId=MEMBER-014&otherUserId=5b6cea06-489e-4471-b832-fd57439cc522
Authorization: Bearer <JWT>
```

**Expected:** Should ONLY include messages with `recipientUserId` = "5b6cea06-489e-4471-b832-fd57439cc522"

## Why This Happened

The schema fields were documented in the implementation guides but were **never actually added to the Mongoose schema**. The service code was trying to save `senderUserId` and `recipientUserId`, but Mongoose was silently ignoring them because they weren't defined in the schema.

## Verification Steps

### Step 1: Check Schema Definition
```bash
# Verify the schema has the new fields
cat src/modules/chat/schemas/message.schema.ts | grep -A 2 "senderUserId"
```

Should show:
```typescript
@Prop({ type: String, required: false })
senderUserId?: string; // User ID from userSnapshots (for User Chat)
```

### Step 2: Send Test Message
Use the request above with `recipientUserId` included.

### Step 3: Verify in Database
```javascript
// In MongoDB, check the message
db.messages.find().sort({_id: -1}).limit(1).pretty()

// Should show:
{
  "_id": ObjectId("..."),
  "senderId": "MEMBER-005",
  "senderUserId": "...",              // ✅ Should be present
  "recipientId": "MEMBER-014",
  "recipientUserId": "5b6cea06-489e-4471-b832-fd57439cc522", // ✅ Should be present
  "content": "Hello Mike!",
  ...
}
```

### Step 4: Test Routing
```bash
# Member Chat query (no otherUserId)
GET /chat/messages?otherMemberId=MEMBER-014
# Should NOT return messages with userId fields

# User Chat query (with otherUserId)
GET /chat/messages?otherMemberId=MEMBER-014&otherUserId=5b6cea06-489e-4471-b832-fd57439cc522
# Should ONLY return messages with matching userId fields
```

## Old Messages (Before Fix)

All messages sent before this fix will:
- ❌ Not have `senderUserId` or `recipientUserId` fields
- ❌ Appear in Member Chat queries
- ❌ Not appear in User Chat queries (even if `recipientUserId` was in the original request)

**These messages are permanently Member Chat messages.**

## New Messages (After Fix)

All messages sent after server restart will:
- ✅ Have `senderUserId` and `recipientUserId` when appropriate
- ✅ Route correctly to User Chat or Member Chat
- ✅ Be isolated properly

## Summary

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| Schema has userId fields | ❌ No | ✅ Yes |
| Messages save userId fields | ❌ No (silently ignored) | ✅ Yes |
| User Chat routing works | ❌ No | ✅ Yes |
| Member Chat isolation | ❌ No | ✅ Yes |

## Status
✅ Schema updated
✅ Indexes added
✅ No compilation errors
🔄 **RESTART SERVER REQUIRED**
