# Blocking API Test Scenarios

## Test Environment Setup

### Prerequisites
- 2 Members with accepted connection
  - **MEMBER-001** (Your Org): 2 users
    - `user-a1` (Primary): admin@member001.com
    - `user-a2` (Secondary): staff@member001.com
  - **MEMBER-060** (Other Org): 2 users
    - `user-b1` (Primary): contact@member060.com
    - `user-b2` (Secondary): support@member060.com
- Valid Entra ID bearer token
- Connection ID between the two members

---

## Scenario 1: Block Member (Organization-Wide)

### Test Case 1.1: Successfully Block Member

**Setup:**
- Login as `admin@member001.com` (user-a1)
- Get connection ID from `/api/connections`

**Request:**
```bash
POST /api/connections/67950fe6d58af1b2c5e90b15/block-member
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockedMemberId": "MEMBER-060"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Member MEMBER-060 blocked successfully (all users affected)",
  "blocksCreated": 8
}
```

**Expected Database State:**
```javascript
// Check connection document
db.connections.findOne({ _id: ObjectId("67950fe6d58af1b2c5e90b15") })

// Should have:
{
  memberBlockedAt: ISODate("2026-01-23T..."),
  memberBlockLevel: "member-to-member",
  blockedUsers: [
    // 8 entries total (2×2×2)
    {
      blockerId: "user-a1",
      blockedUserId: "user-b1",
      isBlocker: true,
      blockType: "member-to-member",
      isActive: true
    },
    {
      blockerId: "user-b1",
      blockedUserId: "user-a1",
      isBlocker: false,
      blockType: "member-to-member",
      isActive: true
    },
    // ... 6 more for all combinations
  ]
}
```

**Verify Block Status in Connections:**
```bash
GET /api/connections
Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "data": [
    {
      "member": {
        "memberId": "MEMBER-060",
        "primaryUsers": [
          {
            "userId": "user-b1",
            "email": "contact@member060.com",
            "blockStatus": "blocked"  // ✅ ALL users blocked
          }
        ],
        "secondaryUsers": [
          {
            "userId": "user-b2",
            "email": "support@member060.com",
            "blockStatus": "blocked"  // ✅ ALL users blocked
          }
        ]
      }
    }
  ]
}
```

**Test Messaging Restrictions:**
```bash
# Test 1: Blocker (user-a1) tries to send to blocked (user-b1)
POST /api/chat/send
{
  "recipientUserId": "user-b1",
  "recipientMemberId": "MEMBER-060",
  "message": "Hello"
}
# Expected: 403 Forbidden - Cannot send message: user is blocked
```

```bash
# Test 2: Blocked (user-b1) tries to send to blocker (user-a1)
# Login as contact@member060.com first
POST /api/chat/send
{
  "recipientUserId": "user-a1",
  "recipientMemberId": "MEMBER-001",
  "message": "Hello back"
}
# Expected: 200 OK (appears successful but message not delivered)

# Verify message not delivered:
# Login as admin@member001.com
GET /api/chat/messages?otherUserId=user-b1
# Should NOT show the message from user-b1
```

---

### Test Case 1.2: Block Member - Error Cases

**Test: Cannot Block Own Organization**
```bash
POST /api/connections/67950fe6d58af1b2c5e90b15/block-member
{
  "blockedMemberId": "MEMBER-001"  // Same as current user's org
}

Expected: 400 Bad Request
{
  "statusCode": 400,
  "message": "Cannot block your own organization"
}
```

**Test: Connection Not Found**
```bash
POST /api/connections/000000000000000000000000/block-member
{
  "blockedMemberId": "MEMBER-060"
}

Expected: 404 Not Found
{
  "statusCode": 404,
  "message": "Connection not found"
}
```

**Test: Invalid Member ID**
```bash
POST /api/connections/67950fe6d58af1b2c5e90b15/block-member
{
  "blockedMemberId": "MEMBER-999"  // Not part of this connection
}

Expected: 400 Bad Request
{
  "statusCode": 400,
  "message": "Connection does not involve the specified member"
}
```

**Test: Block Pending Connection**
```bash
# Use a connection with status "pending"
POST /api/connections/<pending-connection-id>/block-member
{
  "blockedMemberId": "MEMBER-060"
}

Expected: 400 Bad Request
{
  "statusCode": 400,
  "message": "Can only block accepted connections"
}
```

---

## Scenario 2: Unblock Member

### Test Case 2.1: Successfully Unblock Member

**Setup:**
- Member MEMBER-060 is already blocked (from Scenario 1)

