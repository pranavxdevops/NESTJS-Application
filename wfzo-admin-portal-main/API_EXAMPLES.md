# API Examples & Data Structures

This document shows example API requests and responses to help you understand the data flow.

---

## 🔐 Authentication

### Login Request
```typescript
POST /internal/user/login
Content-Type: application/json

{
  "email": "committee@wfzo.com",
  "password": "SecurePassword123!"
}
```

### Login Response (Success)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-1234-5678-90ab",
    "email": "committee@wfzo.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Committee Member",
    "isActive": true
  }
}
```

### Login Response (Error)
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## 👥 Member Listing

### Request
```typescript
GET /member?page=1&limit=100
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response
```json
{
  "data": [
    {
      "id": "member-uuid-001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com",
      "phone": "+1234567890",
      "membershipType": "Gold",
      "organisationInfo": {
        "name": "Tech Innovations Inc",
        "registrationNumber": "REG001234",
        "taxId": "TAX567890",
        "industry": "Technology",
        "website": "https://techinnovations.com",
        "address": {
          "street": "123 Innovation Drive",
          "city": "San Francisco",
          "state": "CA",
          "postalCode": "94105",
          "country": "USA"
        },
        "phone": "+1234567890",
        "email": "info@techinnovations.com"
      },
      "currentStage": "COMMITTEE",
      "status": "PENDING",
      "createdAt": "2025-11-15T10:30:00Z",
      "updatedAt": "2025-11-15T10:30:00Z"
    },
    {
      "id": "member-uuid-002",
      "firstName": "Bob",
      "lastName": "Smith",
      "email": "bob@example.com",
      "phone": "+9876543210",
      "membershipType": "Silver",
      "organisationInfo": {
        "name": "Global Enterprises",
        "registrationNumber": "REG005678",
        "industry": "Finance",
        "website": "https://globalenterprises.com",
        "address": {
          "street": "456 Finance Street",
          "city": "New York",
          "state": "NY",
          "postalCode": "10001",
          "country": "USA"
        },
        "phone": "+9876543210",
        "email": "contact@globalenterprises.com"
      },
      "currentStage": "BOARD",
      "status": "PENDING",
      "committeeApproval": {
        "stage": "COMMITTEE",
        "status": "APPROVED",
        "approverName": "John Doe",
        "approverEmail": "committee@wfzo.com",
        "comment": "Strong application with excellent credentials.",
        "timestamp": "2025-11-16T14:20:00Z"
      },
      "createdAt": "2025-11-14T09:15:00Z",
      "updatedAt": "2025-11-16T14:20:00Z"
    }
  ],
  "totalCount": 2,
  "page": 1,
  "limit": 100
}
```

---

## 👤 Single Member Details

