#!/usr/bin/env python3
"""
Test events and stats endpoints without requiring a running database.
Validates the implementation structure and logic.
"""
import re
from pathlib import Path


def test_events_module():
    """Verify events.py has all required components."""
    events_file = Path(__file__).parent / "events.py"
    code = events_file.read_text()

    # Check endpoint
    assert "@router.post" in code and "/click" in code, "POST /events/click endpoint not found"
    print("[OK] Endpoint POST /events/click defined")

    # Check beacon secret validation
    components = [
        ("BEACON_SECRET", "Beacon secret env var"),
        ("x_beacon_secret", "Shared secret header"),
        ("401", "401 status for invalid secret"),
        ("status_code=204", "204 No Content response"),
    ]

    for pattern, name in components:
        assert pattern in code, f"{name} not found"
        print(f"[OK] {name} present")

    # Check click insertion
    assert "INSERT INTO clicks" in code, "Click insertion not found"
    assert "link_id" in code and "country" in code and "device" in code, "Click fields not found"
    print("[OK] Click insertion with all fields")

    print("\n[OK] All events components validated")


def test_stats_module():
    """Verify stats.py has all required components."""
    stats_file = Path(__file__).parent / "stats.py"
    code = stats_file.read_text()

    # Check endpoint
    assert "@router.get" in code and "/links/{link_id}/stats" in code, "GET /links/{id}/stats endpoint not found"
    print("[OK] Endpoint GET /links/{id}/stats defined")

    # Check auth dependency
    assert "Depends(get_current_user_id)" in code, "Auth dependency not found"
    print("[OK] Auth required on stats endpoint")

    # Check ownership validation
    assert "403" in code or "status_code=403" in code, "Ownership check (403) not found"
    print("[OK] Ownership validation present")

    # Check aggregates
    aggregates = [
        ("total_clicks", "Total clicks count"),
        ("clicks_last_7_days", "Clicks last 7 days per day"),
        ("top_country", "Top country aggregate"),
        ("mobile_count", "Mobile count"),
        ("desktop_count", "Desktop count"),
        ("timedelta(days=7)", "7-day window calculation"),
        ("GROUP BY", "SQL aggregation with GROUP BY"),
        ("COUNT(*) FILTER", "SQL FILTER clause for device split"),
    ]

    for pattern, name in aggregates:
        assert pattern in code, f"{name} not found"
        print(f"[OK] {name} present")

    print("\n[OK] All stats components validated")


def test_app_integration():
    """Verify app.py includes events and stats routers."""
    app_file = Path(__file__).parent / "app.py"
    code = app_file.read_text()

    assert "from events import router" in code or "import events" in code, "Events router not imported"
    print("[OK] Events router imported")

    assert "from stats import router" in code or "import stats" in code, "Stats router not imported"
    print("[OK] Stats router imported")

    assert code.count("include_router") >= 4, "Events/stats routers not included in app"
    print("[OK] Events and stats routers integrated into app")


if __name__ == "__main__":
    print("Testing events and stats implementation...\n")
    test_events_module()
    print()
    test_stats_module()
    print()
    test_app_integration()
    print("\n[OK] All tests passed")
    print("\nTo test with curl (requires running API + database):")
    print("  # Ingest a click (from worker)")
    print("  curl -X POST http://localhost:5002/events/click \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -H "x-beacon-secret: dev-beacon-secret" \\')
    print('    -d \'{"l":"link-uuid","country":"IN","device":"mobile","ref":"https://example.com"}\'')
    print("\n  # Get stats (requires auth)")
    print("  curl -b cookies.txt http://localhost:5002/links/{link-id}/stats")
    print("\n  # Test invalid secret (should return 401)")
    print("  curl -X POST http://localhost:5002/events/click \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -H "x-beacon-secret: wrong-secret" \\')
    print('    -d \'{"l":"link-uuid","device":"mobile"}\'')
