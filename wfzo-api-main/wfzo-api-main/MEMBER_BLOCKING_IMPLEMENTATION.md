# Member-Level Blocking & Connection Removal - Implementation Guide

## Overview
This document explains the comprehensive member-level blocking and connection removal system implemented according to the requirements.

---

## 1. Connection Removal

### API Endpoint
```
DELETE /wfzo/api/v1/connections/:id
```

### Behavior
- **Hard Delete**: Connection is permanently removed from database (not soft delete)
- **Cascade Effect**: All team members from both organizations are automatically disconnected
- **Communication Block**: No messaging allowed between any users from both organizations after removal

### Implementation Details
- File: `src/modules/connection/connection.service.ts`
- Method: `removeConnection(connectionId, email)`
- Uses: `connectionModel.findByIdAndDelete()` for hard delete

### Response
```json
{
  "success": true,
  "message": "Connection permanently removed. All team members have been automatically disconnected. No messaging allowed between any users from both organizations."
}
```

### Discovery/New Chat List
- Removed connections **DO NOT** appear in `getMyConnections()` (deleted from database)
- All users from removed connection **DO NOT** appear in new chat list

---

## 2. Member-Level Blocking (Organization-Wide)

### API Endpoints

#### Block Member
```
POST /wfzo/api/v1/connections/:id/block-member
Body: { "blockedMemberId": "MEMBER-002" }
```

#### Unblock Member
```
POST /wfzo/api/v1/connections/:id/unblock-member
Body: { "unblockedMemberId": "MEMBER-002" }
```

### 🔴 Block Cascade Rule (Critical)

When **Member A blocks Member B**:

1. **All Users Blocked**: Creates block entries for ALL user combinations:
   - Each user from Member A → Each user from Member B
   - Each user from Member B → Each user from Member A

2. **Block Type**: `'member-to-member'` (tracked in `connection.blockedUsers[].blockType`)

3. **Metadata Stored**:
   ```javascript
   {
     blockedBy: "MEMBER-001",        // Member who initiated block
     memberBlockedAt: Date,           // Timestamp
     memberBlockLevel: "member-to-member"
   }
   ```

### Messaging Rules After Member Block

#### Member A and ALL Team Members of A:
- ❌ **Cannot send** messages to Member B or any team member of B
- Block entry: `isBlocker: true`

#### Member B and ALL Team Members of B:
- ✅ **CAN send** messages
- ❌ Messages **NOT delivered** to Member A or any team member of A
- ✅ Messages **stored and visible only to sender** (silent block)
- Block entry: `isBlocker: false`

### Implementation Details

**File**: `src/modules/connection/connection.service.ts`

**Method**: `blockMember(connectionId, email, blockedMemberId)`

**Logic**:
```typescript
// Get all users from both members
const blockerUsers = blockerMember.userSnapshots || [];
const blockedUsers = blockedMember.userSnapshots || [];

// Create block entries for ALL user combinations
for (const blockerUser of blockerUsers) {
  for (const blockedUser of blockedUsers) {
    // Blocker side: isBlocker = true (cannot send)
    newBlockEntries.push({
      blockerId: blockerUser.id,
      blockedUserId: blockedUser.id,
      blockerMemberId: blockerMemberId,
      blockedMemberId: blockedMemberId,
      blockedAt: Date.now(),
      isActive: true,
      isBlocker: true,
      blockType: 'member-to-member',
    });
    
    // Blocked side: isBlocker = false (can send but won't be delivered)
    newBlockEntries.push({
      blockerId: blockedUser.id,
      blockedUserId: blockerUser.id,
      blockerMemberId: blockedMemberId,
      blockedMemberId: blockerMemberId,
      blockedAt: Date.now(),
      isActive: true,
      isBlocker: false,
      blockType: 'member-to-member',
    });
  }
}
```

---

## 3. User-Level Blocking (Existing Behavior)

### API Endpoints

#### Block User
```
POST /wfzo/api/v1/chat/block-user
Body: { 
  "blockedUserId": "user-uuid-123",
  "blockedMemberId": "MEMBER-002" 
}
```

#### Unblock User
```
POST /wfzo/api/v1/chat/unblock-user
Body: { "blockedUserId": "user-uuid-123" }
```

### Behavior
- **Single User Block**: Only blocks specific user-to-user communication
- **Block Type**: `'user-to-user'` (tracked in `connection.blockedUsers[].blockType`)
- **Silent Block**: Same behavior as member-level (blocker restricted, blocked can send but not delivered)

### Implementation
- File: `src/modules/chat/chat.service.ts`
- Method: `blockUser(email, dto)`
- Creates single entry with `blockType: 'user-to-user'`

---

## 4. Unblocking

### Member-Level Unblock

