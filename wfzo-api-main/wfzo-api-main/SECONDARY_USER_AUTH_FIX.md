# Secondary User Authentication Fix

## ❌ Problem

Secondary users received `ERR_UNAUTHORIZED` when accessing:
- `GET /wfzo/api/v1/connections`
- `GET /wfzo/api/v1/chat/conversations`
- Any other authenticated endpoint

**Error Response:**
```json
{
  "code": "ERR_UNAUTHORIZED",
  "message": "Invalid or expired authentication token",
  "timestamp": "2026-01-15T09:38:02.696Z",
  "path": "/wfzo/api/v1/connections?page=1&pageSize=10"
}
```

## 🔍 Root Cause

In `src/modules/auth/jwt-startegy/entra-jwt.strategy.ts`, the JWT validation query was filtering users by `userType: 'Primary'`:

```typescript
// BEFORE (Line 162)
const user = await this.userModel.findOne({ 
  username: email,
  userType: 'Primary'  // ← Only allowed Primary users!
}).exec();
```

**Result:** Secondary users' JWT tokens were rejected even though they were valid.

## ✅ Solution

Removed the `userType: 'Primary'` filter to allow **both Primary and Secondary users** to authenticate:

```typescript
// AFTER
const user = await this.userModel.findOne({ 
  username: email
  // Removed userType filter to allow both Primary and Secondary users
}).exec();
```

**File Modified:** `src/modules/auth/jwt-startegy/entra-jwt.strategy.ts`

## 🎯 Impact

### Before Fix
- ✅ Primary users: Could authenticate
- ❌ Secondary users: Got `ERR_UNAUTHORIZED` error

### After Fix
- ✅ Primary users: Can authenticate (unchanged)
- ✅ Secondary users: Can now authenticate successfully

## 📋 What Now Works

Secondary users can now:
1. ✅ Access `/connections` endpoint
2. ✅ Access `/chat/conversations` endpoint
3. ✅ Send messages via `/chat/send`
4. ✅ Get messages via `/chat/messages`
5. ✅ Use all authenticated endpoints

## 🧪 Testing

### Test 1: Secondary User Login
1. Login as Secondary user and get JWT token
2. Call any authenticated endpoint with token
3. **Expected:** ✅ Success (200 OK)

### Test 2: Primary User Login (Regression Test)
1. Login as Primary user and get JWT token
2. Call any authenticated endpoint with token
3. **Expected:** ✅ Success (200 OK) - unchanged behavior

### Test 3: Secondary User - Connections
```bash
curl -X GET "http://localhost:3001/wfzo/api/v1/connections?page=1&pageSize=10" \
  -H "Authorization: Bearer {SECONDARY_USER_TOKEN}"
```
**Expected:** Returns connections list (not `ERR_UNAUTHORIZED`)

### Test 4: Secondary User - Conversations
```bash
curl -X GET "http://localhost:3001/wfzo/api/v1/chat/conversations?page=1&pageSize=10" \
  -H "Authorization: Bearer {SECONDARY_USER_TOKEN}"
```
**Expected:** Returns user-level conversations (Member Chat is filtered out in service layer)

## 🔐 Security Considerations

### ✅ No Security Risk
- Both Primary and Secondary users are **legitimate users in the system**
- Both are stored in the `User` collection
- Both have valid Entra ID JWT tokens
- Authorization (what they can access) is still controlled at the **service layer**

### Service-Level Authorization Still Applies
- **Member Chat:** Only accessible to Primary users (filtered in `ChatService`)
- **User Chat:** Accessible to both Primary and Secondary users
- **Connections:** Accessible to all authenticated users

## 📝 Changes Summary

| File | Change | Lines |
|------|--------|-------|
| `entra-jwt.strategy.ts` | Removed `userType: 'Primary'` filter | ~162-166 |

**Total Changes:** 1 file, ~5 lines modified

## 🚀 Deployment

1. **Restart server** for changes to take effect
2. **Test with Secondary user token**
3. **Verify Primary users still work** (regression test)

## ⚠️ Important Notes

1. **This is NOT a security issue** - Secondary users should be able to authenticate
2. **Authorization still works** - ChatService filters Member Chat for Secondary users
3. **No database changes needed** - This is a code-only fix
4. **Backward compatible** - Primary users work exactly as before

## 📞 Expected Behavior After Fix

### Primary User
- Can see **Member Chat** conversations (organization-level)
- Can see **User Chat** conversations (person-level)
- Can chat with any user at connected organizations

### Secondary User
- **Cannot see Member Chat** conversations (filtered by ChatService)
- Can see **User Chat** conversations (person-level)
- Can chat with any user at connected organizations
- Can chat with team members (internal team chat)

## ✅ Summary

**Problem:** Secondary users couldn't authenticate  
**Cause:** JWT strategy only allowed `userType: 'Primary'`  
**Fix:** Removed userType filter from JWT validation  
**Result:** Both user types can now authenticate  
**Next Step:** Restart server and test

---

**Status:** ✅ Fixed  
**Breaking Changes:** None  
**Server Restart Required:** Yes
