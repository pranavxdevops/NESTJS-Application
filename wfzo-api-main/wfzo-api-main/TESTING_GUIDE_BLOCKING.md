# Quick Testing Guide - Member Blocking & Connection Removal

## 🚀 Quick Start Testing

### Prerequisites
- Two members with connections: MEMBER-001, MEMBER-002
- Multiple users per member (at least 1 primary + 1 secondary each)
- Existing accepted connection between them

---

## Test 1: Member-to-Member Block (Organization-Wide)

### Setup
- Member A: MEMBER-001 (users: user-a1, user-a2)
- Member B: MEMBER-002 (users: user-b1, user-b2)
- Connected: YES

### Step 1: Block Member B from Member A
```bash
POST /wfzo/api/v1/connections/:connectionId/block-member
Authorization: Bearer <member-a-token>
Content-Type: application/json

{
  "blockedMemberId": "MEMBER-002"
}
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Member blocked successfully. All users from both organizations are now blocked from communicating.",
  "data": {
    "connectionId": "...",
    "blockedBy": "MEMBER-001",
    "memberBlockedAt": "2026-01-21T...",
    "blockEntriesCount": 8  // 2 users × 2 users × 2 directions = 8 entries
  }
}
```

### Step 2: Test Messaging (Member A user tries to send to Member B user)
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-a1-token>

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-b1",
  "content": "Hello",
  "type": "text"
}
```

**Expected Result:** ❌ **Should FAIL** or message marked as blocked (blocker cannot send)

### Step 3: Test Messaging (Member B user tries to send to Member A user)
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-b1-token>

{
  "recipientId": "MEMBER-001",
  "recipientUserId": "user-a1",
  "content": "Hello back",
  "type": "text"
}
```

**Expected Result:** ✅ **Message sent BUT marked as blocked**
- Message stored with `isBlockedMessage: true`
- Message NOT delivered to user-a1
- Only visible to sender (user-b1)

### Step 4: Check Connections List
```bash
GET /wfzo/api/v1/connections
Authorization: Bearer <user-a1-token>
```

**Expected Result:**
```json
{
  "data": [
    {
      "connectionId": "...",
      "member": {
        "memberId": "MEMBER-002",
        "primaryUsers": [
          {
            "userId": "user-b1",
            "blockStatus": {
              "isBlocked": true,
              "iBlockedThem": true,
              "theyBlockedMe": false
            }
          }
        ],
        "memberBlockStatus": {
          "isBlocked": true,
          "blockedBy": "MEMBER-001",
          "blockedAt": "..."
        }
      }
    }
  ]
}
```

---

## Test 2: Member-to-Member Unblock

### Step 1: Unblock Member B
```bash
POST /wfzo/api/v1/connections/:connectionId/unblock-member
Authorization: Bearer <member-a-token>

{
  "unblockedMemberId": "MEMBER-002"
}
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Member unblocked successfully. All block restrictions have been removed for both organizations.",
  "data": {
    "connectionId": "...",
    "remainingBlocksCount": 0  // All member-level blocks removed
  }
}
```

### Step 2: Test Messaging After Unblock
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-a1-token>

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-b1",
  "content": "Can we talk now?",
  "type": "text"
}
```

**Expected Result:** ✅ **Message sent and delivered successfully**

### Step 3: Verify Old Blocked Messages NOT Delivered
- Check user-a1's messages: Should NOT see "Hello back" from user-b1 sent during block
- Messages sent during block period are NEVER delivered retroactively

---

## Test 3: User-to-User Block

### Step 1: User A1 blocks User B1 (specific user only)
```bash
POST /wfzo/api/v1/chat/block-user
Authorization: Bearer <user-a1-token>

{
  "blockedUserId": "user-b1",
  "blockedMemberId": "MEMBER-002"
}
```

**Expected Result:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

### Step 2: Test Messaging (User A1 → User B1)
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-a1-token>

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-b1",
  "content": "Hello",
  "type": "text"
}
```

**Expected Result:** ❌ **Should FAIL** (blocker cannot send)

### Step 3: Test Messaging (User A1 → User B2 - different user)
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-a1-token>

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-b2",
  "content": "Hello B2",
  "type": "text"
}
```

**Expected Result:** ✅ **Message sent successfully** (only user-b1 blocked, not user-b2)

### Step 4: Test Messaging (User A2 → User B1)
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-a2-token>

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-b1",
  "content": "Hello from A2",
  "type": "text"
}
```

