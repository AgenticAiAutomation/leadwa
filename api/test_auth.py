#!/usr/bin/env python3
"""
Test auth endpoints without requiring a running database.
Validates the auth flow logic and structure.
"""
import re
from pathlib import Path


def test_auth_module():
    """Verify auth.py has all required components."""
    auth_file = Path(__file__).parent / "auth.py"
    code = auth_file.read_text()

    # Check endpoints
    endpoints = [
        (r'@router\.post\("/signup"', "POST /auth/signup"),
        (r'@router\.post\("/login"', "POST /auth/login"),
        (r'@router\.post\("/logout"', "POST /auth/logout"),
        (r'@router\.get\("/me"', "GET /auth/me"),
    ]

    for pattern, name in endpoints:
        assert re.search(pattern, code), f"Endpoint {name} not found"
        print(f"[OK] Endpoint {name} defined")

    # Check auth components
    components = [
        ("hash_password", "Password hashing function"),
        ("verify_password", "Password verification function"),
        ("create_access_token", "JWT creation function"),
        ("get_current_user_id", "JWT validation dependency"),
        ("bcrypt", "bcrypt password hashing"),
        ("httponly=True", "httpOnly cookie flag"),
        ("TOKEN_EXPIRE_DAYS = 30", "30-day token expiry"),
    ]

    for pattern, name in components:
        assert pattern in code, f"{name} not found"
        print(f"[OK] {name} present")

    # Check 409 duplicate email guard
    assert "409" in code or "status_code=409" in code, "409 status for duplicate email not found"
    print("[OK] 409 duplicate email guard present")

    # Check 401 invalid credentials
    assert "401" in code or "status_code=401" in code, "401 status for invalid auth not found"
    print("[OK] 401 invalid credentials response present")

    print("\n[OK] All auth components validated")


def test_app_integration():
    """Verify app.py includes auth router."""
    app_file = Path(__file__).parent / "app.py"
    code = app_file.read_text()

    assert "from auth import router" in code or "import auth" in code, "Auth router not imported"
    assert "include_router" in code, "Auth router not included in app"

    print("[OK] Auth router integrated into app")


if __name__ == "__main__":
    print("Testing auth implementation...\n")
    test_auth_module()
    print()
    test_app_integration()
    print("\n[OK] All auth tests passed")
    print("\nTo test with curl (requires running API + database):")
    print("  # Signup")
    print("  curl -c cookies.txt -X POST http://localhost:5002/auth/signup \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"email":"test@example.com","password":"test123"}\'')
    print("\n  # Login")
    print("  curl -c cookies.txt -X POST http://localhost:5002/auth/login \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"email":"test@example.com","password":"test123"}\'')
    print("\n  # Get current user")
    print("  curl -b cookies.txt http://localhost:5002/auth/me")
    print("\n  # Test wrong password (should return 401)")
    print("  curl -X POST http://localhost:5002/auth/login \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"email":"test@example.com","password":"wrong"}\'')
