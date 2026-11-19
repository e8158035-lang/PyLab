#!/usr/bin/env python3
"""
PyLab Studio Real Pip Engine (PyPI JSON + Wheel Installer + Metadata Manager).
Installs real Python packages into an isolated target directory without requiring system root.
"""
import sys
import os
import json
import re
import shutil
import zipfile
import urllib.request
import urllib.error
import importlib.metadata
from pathlib import Path


def normalize_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower().strip()


def fetch_pypi_json(pkg_name: str, version: str | None = None) -> dict:
    norm = normalize_name(pkg_name)
    url = f"https://pypi.org/pypi/{norm}/{version}/json" if version else f"https://pypi.org/pypi/{norm}/json"
    req = urllib.request.Request(url, headers={"User-Agent": "PyLabStudio-Pip/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def pick_best_wheel(urls: list[dict]) -> tuple[dict | None, str]:
    """
    Prefer pure-Python universal wheels (py3-none-any / py2.py3-none-any),
    then compatible Linux x86_64/aarch64 wheels for current host runtime.
    Returns (url_entry, compatibility_note).
    """
    wheels = [u for u in urls if u.get("packagetype") == "bdist_wheel" and u.get("filename", "").endswith(".whl")]
    # 1. Pure Python wheel
    for w in wheels:
        fn = w["filename"]
        if fn.endswith("-py3-none-any.whl") or fn.endswith("-py2.py3-none-any.whl"):
            return w, "Pure Python wheel (py3-none-any) — fully compatible with local runtime and Android Chaquopy."
    # 2. Check current platform wheels (cp311 manylinux)
    import platform
    arch = platform.machine().lower()
    py_tag = f"cp{sys.version_info.major}{sys.version_info.minor}"
    for w in wheels:
        fn = w["filename"]
        if py_tag in fn and ("manylinux" in fn or "linux" in fn) and (arch in fn or "any" in fn):
            return w, f"Native wheel ({fn}) — runs on Linux x86_64/ARM64; on Android requires Chaquopy/NDK prebuilt wheel."
    # 3. Any cp3/abi3 linux wheel
    for w in wheels:
        fn = w["filename"]
        if "abi3" in fn and ("manylinux" in fn or "linux" in fn) and arch in fn:
            return w, f"ABI3 wheel ({fn}) — native C extension; on Android requires Chaquopy build."
    return None, "No compatible binary wheel found for this environment (requires C/Rust compilation)."


def parse_req_line(req_str: str) -> tuple[str, bool]:
    """Return (package_name, should_install) filtering out optional extras and unmatched markers."""
    if ";" in req_str:
        pkg_part, marker_part = req_str.split(";", 1)
        marker_lower = marker_part.lower()
        if "extra ==" in marker_lower or "extra==" in marker_lower:
            return "", False
        if "sys_platform" in marker_lower and "linux" not in marker_lower and "!=" not in marker_lower:
            return "", False
        if "platform_system" in marker_lower and "linux" not in marker_lower and "!=" not in marker_lower:
            return "", False
        if "python_version" in marker_lower:
            # Skip legacy python < 3.11 markers
            if "<" in marker_lower and ("'3.8'" in marker_lower or "'3.9'" in marker_lower or "'3.10'" in marker_lower or '"3.8"' in marker_lower or '"3.9"' in marker_lower or '"3.10"' in marker_lower):
                return "", False
    else:
        pkg_part = req_str
    # Strip extras like pkg[security]
    pkg_part = re.sub(r"\[.*?\]", "", pkg_part).strip()
    m = re.match(r"^([A-Za-z0-9._-]+)", pkg_part)
    if not m:
        return "", False
    return m.group(1), True


def get_installed_dists(target_dir: str) -> dict[str, dict]:
    dists = {}
    if not os.path.isdir(target_dir):
        return dists
    for dist in importlib.metadata.distributions(path=[target_dir]):
        meta = dist.metadata
        name = meta.get("Name") or ""
        if not name:
            continue
        norm = normalize_name(name)
        requires = dist.requires or []
        dists[norm] = {
            "name": name,
            "normalized": norm,
            "version": dist.version,
            "summary": meta.get("Summary") or "",
            "author": meta.get("Author") or meta.get("Author-email") or "",
            "license": meta.get("License") or "",
            "home_page": meta.get("Home-page") or meta.get("Project-URL") or "",
            "requires": list(requires),
            "location": target_dir,
            "dist_info": str(getattr(dist, "_path", "")),
        }
    return dists


def install_package(spec: str, target_dir: str, upgrade: bool = False, visited: set[str] | None = None, logs: list[str] | None = None) -> tuple[bool, list[str]]:
    if visited is None:
        visited = set()
    if logs is None:
        logs = []

    os.makedirs(target_dir, exist_ok=True)
    # Parse name==version or name>=version
    m = re.match(r"^([A-Za-z0-9._-]+)(?:==([A-Za-z0-9._+-]+))?", spec.strip())
    if not m:
        logs.append(f"ERROR: Invalid package specification: {spec}")
        return False, logs
    raw_name = m.group(1)
    pinned_ver = m.group(2)
    norm = normalize_name(raw_name)

    if norm in visited:
        return True, logs
    visited.add(norm)

    installed = get_installed_dists(target_dir)
    if norm in installed and not upgrade and not pinned_ver:
        logs.append(f"Requirement already satisfied: {installed[norm]['name']}=={installed[norm]['version']} in {target_dir}")
        return True, logs

    logs.append(f"Fetching package metadata for {raw_name} from PyPI...")
    try:
        data = fetch_pypi_json(raw_name, pinned_ver)
    except urllib.error.HTTPError as e:
        logs.append(f"ERROR: Could not find package '{raw_name}' on PyPI (HTTP {e.code}).")
        return False, logs
    except Exception as e:
        logs.append(f"ERROR: Network/PyPI error for '{raw_name}': {e}")
        return False, logs

    info = data.get("info", {})
    pkg_name = info.get("name", raw_name)
    pkg_ver = info.get("version", "")
    urls = data.get("urls", [])

    if norm in installed and installed[norm]["version"] == pkg_ver and not upgrade:
        logs.append(f"Requirement already satisfied: {pkg_name}=={pkg_ver}")
        return True, logs

    wheel, compat_note = pick_best_wheel(urls)
    if not wheel:
        logs.append(f"ERROR: Cannot install {pkg_name}=={pkg_ver}: {compat_note}")
        return False, logs

    # If upgrading, remove previous dist files first
    if norm in installed:
        logs.append(f"Found existing installation: {installed[norm]['name']} {installed[norm]['version']}")
        uninstall_package(raw_name, target_dir, logs)

    whl_url = wheel["url"]
    whl_name = wheel["filename"]
    tmp_whl = os.path.join(target_dir, f".tmp_{whl_name}")
    logs.append(f"Downloading {whl_name} ({wheel.get('size', 0)} bytes)...")
    try:
        req = urllib.request.Request(whl_url, headers={"User-Agent": "PyLabStudio-Pip/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp, open(tmp_whl, "wb") as out_f:
            shutil.copyfileobj(resp, out_f)
    except Exception as e:
        if os.path.exists(tmp_whl):
            os.remove(tmp_whl)
        logs.append(f"ERROR: Failed to download {whl_name}: {e}")
        return False, logs

    logs.append(f"Installing {pkg_name}=={pkg_ver} ({compat_note})...")
    try:
        with zipfile.ZipFile(tmp_whl, "r") as zf:
            # Verify no path traversal
            target_real = os.path.realpath(target_dir)
            for member in zf.namelist():
                dest = os.path.realpath(os.path.join(target_dir, member))
                if not dest.startswith(target_real + os.sep) and dest != target_real:
                    raise ValueError(f"Unsafe path in wheel: {member}")
            zf.extractall(target_dir)
    except Exception as e:
        logs.append(f"ERROR: Failed extracting wheel {whl_name}: {e}")
        return False, logs
    finally:
        if os.path.exists(tmp_whl):
            os.remove(tmp_whl)

    # Install dependencies recursively
    requires = info.get("requires_dist") or []
    for req_str in requires:
        dep_name, should = parse_req_line(req_str)
        if should and dep_name:
            ok, _ = install_package(dep_name, target_dir, upgrade=False, visited=visited, logs=logs)
            if not ok:
                logs.append(f"WARNING: Dependency {dep_name} failed to install cleanly.")

    logs.append(f"Successfully installed {pkg_name}-{pkg_ver}")
    return True, logs


def uninstall_package(pkg_name: str, target_dir: str, logs: list[str] | None = None) -> tuple[bool, list[str]]:
    if logs is None:
        logs = []
    norm = normalize_name(pkg_name)
    installed = get_installed_dists(target_dir)
    if norm not in installed:
        logs.append(f"WARNING: Skipping {pkg_name} as it is not installed.")
        return False, logs

    info = installed[norm]
    dist_info = Path(info["dist_info"])
    record_file = dist_info / "RECORD"
    removed_count = 0

    if record_file.exists():
        lines = record_file.read_text(encoding="utf-8", errors="ignore").splitlines()
        for line in lines:
            rel_path = line.split(",")[0].strip()
            if not rel_path or rel_path.startswith(".."):
                continue
            full_path = Path(target_dir) / rel_path
            if full_path.exists() and full_path.is_file():
                try:
                    full_path.unlink()
                    removed_count += 1
                except Exception:
                    pass
    if dist_info.exists():
        shutil.rmtree(dist_info, ignore_errors=True)

    # Clean empty top-level directories
    for root, dirs, files in os.walk(target_dir, topdown=False):
        if root == target_dir:
            continue
        if not dirs and not files:
            try:
                os.rmdir(root)
            except Exception:
                pass

    logs.append(f"Successfully uninstalled {info['name']}-{info['version']} ({removed_count} files removed)")
    return True, logs


def check_dependencies(target_dir: str) -> dict:
    installed = get_installed_dists(target_dir)
    issues = []
    for norm, dist in installed.items():
        for req_str in dist["requires"]:
            dep_name, should = parse_req_line(req_str)
            if should and dep_name:
                dep_norm = normalize_name(dep_name)
                if dep_norm not in installed:
                    issues.append(f"{dist['name']} {dist['version']} requires {dep_name}, which is not installed.")
    return {"ok": len(issues) == 0, "issues": issues}


def inspect_pypi_compat(pkg_name: str) -> dict:
    try:
        data = fetch_pypi_json(pkg_name)
        info = data.get("info", {})
        urls = data.get("urls", [])
        wheel, note = pick_best_wheel(urls)
        is_pure = any(
            u.get("filename", "").endswith(("-py3-none-any.whl", "-py2.py3-none-any.whl"))
            for u in urls
        )
        if is_pure:
            status = "compatible"
        elif wheel is not None:
            status = "partial"
        else:
            status = "requires_setup"
        return {
            "ok": True,
            "name": info.get("name", pkg_name),
            "version": info.get("version", ""),
            "summary": info.get("summary", ""),
            "author": info.get("author", ""),
            "license": info.get("license", ""),
            "home_page": info.get("home_page") or info.get("project_url") or "",
            "requires_python": info.get("requires_python") or "",
            "requires_dist": info.get("requires_dist") or [],
            "compatibility": status,
            "compatibility_note": note,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "Usage: pylab_pip.py <target_dir> <command> [args...]"}))
        sys.exit(1)

    target_dir = sys.argv[1]
    cmd = sys.argv[2]
    args = sys.argv[3:]

    if cmd == "list":
        dists = get_installed_dists(target_dir)
        print(json.dumps({"ok": True, "packages": list(dists.values())}))
    elif cmd == "freeze":
        dists = get_installed_dists(target_dir)
        lines = [f"{d['name']}=={d['version']}" for d in sorted(dists.values(), key=lambda x: x["name"].lower())]
        print(json.dumps({"ok": True, "freeze": "\n".join(lines), "lines": lines}))
    elif cmd == "show":
        if not args:
            print(json.dumps({"ok": False, "error": "Package name required"}))
            sys.exit(1)
        norm = normalize_name(args[0])
        dists = get_installed_dists(target_dir)
        if norm in dists:
            print(json.dumps({"ok": True, "installed": True, "package": dists[norm]}))
        else:
            info = inspect_pypi_compat(args[0])
            info["installed"] = False
            print(json.dumps(info))
    elif cmd == "inspect":
        if not args:
            print(json.dumps({"ok": False, "error": "Package name required"}))
            sys.exit(1)
        print(json.dumps(inspect_pypi_compat(args[0])))
    elif cmd == "check":
        res = check_dependencies(target_dir)
        print(json.dumps({"ok": True, **res}))
    elif cmd == "install":
        upgrade = "--upgrade" in args or "-U" in args
        specs = [a for a in args if not a.startswith("-")]
        if not specs:
            print(json.dumps({"ok": False, "error": "No package specified"}))
            sys.exit(1)
        all_logs = []
        all_ok = True
        for spec in specs:
            ok, logs = install_package(spec, target_dir, upgrade=upgrade)
            all_logs.extend(logs)
            if not ok:
                all_ok = False
        print(json.dumps({"ok": all_ok, "logs": all_logs}))
    elif cmd == "uninstall":
        specs = [a for a in args if not a.startswith("-")]
        if not specs:
            print(json.dumps({"ok": False, "error": "No package specified"}))
            sys.exit(1)
        all_logs = []
        all_ok = True
        for spec in specs:
            ok, logs = uninstall_package(spec, target_dir)
            all_logs.extend(logs)
            if not ok:
                all_ok = False
        print(json.dumps({"ok": all_ok, "logs": all_logs}))
    else:
        print(json.dumps({"ok": False, "error": f"Unknown pip command: {cmd}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
