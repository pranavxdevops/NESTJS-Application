# Test Login Credentials

## Mock Authentication Mode

The application is currently configured to use **mock authentication** for testing purposes.

### Configuration

In `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### Test Credentials

When mock authentication is enabled, you can log in with **ANY** email and password combination.

**Example credentials:**
- Email: `test@gmail.com`
- Password: `password123`

Or use any other email/password - all combinations will work in mock mode.

### Mock User Details

When you log in, you'll be authenticated as:
- **Name**: Test User
- **Email**: The email you entered
- **Role**: Admin
- **ID**: mock-user-id-123

### Mock Member Data

The dashboard will display 4 mock members with different statuses:

1. **John Doe** - Tech Solutions Inc.
   - Status: PENDING
   - Stage: COMMITTEE

2. **Jane Smith** - Global Exports Ltd.
   - Status: PENDING
   - Stage: BOARD

3. **Bob Johnson** - Manufacturing Co.
   - Status: APPROVED
   - Stage: PAYMENT

4. **Alice Williams** - Retail Ventures
   - Status: REJECTED
   - Stage: COMMITTEE

### Disabling Mock Mode

To connect to the real API, change `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

Then restart the development server.

### Running the Application

```bash
npm run dev
```

The application will start on **http://localhost:3002**
