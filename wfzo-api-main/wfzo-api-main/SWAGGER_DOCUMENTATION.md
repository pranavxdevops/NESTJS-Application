# Swagger API Documentation - User-Level Chat & Connections

## Overview
The Swagger/OpenAPI documentation has been updated to reflect the new user-level chat and connections functionality. All endpoints are fully documented with request/response examples.

## Accessing Swagger Documentation

**URL:** `http://localhost:3001/docs` (or your deployed URL + `/docs`)

The documentation is organized into two main sections:
- **Chat** - Message sending, conversations, and file uploads
- **Connections** - Connection management with user discovery

## Updated Endpoints

### Chat Endpoints

#### 1. POST /chat/send
**Summary:** Send a message

**Description:** Send a text, image, or document message to a member or specific user. Supports Member↔Member, User↔User, and Member↔User chat.

**Request Body:**
```json
{
  "recipientId": "MEMBER-002",           // Required: Recipient member ID
  "recipientUserId": "user-456",         // Optional: For user-level chat
  "content": "Hello!",                   // Required: Message content
  "type": "text",                        // Optional: text | image | document
  "fileUrl": "https://...",             // Optional: Required for image/document
  "fileName": "file.pdf",               // Optional: Required for image/document
  "fileSize": 102400,                   // Optional: Required for image/document
  "mimeType": "application/pdf"         // Optional: Required for image/document
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "senderId": "MEMBER-001",
    "recipientId": "MEMBER-002",
    "senderUserId": "user-123",
    "recipientUserId": "user-456",
    "content": "Hello!",
    "type": "text",
    "isRead": false,
    "createdAt": "2026-01-13T10:00:00.000Z",
    "updatedAt": "2026-01-13T10:00:00.000Z"
  }
}
```

#### 2. GET /chat/conversations
**Summary:** Get conversations list

**Description:** Get list of all conversations (members and users) with whom the current user has exchanged messages. Includes last message and unread count. Now supports user-level conversations.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "member": {
        "_id": "507f1f77bcf86cd799439011",
        "memberId": "MEMBER-002",
        "companyName": "ABC Corp",
        "logo": "https://...",
        "address": {
          "city": "Dubai",
          "country": "UAE"
        }
      },
      "user": {
        "userId": "user-456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@abc.com",
        "userType": "Secondary",
        "profileImageUrl": "https://..."
      },
      "lastMessage": {
        "content": "Hello!",
        "senderId": "MEMBER-001",
        "createdAt": "2026-01-13T10:00:00.000Z",
        "isRead": false
      },
      "unreadCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "hasMore": true
  }
}
```

**Note:** The `user` field is `null` for member-only conversations.

#### 3. GET /chat/messages
**Summary:** Get messages with a member or user

**Description:** Get paginated messages between current user and another member or specific user. For member-to-member chat, only provide otherMemberId. For user-to-user chat, provide both otherMemberId and otherUserId.

**Query Parameters:**
- `otherMemberId` (required): Member ID of the other party
- `otherUserId` (optional): User ID for user-level chat
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 50)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "senderId": "MEMBER-001",
      "recipientId": "MEMBER-002",
      "senderUserId": "user-123",
      "recipientUserId": "user-456",
      "content": "Hello!",
      "type": "text",
      "isRead": true,
      "readAt": "2026-01-13T10:05:00.000Z",
      "createdAt": "2026-01-13T10:00:00.000Z",
      "updatedAt": "2026-01-13T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 120,
    "hasMore": true
  }
}
```

#### 4. PUT /chat/mark-read
**Summary:** Mark messages as read

**Description:** Mark all unread messages from a specific member or user as read. For member-to-member chat, only provide otherMemberId. For user-to-user chat, provide both otherMemberId and otherUserId.

**Request Body:**
```json
{
  "otherMemberId": "MEMBER-002",    // Required
  "otherUserId": "user-456"         // Optional: For user-level chat
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "modifiedCount": 5
  }
}
```

#### 5. POST /chat/upload
**Summary:** Upload a file for chat

**Description:** Upload an image or document to be sent in a chat message. Returns file URL and metadata to be used in sendMessage endpoint.

**Request:** `multipart/form-data`
- `file`: Binary file (image or document)