**Method**: `unblockMember(connectionId, email, unblockedMemberId)`

**Behavior**:
- Removes **ALL** block entries where `blockType === 'member-to-member'` between the two members
- Clears member-level metadata: `blockedBy`, `memberBlockedAt`, `memberBlockLevel`
- Preserves user-level blocks (if any exist)

**Code**:
```typescript
connection.blockedUsers = connection.blockedUsers?.filter(block => {
  const isBetweenTheseMembers = 
    (block.blockerMemberId === currentMemberId && block.blockedMemberId === unblockedMemberId) ||
    (block.blockerMemberId === unblockedMemberId && block.blockedMemberId === currentMemberId);
  
  const isMemberBlock = block.blockType === 'member-to-member';
  
  return !(isBetweenTheseMembers && isMemberBlock); // Remove member blocks only
});
```

### User-Level Unblock

**Method**: `unblockUser(email, blockedUserId)` (in ChatService)

**Behavior**:
- Deactivates single user-to-user block entry
- Does not affect member-level blocks

---

## 5. Messaging & Delivery Rules

### Enforcement Point
**File**: `src/modules/chat/chat.service.ts`  
**Method**: `sendMessage(email, dto)`

### Delivery Decision Table

| Scenario | Message Stored | Delivered | Field Set |
|----------|---------------|-----------|-----------|
| Normal connected members | ✅ | ✅ | - |
| Connection removed | ❌ | ❌ | Error thrown |
| I blocked them (user-level) | ❌ | ❌ | Error/blocked |
| They blocked me (user-level) | ✅ | ❌ | `isBlockedMessage: true` |
| Member A blocks Member B | ✅ (B side) | ❌ (A side) | `isBlockedMessage: true` |

### Block Check Logic

**Method**: `isBlockedByUser(currentUserId, otherUserId)`

Checks for **both** user-level and member-level blocks:
```typescript
const isBlocked = connection.blockedUsers.some(
  (block: any) =>
    block.blockerId === otherUserId &&
    block.blockedUserId === currentUserId &&
    block.isActive
  // Works for both 'user-to-user' and 'member-to-member' blockType
);
```

### Important Notes

1. **Silent Block**: Blocked party can send messages, but they are marked as `isBlockedMessage: true` and not delivered
2. **No Retroactive Delivery**: Messages sent during block period are **NEVER** delivered after unblock
3. **Cascade Enforcement**: Member-level blocks automatically affect all users from both members

---

## 6. Discovery & New Chat List

### GET /wfzo/api/v1/connections

**Filters Applied**:
- ✅ Returns only `status: ACCEPTED` connections
- ❌ Removed connections don't appear (deleted from DB)
- ✅ Blocked members **DO appear** (blocked ≠ removed)

### Response Structure (Enhanced)

```json
{
  "success": true,
  "data": [
    {
      "connectionId": "conn-123",
      "member": {
        "memberId": "MEMBER-002",
        "organisationInfo": { ... },
        "primaryUsers": [
          {
            "userId": "user-uuid-1",
            "email": "owner@company.com",
            "firstName": "John",
            "blockStatus": {
              "isBlocked": true,
              "iBlockedThem": true,
              "theyBlockedMe": false
            }
          }
        ],
        "secondaryUsers": [
          {
            "userId": "user-uuid-2",
            "email": "staff@company.com",
            "firstName": "Jane",
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
          "blockedAt": "2026-01-21T..."
        }
      },
      "connectedAt": "2026-01-15T...",
      "status": "accepted"
    }
  ]
}
```

### Block Status Fields

**Per User** (`blockStatus`):
- `isBlocked`: True if ANY block exists (user-level or member-level)
- `iBlockedThem`: True if current user blocked this user
- `theyBlockedMe`: True if this user blocked current user

**Per Member** (`memberBlockStatus`):
- `isBlocked`: True if member-level block exists
- `blockedBy`: Member ID who initiated block
- `blockedAt`: Timestamp of member-level block

---

## 7. Connection Schema Updates

### New Fields

```typescript
@Prop({ type: Date })
memberBlockedAt?: Date; // Timestamp when member-level block was initiated

@Prop({ type: String })
memberBlockLevel?: 'none' | 'member-to-member' | 'user-to-user';

@Prop({ type: Date })
removedAt?: Date; // Timestamp when connection was removed (not used with hard delete)

@Prop({ type: String })
removedBy?: string; // Member ID who removed (not used with hard delete)
```

### Updated blockedUsers Array

```typescript
blockedUsers?: Array<{
  blockerId: string;
  blockedUserId: string;
  blockerMemberId: string;
  blockedMemberId: string;
  blockedAt: Date;
  isActive: boolean;
  isBlocker: boolean; // TRUE = blocker (can't send), FALSE = blocked (can send but won't be delivered)
  blockType: 'member-to-member' | 'user-to-user'; // NEW: Distinguish block types
}>;
```

