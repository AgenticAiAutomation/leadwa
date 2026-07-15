#!/usr/bin/env python3
"""
Tiny migration runner: applies unapplied .sql files from migrations/ and tracks them in schema_migrations.
"""
import os
import sys
from pathlib import Path

import psycopg


DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")


def main():
    migrations_dir = Path(__file__).parent / "migrations"
    sql_files = sorted(migrations_dir.glob("*.sql"))

    if not sql_files:
        print("No migration files found.")
        return

    with psycopg.connect(DB_URL) as conn:
        # Create schema_migrations table if it doesn't exist
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    filename TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
            conn.commit()

            # Get already applied migrations
            cur.execute("SELECT filename FROM schema_migrations")
            applied = {row[0] for row in cur.fetchall()}

        # Apply unapplied migrations
        for sql_file in sql_files:
            filename = sql_file.name
            if filename in applied:
                print(f"✓ {filename} (already applied)")
                continue

            print(f"Applying {filename}...", end=" ")
            sql = sql_file.read_text(encoding="utf-8")

            with conn.cursor() as cur:
                cur.execute(sql)
                cur.execute(
                    "INSERT INTO schema_migrations (filename) VALUES (%s)",
                    (filename,)
                )
                conn.commit()

            print("✓")

    print("All migrations applied.")


if __name__ == "__main__":
    main()