**Request:**
```bash
POST /api/connections/67950fe6d58af1b2c5e90b15/unblock-member
Authorization: Bearer <token>
Content-Type: application/json

{
  "unblockedMemberId": "MEMBER-060"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Member MEMBER-060 unblocked successfully",
  "blocksRemoved": 8
}
```

**Expected Database State:**
```javascript
db.connections.findOne({ _id: ObjectId("67950fe6d58af1b2c5e90b15") })

// Should have:
{
  memberBlockedAt: undefined,  // ✅ Cleared
  memberBlockLevel: "none",    // ✅ Reset
  blockedUsers: []  // ✅ Empty (all member-to-member blocks removed)
}
```

**Verify Block Status Cleared:**
```bash
GET /api/connections
```

**Expected Response:**
```json
{
  "member": {
    "memberId": "MEMBER-060",
    "primaryUsers": [
      {
        "userId": "user-b1",
        "blockStatus": "none"  // ✅ No longer blocked
      }
    ],
    "secondaryUsers": [
      {
        "userId": "user-b2",
        "blockStatus": "none"  // ✅ No longer blocked
      }
    ]
  }
}
```

**Test Messaging Restored:**
```bash
POST /api/chat/send
{
  "recipientUserId": "user-b1",
  "recipientMemberId": "MEMBER-060",
  "message": "Hello again"
}
# Expected: 200 OK - Message sent successfully
```

---

### Test Case 2.2: Unblock Member - Error Cases

**Test: No Blocks Found**
```bash
# When member is not blocked
POST /api/connections/67950fe6d58af1b2c5e90b15/unblock-member
{
  "unblockedMemberId": "MEMBER-060"
}

Expected: 404 Not Found
{
  "statusCode": 404,
  "message": "No blocks found"
}
```

---

## Scenario 3: Remove Connection (Hard Delete)

### Test Case 3.1: Successfully Remove Connection

**Request:**
```bash
DELETE /api/connections/67950fe6d58af1b2c5e90b15
Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Connection removed successfully"
}
```

**Expected Database State:**
```javascript
db.connections.findOne({ _id: ObjectId("67950fe6d58af1b2c5e90b15") })
// Should return: null (document completely deleted)
```

**Verify Connection Not in List:**
```bash
GET /api/connections
```

**Expected:**
- MEMBER-060 should NOT appear in the connections list
- Total count should be reduced by 1

---

### Test Case 3.2: Remove Connection - Error Cases

**Test: Connection Not Found**
```bash
DELETE /api/connections/000000000000000000000000

Expected: 404 Not Found
{
  "statusCode": 404,
  "message": "Connection not found"
}
```

**Test: Cannot Remove Other's Connection**
```bash
# Try to remove a connection you're not part of
DELETE /api/connections/<other-connection-id>

Expected: 400 Bad Request
{
  "statusCode": 400,
  "message": "You cannot remove this connection"
}
```

---

## Scenario 4: User-Level Block (Existing Feature)

### Test Case 4.1: User-Level Block Alongside Member Block

**Setup:**
- Block member first (Scenario 1)
- Then unblock member (Scenario 2)
- Now apply user-level block