### ConnectionStatus Enum

```typescript
export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
  REMOVED = 'removed', // NEW (but connections are hard-deleted)
}
```

---

## 8. Testing Scenarios

### Test Case 1: Member-to-Member Block
1. Member A blocks Member B
2. Verify ALL users from A cannot send to ANY users from B
3. Verify users from B can send but messages not delivered to A users
4. Check `memberBlockStatus.isBlocked = true` in connections list

### Test Case 2: Member-to-Member Unblock
1. Member A unblocks Member B
2. Verify ALL member-level blocks removed
3. Verify user-level blocks (if any) still exist
4. Check `memberBlockStatus.isBlocked = false`

### Test Case 3: Connection Removal
1. Member A removes connection with Member B
2. Verify connection hard-deleted from database
3. Verify Member B doesn't appear in A's connections list
4. Verify messaging fails with "not connected" error

### Test Case 4: User-to-User Block
1. User 1 blocks User 2 (same connection, not member-level)
2. Verify only User 1 ↔ User 2 blocked
3. Verify other users from both members can still communicate
4. Check `blockStatus.iBlockedThem = true` for User 2

### Test Case 5: Mixed Blocks
1. Member A blocks Member B (organization-wide)
2. User 1 from A also has user-level block on User 3 from C
3. Verify both blocks tracked separately with correct `blockType`
4. Unblock member-level: verify user-level block remains

---

## 9. API Summary

| Endpoint | Method | Purpose | Effect |
|----------|--------|---------|--------|
| `/connections/:id` | DELETE | Remove connection | Hard delete, all users disconnected |
| `/connections/:id/block-member` | POST | Block member (org-wide) | All users blocked both ways |
| `/connections/:id/unblock-member` | POST | Unblock member | Remove all member-level blocks |
| `/chat/block-user` | POST | Block specific user | Single user-to-user block |
| `/chat/unblock-user` | POST | Unblock specific user | Remove user-level block |
| `/connections` | GET | List connections | Includes blocked state for all users |

---

## 10. Files Modified

### Schema Changes
- `src/modules/connection/schemas/connection.schema.ts` - Added member-level block fields, blockType
- `src/modules/connection/dto/connection.dto.ts` - Added BlockMemberDto, UnblockMemberDto

### Service Layer
- `src/modules/connection/connection.service.ts` - Added blockMember, unblockMember, removeConnection, enhanced getMyConnections
- `src/modules/chat/chat.service.ts` - Updated blockUser to set blockType: 'user-to-user'

### Controller Layer
- `src/modules/connection/connection.controller.ts` - Added DELETE /:id, POST /:id/block-member, POST /:id/unblock-member

---

## 11. Important Notes

### ✅ Completed Features
- Member-to-member blocking with full cascade
- User-to-user blocking (existing + enhanced)
- Connection removal (hard delete)
- Block state in connections listing API
- Silent block behavior (send but not delivered)
- Proper block type tracking

### ⏳ Pending Features (Not Yet Implemented)
- Report functionality (member/user reporting)
- Email notifications for reports (admin + acknowledgment)
- Automated email templates

### 🔑 Key Design Decisions
1. **Hard Delete**: Connections permanently removed (no soft delete)
2. **Dual-Entry Blocks**: For member-level blocks, create 2 entries per user pair (blocker side + blocked side)
3. **Silent Block**: Blocked party unaware, messages stored but not delivered
4. **Block Type Tracking**: Distinguish member-level vs user-level blocks for proper unblock logic
5. **Discovery**: Blocked members still visible in lists with blocked state

---

## 12. Troubleshooting

### Issue: Member block not cascading to all users
- Check: `blockerMember.userSnapshots` and `blockedMember.userSnapshots` have users
- Verify: Block entries created with `blockType: 'member-to-member'`
- Log count: Should see `blockerUsers.length * blockedUsers.length * 2` entries

### Issue: Messages still delivered after block
- Check: `isBlockedByUser()` method called in `sendMessage()`
- Verify: Block entry has `isActive: true`
- Verify: Block entry exists for recipient blocking sender

### Issue: Unblock not working
- Check: Filter logic in `unblockMember()` correctly identifies member-to-member blocks
- Verify: Both members' IDs checked in both directions
- Check: `blockType === 'member-to-member'` filter applied

### Issue: Removed connection still appears
- Check: Connection actually deleted from database (hard delete)
- Verify: `getMyConnections()` filter includes `status: ACCEPTED`
- Since hard delete used, connection shouldn't exist at all

---

## End of Implementation Guide