### Request
```typescript
GET /member/member-uuid-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response (Early Stage - Committee Review)
```json
{
  "id": "member-uuid-001",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "phone": "+1234567890",
  "membershipType": "Gold",
  "organisationInfo": {
    "name": "Tech Innovations Inc",
    "registrationNumber": "REG001234",
    "taxId": "TAX567890",
    "industry": "Technology",
    "website": "https://techinnovations.com",
    "address": {
      "street": "123 Innovation Drive",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "USA"
    },
    "phone": "+1234567890",
    "email": "info@techinnovations.com"
  },
  "organisationQuestionnaire": [
    {
      "question": "What is your primary business focus?",
      "answer": "Cloud computing and AI solutions"
    },
    {
      "question": "Number of employees",
      "answer": "150-200"
    }
  ],
  "consent": {
    "termsAccepted": true,
    "dataProcessingConsent": true,
    "marketingConsent": true
  },
  "currentStage": "COMMITTEE",
  "status": "PENDING",
  "createdAt": "2025-11-15T10:30:00Z",
  "updatedAt": "2025-11-15T10:30:00Z"
}
```

### Response (Advanced Stage - All Approvals Complete)
```json
{
  "id": "member-uuid-003",
  "firstName": "Carol",
  "lastName": "Williams",
  "email": "carol@example.com",
  "phone": "+1122334455",
  "membershipType": "Platinum",
  "organisationInfo": {
    "name": "Premium Services Ltd",
    "registrationNumber": "REG009988",
    "industry": "Consulting",
    "website": "https://premiumservices.com",
    "address": {
      "street": "789 Executive Blvd",
      "city": "Chicago",
      "state": "IL",
      "postalCode": "60601",
      "country": "USA"
    },
    "phone": "+1122334455",
    "email": "hello@premiumservices.com"
  },
  "consent": {
    "termsAccepted": true,
    "dataProcessingConsent": true,
    "marketingConsent": false
  },
  "currentStage": "PAYMENT",
  "status": "PENDING",
  "committeeApproval": {
    "stage": "COMMITTEE",
    "status": "APPROVED",
    "approverName": "John Doe",
    "approverEmail": "committee@wfzo.com",
    "comment": "Excellent track record and references.",
    "timestamp": "2025-11-16T10:00:00Z"
  },
  "boardApproval": {
    "stage": "BOARD",
    "status": "APPROVED",
    "approverName": "Jane Smith",
    "approverEmail": "board@wfzo.com",
    "comment": "Approved unanimously. Strong fit for our organization.",
    "timestamp": "2025-11-17T11:30:00Z"
  },
  "ceoApproval": {
    "stage": "CEO",
    "status": "APPROVED",
    "approverName": "Michael Brown",
    "approverEmail": "ceo@wfzo.com",
    "comment": "Highly recommended. Looking forward to their contribution.",
    "timestamp": "2025-11-18T09:15:00Z"
  },
  "paymentLink": "https://payment.wfzo.com/invoice/INV-2025-001",
  "paymentStatus": "PENDING",
  "createdAt": "2025-11-13T08:00:00Z",
  "updatedAt": "2025-11-18T09:15:00Z"
}
```

---

## ✅ Approve Member

### Request
```typescript
PUT /member/status/member-uuid-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "stage": "COMMITTEE",
  "status": "APPROVED",
  "comment": "Application looks good. All documents verified.",
  "approverName": "John Doe",
  "approverEmail": "committee@wfzo.com"
}
```

### Response
```json
{
  "id": "member-uuid-001",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "phone": "+1234567890",
  "membershipType": "Gold",
  "organisationInfo": {
    "name": "Tech Innovations Inc",
    "registrationNumber": "REG001234",
    "industry": "Technology",
    "website": "https://techinnovations.com",
    "address": {
      "street": "123 Innovation Drive",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "USA"
    },
    "phone": "+1234567890",
    "email": "info@techinnovations.com"
  },
  "currentStage": "BOARD",
  "status": "PENDING",
  "committeeApproval": {
    "stage": "COMMITTEE",
    "status": "APPROVED",
    "approverName": "John Doe",
    "approverEmail": "committee@wfzo.com",
    "comment": "Application looks good. All documents verified.",
    "timestamp": "2025-11-21T14:30:00Z"
  },
  "createdAt": "2025-11-15T10:30:00Z",
  "updatedAt": "2025-11-21T14:30:00Z"
}
```

---

## ❌ Reject Member

### Request
```typescript
PUT /member/status/member-uuid-004
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "stage": "BOARD",
  "status": "REJECTED",
  "comment": "Incomplete documentation. Please resubmit with required certificates.",
  "approverName": "Jane Smith",
  "approverEmail": "board@wfzo.com"
}
```

### Response
```json
{
  "id": "member-uuid-004",
  "firstName": "David",
  "lastName": "Lee",
  "email": "david@example.com",
  "membershipType": "Bronze",
  "organisationInfo": {
    "name": "Startup Ventures",
    "industry": "Technology",
    "website": "https://startupventures.com"
  },
  "currentStage": "BOARD",
  "status": "REJECTED",
  "committeeApproval": {
    "stage": "COMMITTEE",
    "status": "APPROVED",
    "approverName": "John Doe",
    "approverEmail": "committee@wfzo.com",
    "comment": "Approved with minor concerns.",
    "timestamp": "2025-11-19T10:00:00Z"
  },
  "boardApproval": {
    "stage": "BOARD",
    "status": "REJECTED",
    "approverName": "Jane Smith",
    "approverEmail": "board@wfzo.com",
    "comment": "Incomplete documentation. Please resubmit with required certificates.",
    "timestamp": "2025-11-21T15:00:00Z"
  },
  "createdAt": "2025-11-18T12:00:00Z",
  "updatedAt": "2025-11-21T15:00:00Z"
}
```

---

## 💰 Update Payment Link

### Request
```typescript
PUT /member/payment-link/member-uuid-003
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "paymentLink": "https://payment.wfzo.com/invoice/INV-2025-001"
}
```

### Response
```json
{
  "id": "member-uuid-003",
  "firstName": "Carol",
  "lastName": "Williams",
  "email": "carol@example.com",
  "membershipType": "Platinum",
  "organisationInfo": {
    "name": "Premium Services Ltd",
    "industry": "Consulting"
  },
  "currentStage": "PAYMENT",
  "status": "PENDING",
  "paymentLink": "https://payment.wfzo.com/invoice/INV-2025-001",
  "paymentStatus": "PENDING",
  "createdAt": "2025-11-13T08:00:00Z",
  "updatedAt": "2025-11-21T16:00:00Z"
}
```

---

## 💳 Update Payment Status

### Request
```typescript
PUT /member/payment-status/member-uuid-003
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "paymentStatus": "PAID"
}
```

### Response
```json
{
  "id": "member-uuid-003",
  "firstName": "Carol",
  "lastName": "Williams",
  "email": "carol@example.com",
  "membershipType": "Platinum",
  "organisationInfo": {
    "name": "Premium Services Ltd",
    "industry": "Consulting"
  },
  "currentStage": "PAYMENT",
  "status": "PAID",
  "paymentLink": "https://payment.wfzo.com/invoice/INV-2025-001",
  "paymentStatus": "PAID",
  "committeeApproval": {
    "stage": "COMMITTEE",
    "status": "APPROVED",
    "approverName": "John Doe",
    "approverEmail": "committee@wfzo.com",
    "comment": "Excellent track record and references.",
    "timestamp": "2025-11-16T10:00:00Z"
  },
  "boardApproval": {
    "stage": "BOARD",
    "status": "APPROVED",
    "approverName": "Jane Smith",
    "approverEmail": "board@wfzo.com",
    "comment": "Approved unanimously. Strong fit for our organization.",
    "timestamp": "2025-11-17T11:30:00Z"
  },
  "ceoApproval": {
    "stage": "CEO",
    "status": "APPROVED",
    "approverName": "Michael Brown",
    "approverEmail": "ceo@wfzo.com",
    "comment": "Highly recommended. Looking forward to their contribution.",
    "timestamp": "2025-11-18T09:15:00Z"
  },
  "createdAt": "2025-11-13T08:00:00Z",
  "updatedAt": "2025-11-21T16:30:00Z"
}
```

---

## 🔄 Workflow State Transitions

### Stage Progression on Approval

```
COMMITTEE → APPROVED
    ↓