**Request:**
```bash
POST /api/chat/block-user
Authorization: Bearer <token>
{
  "blockedUserId": "user-b1",
  "blockedMemberId": "MEMBER-060"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

**Expected Database State:**
```javascript
{
  blockedUsers: [
    {
      blockerId: "user-a1",
      blockedUserId: "user-b1",
      isBlocker: true,
      blockType: "user-to-user",  // ← Different type
      isActive: true
    }
  ]
}
```

**Verify Selective Blocking:**
```bash
GET /api/connections
```

**Expected:**
```json
{
  "member": {
    "memberId": "MEMBER-060",
    "primaryUsers": [
      {
        "userId": "user-b1",
        "blockStatus": "blocked"  // ✅ This user blocked
      }
    ],
    "secondaryUsers": [
      {
        "userId": "user-b2",
        "blockStatus": "none"  // ✅ This user NOT blocked
      }
    ]
  }
}
```

---

## Scenario 5: Mixed Blocks (Member + User Level)

### Test Case 5.1: Member Block, Then Unblock, Then User Block Remains

**Step 1: Block Member**
```bash
POST /api/connections/:id/block-member
{ "blockedMemberId": "MEMBER-060" }
```

**Step 2: Apply User-Level Block (while member blocked)**
```bash
POST /api/chat/block-user
{
  "blockedUserId": "user-b1",
  "blockedMemberId": "MEMBER-060"
}
```

**Database State:**
```javascript
blockedUsers: [
  // 8 member-to-member blocks
  { blockType: "member-to-member", ... },
  { blockType: "member-to-member", ... },
  // ...
  // 1 user-to-user block
  { 
    blockerId: "user-a1",
    blockedUserId: "user-b1",
    blockType: "user-to-user",
    isActive: true
  }
]
// Total: 9 entries
```

**Step 3: Unblock Member**
```bash
POST /api/connections/:id/unblock-member
{ "unblockedMemberId": "MEMBER-060" }
```

**Expected Response:**
```json
{
  "blocksRemoved": 8  // Only member-to-member blocks removed
}
```

**Database State After Unblock:**
```javascript
blockedUsers: [
  // Only user-to-user block remains
  { 
    blockerId: "user-a1",
    blockedUserId: "user-b1",
    blockType: "user-to-user",
    isActive: true
  }
]
// Total: 1 entry
```

**Verify Block Status:**
```bash
GET /api/connections
```

**Expected:**
```json
{
  "member": {
    "memberId": "MEMBER-060",
    "primaryUsers": [
      {
        "userId": "user-b1",
        "blockStatus": "blocked"  // ✅ Still blocked (user-level)
      }
    ],
    "secondaryUsers": [
      {
        "userId": "user-b2",
        "blockStatus": "none"  // ✅ Not blocked
      }
    ]
  }
}
```

---

## Scenario 6: Internal Team (Same Organization)

### Test Case 6.1: Internal Team Users Have No Block Status

**Request:**
```bash
GET /api/connections
Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "data": [
    {
      "connectionId": null,
      "member": {
        "memberId": "MEMBER-001",  // Same as logged-in user's org
        "primaryUsers": [
          {
            "userId": "user-a2",
            "email": "staff@member001.com",
            "blockStatus": "none"  // ✅ Always "none" for internal
          }
        ],
        "secondaryUsers": []
      },
      "status": "internal",
      "isInternalTeam": true  // ✅ Flag indicating internal team
    }
  ]
}
```

**Test: Cannot Block Internal Team**
- No API exists to block internal team members
- Member-level block only affects external connections

---

## Scenario 7: Edge Cases

### Test Case 7.1: Block Already Blocked Member (Idempotent)

**Request:**
```bash
POST /api/connections/:id/block-member
{ "blockedMemberId": "MEMBER-060" }

# Call again
POST /api/connections/:id/block-member
{ "blockedMemberId": "MEMBER-060" }
```

**Expected:**
- First call: Creates 8 blocks
- Second call: Updates existing blocks (blocksCreated may vary)
- All blocks remain active

---

### Test Case 7.2: Secondary User Blocks Member

**Login as:** `staff@member001.com` (user-a2, Secondary user)

**Request:**
```bash
POST /api/connections/:id/block-member
{ "blockedMemberId": "MEMBER-060" }
```

**Expected:**
- ✅ Should work (any user can block)
- All users from both orgs affected
- Same cascade effect as primary user

---

## Test Execution Checklist

- [ ] Test 1.1: Block member successfully
- [ ] Test 1.2: Block member error cases (4 scenarios)
- [ ] Test 2.1: Unblock member successfully
- [ ] Test 2.2: Unblock member error cases
- [ ] Test 3.1: Remove connection successfully
- [ ] Test 3.2: Remove connection error cases
- [ ] Test 4.1: User-level block selective blocking
- [ ] Test 5.1: Mixed blocks - member + user level
- [ ] Test 6.1: Internal team no blocking
- [ ] Test 7.1: Block idempotent behavior
- [ ] Test 7.2: Secondary user can block

---

## Postman Collection

### Environment Variables
```
baseUrl: http://localhost:3001/wfzo/api/v1
bearerToken: <your-entra-id-token>
connectionId: 67950fe6d58af1b2c5e90b15
member001: MEMBER-001
member060: MEMBER-060
userA1: user-a1
userB1: user-b1
```

### Collection Structure
```
📁 Connection Blocking Tests
  📂 1. Member Block
    ✉️ Block Member - Success
    ✉️ Block Member - Own Org Error
    ✉️ Block Member - Not Found Error
    ✉️ Block Member - Invalid Member Error
  📂 2. Member Unblock
    ✉️ Unblock Member - Success
    ✉️ Unblock Member - No Blocks Error
  📂 3. Remove Connection
    ✉️ Remove Connection - Success
    ✉️ Remove Connection - Not Found Error
  📂 4. Verify Block Status
    ✉️ Get Connections - Verify Block Status
    ✉️ Get Connections - Verify Unblock Status
  📂 5. Messaging Tests
    ✉️ Send Message - Blocker to Blocked (Fail)
    ✉️ Send Message - Blocked to Blocker (Silent)
```

---

**Last Updated:** 2026-01-23  
**Status:** Ready for execution ✅
