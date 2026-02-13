#!/bin/bash

# Keycloak Setup Script
# This script creates a realm, client, and configures Keycloak for WFZO application

set -e

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="wfzo"
CLIENT_ID="wfzo-frontend"
FRONTEND_URL="http://localhost:3000"

echo "🔧 Setting up Keycloak for WFZO..."

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

# Create realm
echo "📝 Creating realm: ${REALM_NAME}..."
REALM_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"realm\": \"${REALM_NAME}\",
    \"enabled\": true,
    \"displayName\": \"WFZO\",
    \"displayNameHtml\": \"<b>World FZO</b>\",
    \"registrationAllowed\": false,
    \"loginWithEmailAllowed\": true,
    \"duplicateEmailsAllowed\": false,
    \"resetPasswordAllowed\": true,
    \"editUsernameAllowed\": false,
    \"bruteForceProtected\": true,
    \"accessTokenLifespan\": 3600,
    \"ssoSessionIdleTimeout\": 1800,
    \"ssoSessionMaxLifespan\": 36000
  }")

HTTP_CODE=$(echo "$REALM_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Realm created or already exists"
else
  echo "⚠️  Realm creation returned status: $HTTP_CODE"
fi

# Create client
echo "📝 Creating client: ${CLIENT_ID}..."
CLIENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"${CLIENT_ID}\",
    \"name\": \"WFZO Frontend\",
    \"description\": \"WFZO Frontend Application\",
    \"enabled\": true,
    \"publicClient\": true,
    \"directAccessGrantsEnabled\": true,
    \"standardFlowEnabled\": true,
    \"implicitFlowEnabled\": false,
    \"serviceAccountsEnabled\": false,
    \"protocol\": \"openid-connect\",
    \"redirectUris\": [
      \"${FRONTEND_URL}/*\",
      \"http://localhost:3000/*\"
    ],
    \"webOrigins\": [
      \"${FRONTEND_URL}\",
      \"http://localhost:3000\"
    ],
    \"attributes\": {
      \"pkce.code.challenge.method\": \"S256\"
    }
  }")

HTTP_CODE=$(echo "$CLIENT_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Client created or already exists"
else
  echo "⚠️  Client creation returned status: $HTTP_CODE"
fi

# Create a backend client for admin operations
echo "📝 Creating backend client: wfzo-backend..."
BACKEND_CLIENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"wfzo-backend\",
    \"name\": \"WFZO Backend\",
    \"description\": \"WFZO Backend API Service\",
    \"enabled\": true,
    \"publicClient\": false,
    \"directAccessGrantsEnabled\": false,
    \"standardFlowEnabled\": false,
    \"serviceAccountsEnabled\": true,
    \"protocol\": \"openid-connect\",
    \"clientAuthenticatorType\": \"client-secret\"
  }")

HTTP_CODE=$(echo "$BACKEND_CLIENT_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Backend client created or already exists"
  
  # Get the client secret for backend
  echo "📝 Retrieving backend client secret..."
  
  # Get client UUID
  CLIENT_UUID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=wfzo-backend" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
  
  if [ -n "$CLIENT_UUID" ] && [ "$CLIENT_UUID" != "null" ]; then
    CLIENT_SECRET=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/client-secret" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.value')
    
    echo ""
    echo "================================================"
    echo "🔑 BACKEND CLIENT SECRET:"
    echo "   ${CLIENT_SECRET}"
    echo "================================================"
    echo ""
    echo "Add this to your .env file:"
    echo "KEYCLOAK_CLIENT_SECRET=${CLIENT_SECRET}"
    echo ""
  fi
else
  echo "⚠️  Backend client creation returned status: $HTTP_CODE"
fi

echo ""
echo "✅ Keycloak setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "   Keycloak URL:  ${KEYCLOAK_URL}"
echo "   Realm:         ${REALM_NAME}"
echo "   Client ID:     ${CLIENT_ID}"
echo "   Backend Client: wfzo-backend"
echo ""
echo "🌐 Access Keycloak Admin Console:"
echo "   URL:      ${KEYCLOAK_URL}/admin"
echo "   Username: ${ADMIN_USER}"
echo "   Password: ${ADMIN_PASSWORD}"
echo ""
echo "🔧 Add these to your .env files:"
echo ""
echo "Backend (.env):"
echo "KEYCLOAK_URL=http://localhost:8080"
echo "KEYCLOAK_REALM=wfzo"
echo "KEYCLOAK_CLIENT_ID=wfzo-backend"
echo "KEYCLOAK_CLIENT_SECRET=${CLIENT_SECRET:-<run script again to get secret>}"
echo "AUTH_PROVIDER=keycloak"
echo ""
echo "Frontend (.env.local):"
echo "NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080"
echo "NEXT_PUBLIC_KEYCLOAK_REALM=wfzo"
echo "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=wfzo-frontend"
echo "NEXT_PUBLIC_AUTH_PROVIDER=keycloak"
echo ""