**Response Example:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileUrl": "https://...",
    "fileName": "document.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "type": "document"
  }
}
```

### Connection Endpoints

#### GET /connections
**Summary:** Get my connections

**Description:** Get list of accepted connections. **Now includes users array** from userSnapshots for each connected member, enabling user-to-user chat discovery.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 10)
- `search` (optional): Search by company name, city, state, or country

**Response Example:**
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "connectionId": "507f1f77bcf86cd799439011",
        "member": {
          "memberId": "MEMBER-002",
          "organisationInfo": {
            "companyName": "ABC Corp",
            "memberLogoUrl": "https://...",
            "address": {
              "city": "Dubai",
              "country": "UAE"
            },
            "industries": ["Technology", "Finance"]
          }
        },
        "users": [
          {
            "userId": "user-123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@abc.com",
            "userType": "Primary",
            "profileImageUrl": "https://...",
            "designation": "CEO"
          },
          {
            "userId": "user-456",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@abc.com",
            "userType": "Secondary",
            "profileImageUrl": "https://...",
            "designation": "Manager"
          }
        ],
        "connectedAt": "2026-01-13T10:00:00.000Z",
        "status": "accepted"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## Key Swagger Features

### 1. API Tags
Endpoints are organized by tags:
- `Chat` - All chat-related endpoints
- `Connections` - All connection-related endpoints

### 2. Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

Use the **Authorize** button in Swagger UI to set your token.

### 3. Try It Out
Each endpoint has a "Try it out" button in Swagger UI that allows you to:
- Fill in request parameters
- Execute the request
- See the actual response

### 4. Schema Examples
All DTOs include detailed examples showing:
- Required vs optional fields
- Field descriptions
- Expected data types
- Example values

### 5. Response Status Codes
Each endpoint documents possible responses:
- `200` / `201` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)

## User-Level Chat Flow in Swagger

### Step 1: Get Connections with Users
```
GET /connections
```
Response includes `users` array for each member.

### Step 2: Send Message to Specific User
```
POST /chat/send
{
  "recipientId": "MEMBER-002",
  "recipientUserId": "user-456",  // User from step 1
  "content": "Hello John!"
}
```

### Step 3: View Conversations
```
GET /chat/conversations
```
Shows both member and user conversations with `user` field populated.

### Step 4: Get Messages with User
```
GET /chat/messages?otherMemberId=MEMBER-002&otherUserId=user-456
```

### Step 5: Mark Messages as Read
```
PUT /chat/mark-read
{
  "otherMemberId": "MEMBER-002",
  "otherUserId": "user-456"
}
```

## Testing in Swagger UI

1. **Open Swagger:** Navigate to `/docs` on your API server
2. **Authenticate:** Click "Authorize" and enter your Bearer token
3. **Expand Chat Section:** Click on "Chat" tag
4. **Test Send Message:**
   - Click on `POST /chat/send`
   - Click "Try it out"
   - Fill in the request body (try both with and without `recipientUserId`)
   - Click "Execute"
   - View the response

5. **Test Conversations:**
   - Click on `GET /chat/conversations`
   - Click "Try it out"
   - Click "Execute"
   - Notice `user` field in responses for user-level chats

6. **Test Connections:**
   - Click on "Connections" tag
   - Click on `GET /connections`
   - Click "Try it out"
   - Click "Execute"
   - Notice `users` array in each connection

## Backward Compatibility

All existing API calls work unchanged:

### Member-to-Member Chat (Still Works)
```json
POST /chat/send
{
  "recipientId": "MEMBER-002",
  "content": "Hello!"
}
```

### Get Member Messages (Still Works)
```
GET /chat/messages?otherMemberId=MEMBER-002
```

The new optional fields (`recipientUserId`, `otherUserId`) are clearly marked as **optional** in Swagger.

## API Property Decorators Used

The following NestJS Swagger decorators are used:

- `@ApiTags()` - Groups endpoints by category
- `@ApiBearerAuth()` - Indicates Bearer token required
- `@ApiOperation()` - Endpoint summary and description
- `@ApiBody()` - Request body schema
- `@ApiQuery()` - Query parameter documentation
- `@ApiParam()` - Path parameter documentation
- `@ApiResponse()` - Response documentation with examples
- `@ApiProperty()` - Required DTO properties
- `@ApiPropertyOptional()` - Optional DTO properties
- `@ApiConsumes()` - Content type (e.g., multipart/form-data)

## Summary

✅ Complete Swagger documentation for all chat endpoints
✅ Detailed request/response examples
✅ User-level chat features clearly documented
✅ Backward compatibility preserved
✅ Interactive testing via Swagger UI
✅ Authentication documentation
✅ Proper API organization with tags

The Swagger documentation now provides a complete reference for developers integrating with the user-level chat and connections API.
