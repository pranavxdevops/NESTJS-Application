# Report API Documentation

## Overview
The Report API allows members to report inappropriate behavior, spam, harassment, or violations. When a report is submitted, an email is automatically sent to the WFZO admin with all the details.

---

## Endpoint

**POST** `/wfzo/api/v1/report`

---

## Authentication
Requires Bearer token authentication.

---

## Request

### Headers
```http
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

### Body Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `reportedMemberId` | string | ✅ Yes | Member ID being reported | `"MEMBER-016"` |
| `reportedUserId` | string | ❌ No | User ID being reported (for user-level reports) | `"6052d5b4-663a-447a-a203-c2adbd24b61c"` |
| `reason` | string | ✅ Yes | Reason for the report (max 500 chars) | `"Sending unsolicited promotional messages repeatedly"` |

---

## Examples

### Example 1: Report Organization (Member-Level)

```bash
POST http://localhost:3001/wfzo/api/v1/report
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reportedMemberId": "MEMBER-016",
  "reason": "Sending unsolicited promotional messages repeatedly despite being asked to stop"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Report submitted successfully. WFZO admin has been notified."
}
```

---

### Example 2: Report Specific User

```bash
POST http://localhost:3001/wfzo/api/v1/report
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reportedMemberId": "MEMBER-016",
  "reportedUserId": "6052d5b4-663a-447a-a203-c2adbd24b61c",
  "reason": "Sending inappropriate and offensive personal messages in our conversations"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Report submitted successfully. WFZO admin has been notified."
}
```

---

## Error Responses

### 404 - Member Not Found
```json
{
  "statusCode": 404,
  "message": "Reported member not found",
  "error": "Not Found"
}
```

### 400 - Invalid Request
```json
{
  "statusCode": 400,
  "message": [
    "reason should not be empty",
    "reason must be shorter than or equal to 500 characters"
  ],
  "error": "Bad Request"
}
```

---

## Email Notification

When a report is submitted, **two emails** are automatically sent:

### 1. Email to WFZO Admin

**Subject:** `🚨 Member Report - 123Organisation`

**Body:**
```
🚨 NEW MEMBER REPORT

REPORTER INFORMATION:
- Member ID: MEMBER-005
- Company: WeFindZeroOut
- User: John Doe (john.doe@wfzo.com)

REPORTED PARTY:
- Member ID: MEMBER-016
- Company: 123Organisation
- User: Varun Mohan (varun.mohan@123org.com)

REASON FOR REPORT:
Sending unsolicited promotional messages repeatedly despite being asked to stop

Timestamp: 26/01/2026, 10:30:45

---
This is an automated report from WFZO platform.
You can reply to this email to contact the reporter directly.
```

### 2. Acknowledgment Email to Reported Party

**To:** Reported user's email (or primary user if organization-level report)

**Subject:** `WFZO Platform - Report Notification`

**Body:**
```
Dear [User Name],

We are writing to inform you that a concern has been raised regarding interactions on the WFZO platform.

Status: Under Review

Our team will review this matter carefully and may reach out if further information is needed. We are committed to maintaining a professional and respectful environment for all members.

If you have any questions or would like to provide additional context, please feel free to contact us.

Thank you for your cooperation.

Best regards,
WFZO Team

---
This is an automated message from WFZO Platform.
Please do not reply to this email.
```

---

## Configuration

Set the admin email in your environment variables:

```env
ADMIN_EMAIL=admin@wfzo.com
```

If not set, defaults to `admin@wfzo.com`.

---

## cURL Examples

### Report Organization
```bash
curl -X POST 'http://localhost:3001/wfzo/api/v1/report' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "reportedMemberId": "MEMBER-016",
    "reason": "Sending unsolicited promotional messages"
  }'
```

### Report Specific User
```bash
curl -X POST 'http://localhost:3001/wfzo/api/v1/report' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "reportedMemberId": "MEMBER-016",
    "reportedUserId": "6052d5b4-663a-447a-a203-c2adbd24b61c",
    "reason": "Sending inappropriate and offensive messages repeatedly"
  }'
```

---

## Postman Collection

```json
{
  "name": "Report Member",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{access_token}}"
      },
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"reportedMemberId\": \"MEMBER-016\",\n  \"reason\": \"Sending unsolicited messages\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/report",
      "host": ["{{base_url}}"],
      "path": ["report"]
    }
  }
}
```

---

## Notes

- ✅ **Two emails sent automatically:**
  1. Report details to WFZO admin
  2. Acknowledgment to reported party
- ✅ No database storage - reports are sent directly to admin via email
- ✅ Admin can reply to the report email to contact the reporter directly
- ✅ Both organization-level and user-level reports supported
- ✅ Automatic email formatting with HTML and plain text versions
- ✅ Timestamp and full context included in admin email
- ✅ Reporter's email set as reply-to for easy communication
- ✅ Simple single field (reason) - max 500 characters
- ✅ Reported party automatically notified that case is under review
- ✅ **Recipient selection:**
  - User-level report → Email sent to specific user
  - Organization-level report → Email sent to primary user
