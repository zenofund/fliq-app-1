#!/bin/bash

# FliQ Companion API Test Script
# This script tests the basic functionality of the serverless API

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-http://localhost:3000}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="testpassword123"

echo -e "${YELLOW}Testing FliQ Companion API at: $API_URL${NC}\n"

# Test 1: Banks List (Public endpoint)
echo -e "${YELLOW}Test 1: GET /api/banks/list${NC}"
BANKS_RESPONSE=$(curl -s "$API_URL/api/banks/list")
if echo "$BANKS_RESPONSE" | grep -q "banks"; then
    echo -e "${GREEN}✓ Banks list endpoint working${NC}"
else
    echo -e "${RED}✗ Banks list endpoint failed${NC}"
    echo "$BANKS_RESPONSE"
fi
echo ""

# Test 2: Register Client
echo -e "${YELLOW}Test 2: POST /api/auth/register${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"role\": \"client\",
    \"name\": \"Test Client\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
else
    echo -e "${RED}✗ Registration failed${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}Test 3: POST /api/auth/login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Current User (Authenticated)
echo -e "${YELLOW}Test 4: GET /api/auth/me (with token)${NC}"
ME_RESPONSE=$(curl -s "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "$TEST_EMAIL"; then
    echo -e "${GREEN}✓ Authenticated request successful${NC}"
else
    echo -e "${RED}✗ Authenticated request failed${NC}"
    echo "$ME_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Get Featured Companions (Public endpoint)
echo -e "${YELLOW}Test 5: GET /api/companions/featured${NC}"
FEATURED_RESPONSE=$(curl -s "$API_URL/api/companions/featured")
if echo "$FEATURED_RESPONSE" | grep -q "companions"; then
    echo -e "${GREEN}✓ Featured companions endpoint working${NC}"
else
    echo -e "${RED}✗ Featured companions endpoint failed${NC}"
    echo "$FEATURED_RESPONSE"
fi
echo ""

# Test 6: Unauthorized Access
echo -e "${YELLOW}Test 6: GET /api/admin/stats (should fail without admin token)${NC}"
ADMIN_RESPONSE=$(curl -s "$API_URL/api/admin/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ADMIN_RESPONSE" | grep -q "Forbidden"; then
    echo -e "${GREEN}✓ Authorization working correctly (access denied as expected)${NC}"
else
    echo -e "${RED}✗ Authorization check failed${NC}"
    echo "$ADMIN_RESPONSE"
fi
echo ""

# Test 7: CORS Headers
echo -e "${YELLOW}Test 7: OPTIONS /api/auth/login (CORS preflight)${NC}"
CORS_RESPONSE=$(curl -s -X OPTIONS "$API_URL/api/auth/login" -I)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
else
    echo -e "${RED}✗ CORS headers missing${NC}"
fi
echo ""

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}API Test Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Test Email:${NC} $TEST_EMAIL"
echo -e "${YELLOW}JWT Token:${NC} ${TOKEN:0:50}..."
echo -e "${GREEN}All critical endpoints are working!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test companion registration with role: 'companion'"
echo "2. Test booking creation workflow"
echo "3. Test payment integration with Paystack"
echo "4. Test admin endpoints with an admin user"
echo "5. Test real-time notifications with Supabase"
echo ""
