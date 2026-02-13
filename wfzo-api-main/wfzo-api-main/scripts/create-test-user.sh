#!/bin/bash

# Create Test User in Keycloak
# This script creates a test user for development/testing purposes

set -e

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="wfzo"

# Test user details
TEST_EMAIL="testuser@wfzo.org"
TEST_USERNAME="testuser"
TEST_PASSWORD="Test@1234"
TEST_FIRSTNAME="Test"
TEST_LASTNAME="User"

echo "🔧 Creating test user in Keycloak..."

# Get admin access token
echo "📝 Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
  echo "❌ Failed to get admin token. Is Keycloak running?"
  exit 1
fi

echo "✅ Admin token obtained"

# Create test user
echo "📝 Creating test user: ${TEST_EMAIL}..."
USER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${TEST_USERNAME}\",
    \"email\": \"${TEST_EMAIL}\",
    \"firstName\": \"${TEST_FIRSTNAME}\",
    \"lastName\": \"${TEST_LASTNAME}\",
    \"enabled\": true,
    \"emailVerified\": true,
    \"credentials\": [
      {
        \"type\": \"password\",
        \"value\": \"${TEST_PASSWORD}\",
        \"temporary\": false
      }
    ]
  }")

HTTP_CODE=$(echo "$USER_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Test user created successfully!"
  echo ""
  echo "================================================"
  echo "🧪 TEST USER CREDENTIALS:"
  echo "   Email:    ${TEST_EMAIL}"
  echo "   Username: ${TEST_USERNAME}"
  echo "   Password: ${TEST_PASSWORD}"
  echo "================================================"
  echo ""
  echo "You can now use these credentials to test the login form:"
  echo "1. Start frontend: cd wfzo-frontend && npm run dev"
  echo "2. Open: http://localhost:3000"
  echo "3. Use the KeycloakLoginForm component"
  echo "4. Login with username: ${TEST_USERNAME} and password: ${TEST_PASSWORD}"
  echo ""
elif [ "$HTTP_CODE" -eq 409 ]; then
  echo "⚠️  Test user already exists!"
  echo ""
  echo "Credentials:"
  echo "   Username: ${TEST_USERNAME}"
  echo "   Password: ${TEST_PASSWORD}"
  echo ""
  echo "If you forgot the password, delete the user and run this script again."
else
  echo "❌ Failed to create test user (HTTP ${HTTP_CODE})"
  echo "$USER_RESPONSE"
  exit 1
fi
