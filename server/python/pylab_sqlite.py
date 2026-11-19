#!/usr/bin/env python3
"""
PyLab Studio SQLite Persistent Storage Engine.
Persists settings, open tabs, execution history, package install logs, and learning progress in SQLite.
"""
import sys
import os
import json
import sqlite3
from datetime import datetime, timezone


def get_conn(db_path: str) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(os.path.realpath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS kv_store (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS execution_history (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            status TEXT NOT NULL,
            exit_code INTEGER,
            duration_ms INTEGER,
            started_at TEXT NOT NULL,
            output_preview TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS package_logs (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            package_name TEXT NOT NULL,
            status TEXT NOT NULL,
            log_text TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def main():
    db_path = sys.argv[1]
    op = sys.argv[2]
    conn = get_conn(db_path)
    now = datetime.now(timezone.utc).isoformat()

    try:
        if op == "kv_get":
            key = sys.argv[3]
            row = conn.execute("SELECT value FROM kv_store WHERE key = ?", (key,)).fetchone()
            print(json.dumps({"ok": True, "value": json.loads(row["value"]) if row else None}))
        elif op == "kv_set":
            key = sys.argv[3]
            payload = sys.stdin.read()
            conn.execute(
                "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
                (key, payload, now),
            )
            conn.commit()
            print(json.dumps({"ok": True}))
        elif op == "exec_add":
            data = json.loads(sys.stdin.read())
            conn.execute(
                "INSERT OR REPLACE INTO execution_history (id, project_id, file_path, status, exit_code, duration_ms, started_at, output_preview) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    data["id"],
                    data["projectId"],
                    data["filePath"],
                    data["status"],
                    data.get("exitCode"),
                    data.get("durationMs"),
                    data.get("startedAt", now),
                    (data.get("outputPreview") or "")[:400],
                ),
            )
            conn.commit()
            print(json.dumps({"ok": True}))
        elif op == "exec_list":
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 30
            rows = conn.execute(
                "SELECT * FROM execution_history ORDER BY started_at DESC LIMIT ?", (limit,)
            ).fetchall()
            print(json.dumps({"ok": True, "items": [dict(r) for r in rows]}))
        elif op == "pkg_log_add":
            data = json.loads(sys.stdin.read())
            conn.execute(
                "INSERT INTO package_logs (id, action, package_name, status, log_text, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (data["id"], data["action"], data["packageName"], data["status"], data["logText"], now),
            )
            conn.commit()
            print(json.dumps({"ok": True}))
        elif op == "pkg_log_list":
            rows = conn.execute("SELECT * FROM package_logs ORDER BY created_at DESC LIMIT 50").fetchall()
            print(json.dumps({"ok": True, "items": [dict(r) for r in rows]}))
        elif op == "export_all":
            kvs = {r["key"]: json.loads(r["value"]) for r in conn.execute("SELECT key, value FROM kv_store").fetchall()}
            print(json.dumps({"ok": True, "kv": kvs}))
        elif op == "import_all":
            data = json.loads(sys.stdin.read())
            for k, v in data.get("kv", {}).items():
                conn.execute(
                    "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
                    (k, json.dumps(v), now),
                )
            conn.commit()
            print(json.dumps({"ok": True}))
        else:
            print(json.dumps({"ok": False, "error": f"Unknown sqlite op: {op}"}))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
