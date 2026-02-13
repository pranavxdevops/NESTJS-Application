# Quick Start - Testing New Chat Features

## Step 1: Restart Server

```bash
npm run start:dev
```

Wait for: `Application is running on: http://localhost:3000`

---

## Step 2: Get Authentication Token

Login and get your Bearer token (use your existing auth flow).

```bash
export TOKEN="your-jwt-token-here"
```

---

## Step 3: Test Star/Unstar

### Star a conversation
```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/star \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otherMemberId": "MEMBER-002",
    "otherUserId": "user-456"
  }'
```

**Expected**: `{ "success": true, "message": "Conversation starred successfully" }`

### Verify in conversations
```bash
curl -X GET "http://localhost:3000/wfzo/api/v1/chat/conversations?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Look for**: `"isStarred": true`

### Unstar
```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/unstar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otherMemberId": "MEMBER-002",
    "otherUserId": "user-456"
  }'
```

---

## Step 4: Test Block/Unblock

### Block a user
```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/block-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blockedUserId": "user-789",
    "blockedMemberId": "MEMBER-003"
  }'
```

**Expected**: `{ "success": true, "message": "User blocked successfully" }`

### Test blocking enforcement
Now login as the blocked user and try to send a message:

```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer $BLOCKED_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "YOUR_MEMBER_ID",
    "recipientUserId": "YOUR_USER_ID",
    "content": "This should fail"
  }'
```

**Expected**: `{ "statusCode": 403, "message": "You cannot send messages to this user. They have blocked you." }`

### Get blocked users list
```bash
curl -X GET http://localhost:3000/wfzo/api/v1/chat/blocked-users \
  -H "Authorization: Bearer $TOKEN"
```

### Unblock
```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/unblock-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blockedUserId": "user-789"
  }'
```

---

## Step 5: Test Delete Message

### Send a test message
```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "MEMBER-002",
    "recipientUserId": "user-456",
    "content": "Test message to delete"
  }'
```

**Save the message ID from response**: `"_id": "507f1f77bcf86cd799439011"`

### Delete the message
```bash
curl -X DELETE http://localhost:3000/wfzo/api/v1/chat/message/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: `{ "success": true, "message": "Message deleted successfully" }`

### Verify deletion
```bash
curl -X GET "http://localhost:3000/wfzo/api/v1/chat/messages?otherMemberId=MEMBER-002&otherUserId=user-456" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Message should NOT appear in the list

---

## Step 6: Verify Backward Compatibility

### Send regular message (should still work)
```bash
curl -X POST http://localhost:3000/wfzo/api/v1/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "MEMBER-002",
    "content": "Regular message"
  }'
```

### Get conversations (should include isStarred field but work as before)
```bash
curl -X GET "http://localhost:3000/wfzo/api/v1/chat/conversations" \
  -H "Authorization: Bearer $TOKEN"
```

### Mark as read (unchanged)
```bash
curl -X PUT http://localhost:3000/wfzo/api/v1/chat/mark-read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otherMemberId": "MEMBER-002"
  }'
```

---

## Common Issues

### Server won't start
- Check MongoDB is running
- Check for port 3000 conflicts
- Review terminal output for errors

### 401 Unauthorized
- Token expired - get new one
- Check Authorization header format: `Bearer <token>`

### 404 Not Found
- Check member IDs and user IDs are correct
- Verify endpoint URLs (base: `/wfzo/api/v1/chat`)

### 403 Forbidden (blocking)
- This is expected when blocked user tries to send
- Check block status with GET /blocked-users

---

## Success Criteria

✅ Star/unstar works and persists  
✅ isStarred appears in conversations  
✅ Block prevents message sending  
✅ Blocked user gets 403 error  
✅ Unblock restores messaging  
✅ Delete removes message from view  
✅ Deleted message stays deleted after refresh  
✅ All existing endpoints still work  

---

## Next Steps

1. ✅ Test all endpoints above
2. Share `FRONTEND_MIGRATION_GUIDE.md` with frontend team
3. Monitor server logs during testing
4. Report any issues

---

## Documentation

- **Full Feature Guide**: `CHAT_ADVANCED_FEATURES.md`
- **API Reference**: `CHAT_API_REFERENCE.md`
- **Frontend Guide**: `FRONTEND_MIGRATION_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

**All features implemented and ready to test!** 🎉
