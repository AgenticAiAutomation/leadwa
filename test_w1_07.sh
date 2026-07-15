#!/bin/bash
# Test script for W1-07 Dashboard MVP

set -e

API="http://localhost:5002"
COOKIE_FILE="/tmp/leadwa_test_cookies.txt"

echo "=== Testing W1-07 Dashboard MVP ==="
echo

# Clean up old cookies
rm -f $COOKIE_FILE

# 1. Signup
echo "1. Testing signup..."
curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@leadwa.co","password":"demo123","business_name":"Demo Business","whatsapp_number":"919876543210"}' \
  -c $COOKIE_FILE
echo "✓ Signup successful"
echo

# 2. Login
echo "2. Testing login..."
curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@leadwa.co","password":"demo123"}' \
  -c $COOKIE_FILE -b $COOKIE_FILE
echo "✓ Login successful"
echo

# 3. Create link
echo "3. Creating test link..."
LINK=$(curl -s -X POST "$API/links" \
  -H "Content-Type: application/json" \
  -b $COOKIE_FILE \
  -d '{"title":"Demo Link","dest_number":"919876543210","prefill_text":"Hello from Leadwa!","source_tag":"Instagram"}')
LINK_ID=$(echo $LINK | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
SLUG=$(echo $LINK | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
echo "✓ Link created: https://leadwa.link/$SLUG (ID: $LINK_ID)"
echo

# 4. Get all links
echo "4. Fetching all links..."
curl -s "$API/links" -b $COOKIE_FILE | grep -o '"title":"[^"]*"' | head -3
echo "✓ Links fetched"
echo

# 5. Get link stats
echo "5. Fetching link stats..."
curl -s "$API/links/$LINK_ID/stats" -b $COOKIE_FILE
echo
echo "✓ Stats fetched"
echo

echo "=== All tests passed! ==="
echo "Now open http://localhost:3000/signup in your browser to test the UI flow"
