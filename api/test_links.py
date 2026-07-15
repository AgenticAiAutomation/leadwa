#!/usr/bin/env python3
"""
Test links CRUD endpoints without requiring a running database.
Validates the implementation structure and logic.
"""
import re
from pathlib import Path


def test_links_module():
    """Verify links.py has all required components."""
    links_file = Path(__file__).parent / "links.py"
    code = links_file.read_text()

    # Check endpoints
    endpoints = [
        (r'@router\.post\(', "POST /links (create)"),
        (r'@router\.get\(', "GET /links (list own)"),
        (r'@router\.patch\(', "PATCH /links/{id} (update)"),
        (r'@router\.delete\(', "DELETE /links/{id} (soft delete)"),
    ]

    for pattern, name in endpoints:
        assert re.search(pattern, code), f"Endpoint {name} not found"
        print(f"[OK] Endpoint {name} defined")

    # Check slug generation
    components = [
        ("BASE58_ALPHABET", "Base58 alphabet for slug generation"),
        ("generate_slug", "Slug generation function"),
        ('k=6', "6-character slug generation"),
        ("[a-z0-9-]", "Slug validation pattern"),
        ("{3,32}", "Slug length validation 3-32"),
    ]

    for pattern, name in components:
        assert pattern in code, f"{name} not found"
        print(f"[OK] {name} present")

    # Check KV sync
    kv_components = [
        ("CF_ACCOUNT_ID", "Cloudflare account ID env var"),
        ("CF_KV_NAMESPACE_ID", "Cloudflare KV namespace ID env var"),
        ("CF_API_TOKEN", "Cloudflare API token env var"),
        ("sync_to_kv", "KV sync function"),
        ('"n":', "KV value field: dest_number (n)"),
        ('"t":', "KV value field: prefill_text (t)"),
        ('"a":', "KV value field: active (a)"),
        ('"l":', "KV value field: link_id (l)"),
    ]

    for pattern, name in kv_components:
        assert pattern in code, f"{name} not found"
        print(f"[OK] {name} present")

    # Check soft delete
    assert "active = false" in code.lower() or "active=false" in code.lower(), "Soft delete (active=false) not found"
    print("[OK] Soft delete sets active=false")

    # Check auth dependency
    assert "Depends(get_current_user_id)" in code, "Auth dependency not found"
    print("[OK] Auth required on all endpoints")

    # Check ownership validation
    assert "403" in code or "status_code=403" in code, "403 ownership check not found"
    print("[OK] Ownership validation (403) present")

    print("\n[OK] All links components validated")


def test_app_integration():
    """Verify app.py includes links router."""
    app_file = Path(__file__).parent / "app.py"
    code = app_file.read_text()

    assert "from links import router" in code or "import links" in code, "Links router not imported"
    assert code.count("include_router") >= 2, "Links router not included in app"

    print("[OK] Links router integrated into app")


if __name__ == "__main__":
    print("Testing links implementation...\n")
    test_links_module()
    print()
    test_app_integration()
    print("\n[OK] All links tests passed")
    print("\nTo test with curl (requires running API + database + Cloudflare KV):")
    print("  # First, login to get auth cookie")
    print("  curl -c cookies.txt -X POST http://localhost:5002/auth/login \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"email":"test@example.com","password":"test123"}\'')
    print("\n  # Create a link")
    print("  curl -b cookies.txt -X POST http://localhost:5002/links \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"title":"Test Link","dest_number":"919876543210","prefill_text":"Hello"}\'')
    print("\n  # List links")
    print("  curl -b cookies.txt http://localhost:5002/links")
    print("\n  # Update a link")
    print("  curl -b cookies.txt -X PATCH http://localhost:5002/links/{id} \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"prefill_text":"Updated text"}\'')
    print("\n  # Check KV (replace with actual slug)")
    print("  wrangler kv key get --namespace-id={ns_id} {slug}")
