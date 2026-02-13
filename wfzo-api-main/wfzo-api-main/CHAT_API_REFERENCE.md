# Chat API - Complete Endpoint Reference

**Version**: 2.0 (with Advanced Features)  
**Base URL**: `/wfzo/api/v1/chat`  
**Authentication**: Bearer token required for all endpoints

---

## Core Chat Features

### 1. Send Message
**POST** `/send`

```json
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-456",  // Optional: for User Chat
  "content": "Hello!",
  "type": "text",  // "text" | "image" | "document"
  "fileUrl": "https://...",  // For image/document
  "fileName": "file.pdf",
  "fileSize": 102400,
  "mimeType": "application/pdf"
}
```

### 2. Get Conversations
**GET** `/conversations?page=1&pageSize=10`

Response includes `isStarred` field.

### 3. Get Messages
**GET** `/messages?otherMemberId=MEMBER-002&otherUserId=user-456&page=1&pageSize=50`

Automatically filters deleted messages.

### 4. Mark as Read
**PUT** `/mark-read`

```json
{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"  // Optional
}
```

### 5. Upload File
**POST** `/upload` (multipart/form-data)

Field: `file`

---

## Star / Unstar Features

### 6. Star Conversation
**POST** `/star`

```json
{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"  // Optional
}
```

### 7. Unstar Conversation
**POST** `/unstar`

```json
{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"  // Optional
}
```

---

## Block / Unblock Features

### 8. Block User
**POST** `/block-user`

```json
{
  "blockedUserId": "user-456",
  "blockedMemberId": "MEMBER-002"
}
```

### 9. Unblock User
**POST** `/unblock-user`

```json
{
  "blockedUserId": "user-456"
}
```

### 10. Get Blocked Users
**GET** `/blocked-users`

Returns list of all users you've blocked.

---

## Delete Message Features

### 11. Delete Message
**DELETE** `/message/:messageId`

Example: `DELETE /message/507f1f77bcf86cd799439011`

Only sender can delete. Soft delete (message remains in DB but filtered from views).

---

## Feature Matrix

| Feature | Member Chat | User Chat (External) | User Chat (Internal) |
|---------|-------------|---------------------|---------------------|
| Send message | ✅ | ✅ | ✅ |
| Read messages | ✅ | ✅ | ✅ |
| Mark as read | ✅ | ✅ | ✅ |
| Upload files | ✅ | ✅ | ✅ |
| Star conversation | ✅ | ✅ | ✅ |
| Block user | ❌ | ✅ | ✅ |
| Delete message | ✅ | ✅ | ✅ |

---

## Error Codes

| Code | Reason | Solution |
|------|--------|----------|
| 400 | Invalid request | Check required fields |
| 401 | Unauthorized | Provide valid Bearer token |
| 403 | Blocked or unauthorized | User is blocked or not sender |
| 404 | Not found | Member/user/message doesn't exist |

---

## Response Format

All endpoints return:

```json
{
  "success": true,
  "message": "...",  // Optional
  "data": { ... },    // Optional
  "pagination": {     // For list endpoints
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "hasMore": true
  }
}
```

---

**Total Endpoints**: 11  
**New in v2.0**: 6 endpoints (star/unstar, block/unblock, delete)  
**Backward Compatible**: 100%
