#!/usr/bin/env python3
"""
PyLab Studio Safe ZIP Import/Export Utility with Zip-Slip Path Traversal Protection.
"""
import sys
import os
import json
import zipfile
from pathlib import Path


def inspect_zip(zip_path: str) -> dict:
    with zipfile.ZipFile(zip_path, "r") as zf:
        bad = zf.testzip()
        if bad is not None:
            return {"ok": False, "error": f"Corrupted archive entry: {bad}"}
        entries = []
        for info in zf.infolist():
            entries.append({
                "filename": info.filename,
                "size": info.file_size,
                "compressed_size": info.compress_size,
                "is_dir": info.is_dir(),
            })
        return {"ok": True, "entries": entries}


def extract_zip(zip_path: str, dest_dir: str) -> dict:
    os.makedirs(dest_dir, exist_ok=True)
    dest_real = os.path.realpath(dest_dir)
    extracted = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        bad = zf.testzip()
        if bad is not None:
            return {"ok": False, "error": f"Corrupted archive entry: {bad}"}

        # Detect single common root folder to flatten cleanly if appropriate
        names = [i.filename for i in zf.infolist() if not i.is_dir()]
        for info in zf.infolist():
            member = info.filename
            if member.startswith("/") or member.startswith("\\") or ".." in Path(member).parts:
                return {"ok": False, "error": f"Blocked unsafe archive path (Zip-Slip protection): {member}"}
            target_path = os.path.realpath(os.path.join(dest_real, member))
            if target_path != dest_real and not target_path.startswith(dest_real + os.sep):
                return {"ok": False, "error": f"Blocked path traversal outside project directory: {member}"}

        for info in zf.infolist():
            zf.extract(info, dest_real)
            if not info.is_dir():
                extracted.append(info.filename)

    return {"ok": True, "extracted": extracted, "count": len(extracted)}


def export_zip(src_dir: str, out_zip: str, exclude_temp: bool = True) -> dict:
    src_real = os.path.realpath(src_dir)
    os.makedirs(os.path.dirname(os.path.realpath(out_zip)), exist_ok=True)
    count = 0
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(src_real):
            if exclude_temp:
                dirs[:] = [d for d in dirs if d not in ("__pycache__", ".git", ".pytest_cache", ".venv", "venv")]
            for fn in files:
                if exclude_temp and (fn.endswith(".pyc") or fn.endswith(".pyo") or fn == ".DS_Store"):
                    continue
                full = os.path.join(root, fn)
                rel = os.path.relpath(full, src_real)
                zf.write(full, rel)
                count += 1
    return {"ok": True, "files_archived": count, "size": os.path.getsize(out_zip)}


def main():
    cmd = sys.argv[1]
    if cmd == "inspect":
        print(json.dumps(inspect_zip(sys.argv[2])))
    elif cmd == "extract":
        print(json.dumps(extract_zip(sys.argv[2], sys.argv[3])))
    elif cmd == "export":
        exclude_temp = sys.argv[4].lower() != "false" if len(sys.argv) > 4 else True
        print(json.dumps(export_zip(sys.argv[2], sys.argv[3], exclude_temp)))
    else:
        print(json.dumps({"ok": False, "error": f"Unknown zip command: {cmd}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