currentStage: BOARD
status: PENDING

BOARD → APPROVED
    ↓
currentStage: CEO
status: PENDING

CEO → APPROVED
    ↓
currentStage: PAYMENT
status: PENDING

PAYMENT → PAID
    ↓
currentStage: PAYMENT
status: PAID
```

### Rejection at Any Stage

```
ANY_STAGE → REJECTED
    ↓
currentStage: (stays same)
status: REJECTED
(workflow ends)
```

---

## 📊 Member Status Values

| Status    | Description                              | Color  |
|-----------|------------------------------------------|--------|
| PENDING   | Awaiting approval at current stage       | Yellow |
| APPROVED  | Not used for overall status             | Green  |
| REJECTED  | Application rejected, workflow ended     | Red    |
| PAID      | Payment completed, onboarding finished   | Blue   |

---

## 🎯 Workflow Stages

| Stage      | Description                    | Next Stage After Approval |
|------------|--------------------------------|---------------------------|
| COMMITTEE  | Initial committee review       | BOARD                     |
| BOARD      | Board of directors review      | CEO                       |
| CEO        | CEO final approval             | PAYMENT                   |
| PAYMENT    | Payment processing by Admin    | (Complete)                |

---

## 🔑 Authorization Header Format

All authenticated requests must include:

```
Authorization: Bearer <JWT_TOKEN>
```

The token is obtained from the login response and stored in:
- AuthContext state
- localStorage (`wfzo_auth_user`)

Example:
```typescript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

fetch('http://localhost:3001/member', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## ⚠️ Error Responses

### 401 Unauthorized (Invalid/Missing Token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden (Insufficient Permissions)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Member not found",
  "error": "Not Found"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": [
    "comment should not be empty",
    "stage must be a valid enum value"
  ],
  "error": "Bad Request"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Approval Flow
1. Create member (via backend/Swagger)
2. Login as Committee Member → Approve
3. Login as Board Member → Approve
4. Login as CEO → Approve
5. Login as Admin → Add payment link + mark as PAID

### Scenario 2: Rejection at Board Stage
1. Create member
2. Login as Committee Member → Approve
3. Login as Board Member → Reject
4. Verify workflow stops (status = REJECTED)

### Scenario 3: Admin View
1. Login as Admin
2. View dashboard → See ALL members regardless of stage
3. View member details at any stage
4. Only able to manage payment after all 3 approvals

---

This document provides complete API examples for integration and testing!