**Expected Result:** ✅ **Message sent successfully** (user-a2 didn't block anyone)

---

## Test 4: Connection Removal

### Step 1: Remove Connection
```bash
DELETE /wfzo/api/v1/connections/:connectionId
Authorization: Bearer <member-a-token>
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Connection permanently removed. All team members have been automatically disconnected. No messaging allowed between any users from both organizations."
}
```

### Step 2: Verify Connection Deleted
```bash
GET /wfzo/api/v1/connections
Authorization: Bearer <user-a1-token>
```

**Expected Result:** Member B should NOT appear in list (hard deleted from database)

### Step 3: Test Messaging After Removal
```bash
POST /wfzo/api/v1/chat/send
Authorization: Bearer <user-a1-token>

{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-b1",
  "content": "Can we still chat?",
  "type": "text"
}
```

**Expected Result:** ❌ **Error: "You must be connected with this member to send messages"**

### Step 4: Verify in Database
```bash
# MongoDB query
db.connections.findOne({ _id: ObjectId("connectionId") })
```

**Expected Result:** `null` (connection hard-deleted)

---

## Test 5: Mixed Blocks (Member + User Level)

### Setup
- Member A blocks Member B (organization-wide)
- User A1 also has user-level block on User C1 from Member C

### Step 1: Apply Both Blocks
```bash
# Member-level block
POST /connections/:connectionId-AB/block-member
Body: { "blockedMemberId": "MEMBER-002" }

# User-level block  
POST /chat/block-user
Body: { "blockedUserId": "user-c1", "blockedMemberId": "MEMBER-003" }
```

### Step 2: Verify Both Tracked Separately
```bash
# Check connection AB
GET /connections  # Should show memberBlockStatus.isBlocked: true

# Check connection AC
GET /connections  # Should show user-c1 with blockStatus.iBlockedThem: true
```

### Step 3: Unblock Member B (member-level)
```bash
POST /connections/:connectionId-AB/unblock-member
Body: { "unblockedMemberId": "MEMBER-002" }
```

### Step 4: Verify User-Level Block Remains
```bash
GET /connections
```

**Expected Result:**
- Member B: `memberBlockStatus.isBlocked: false` (unblocked)
- User C1: `blockStatus.iBlockedThem: true` (still blocked)

---

## Test 6: Block Status in Connections List

### Test Case: Get connections with detailed block status

```bash
GET /wfzo/api/v1/connections
Authorization: Bearer <user-token>
```

### Expected Response Structure:
```json
{
  "success": true,
  "data": [
    {
      "connectionId": "conn-123",
      "member": {
        "memberId": "MEMBER-002",
        "primaryUsers": [
          {
            "userId": "user-b1",
            "firstName": "John",
            "blockStatus": {
              "isBlocked": false,
              "iBlockedThem": false,
              "theyBlockedMe": false
            }
          }
        ],
        "secondaryUsers": [
          {
            "userId": "user-b2",
            "firstName": "Jane",
            "blockStatus": {
              "isBlocked": false,
              "iBlockedThem": false,
              "theyBlockedMe": false
            }
          }
        ],
        "memberBlockStatus": {
          "isBlocked": false,
          "blockedBy": null,
          "blockedAt": null
        }
      }
    }
  ]
}
```

---

## Database Inspection Queries

### Check Connection Block Entries
```javascript
db.connections.findOne(
  { _id: ObjectId("connectionId") },
  { blockedUsers: 1, blockedBy: 1, memberBlockedAt: 1, memberBlockLevel: 1 }
)
```

### Count Member-Level vs User-Level Blocks
```javascript
db.connections.aggregate([
  { $unwind: "$blockedUsers" },
  { $group: {
      _id: "$blockedUsers.blockType",
      count: { $sum: 1 }
    }
  }
])
```

### Find All Blocks for Specific User
```javascript
db.connections.find({
  "blockedUsers": {
    $elemMatch: {
      $or: [
        { blockerId: "user-id" },
        { blockedUserId: "user-id" }
      ],
      isActive: true
    }
  }
})
```

---

## Common Issues & Solutions

### Issue: Block entries not created
**Solution:** Check `userSnapshots` array exists and has users for both members

### Issue: Message still delivered after block
**Solution:** Verify `isBlockedByUser()` method called in `sendMessage()`, check block has `isActive: true`

### Issue: Unblock doesn't remove all blocks
**Solution:** Ensure both member IDs checked in both directions in filter logic

### Issue: Connection still appears after removal
**Solution:** Hard delete should remove completely - check if `findByIdAndDelete()` called successfully

---

## API Endpoint Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/connections/:id/block-member` | POST | Bearer | Block entire organization |
| `/connections/:id/unblock-member` | POST | Bearer | Unblock entire organization |
| `/chat/block-user` | POST | Bearer | Block specific user only |
| `/chat/unblock-user` | POST | Bearer | Unblock specific user |
| `/connections/:id` | DELETE | Bearer | Remove connection permanently |
| `/connections` | GET | Bearer | List connections with block status |

---

## Success Criteria Checklist

- [ ] Member A blocks Member B → ALL users from both orgs blocked
- [ ] Blocker side: Cannot send messages (enforced)
- [ ] Blocked side: Can send but messages NOT delivered (silent)
- [ ] Member unblock: ALL member-level blocks removed
- [ ] User-level blocks tracked separately with `blockType: 'user-to-user'`
- [ ] Connection removal: Hard delete, all users disconnected
- [ ] Removed connection: Does NOT appear in GET /connections
- [ ] Messaging after removal: Error thrown
- [ ] Connections list: Includes `blockStatus` per user and `memberBlockStatus` per member
- [ ] Block status accurate: `isBlocked`, `iBlockedThem`, `theyBlockedMe`

---

## End of Testing Guide
