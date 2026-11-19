export interface ProjectTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  mainFile: string;
  files: Record<string, string>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'empty',
    name: 'Empty Python Project',
    nameAr: 'مشروع فارغ',
    description: 'Clean directory with a minimal main.py entry point.',
    mainFile: 'main.py',
    files: {
      'main.py': '# Empty Python Project\n\nprint("Ready.")\n',
    },
  },
  {
    id: 'basic',
    name: 'Basic Python Project',
    nameAr: 'مشروع Python أساسي',
    description: 'Standard Python script layout with main() guard and requirements.txt.',
    mainFile: 'main.py',
    files: {
      'main.py': `def main():\n    name = "PyLab Studio"\n    print(f"Hello from {name}!")\n\nif __name__ == "__main__":\n    main()\n`,
      'requirements.txt': '# Add dependencies here\n',
      'README.md': '# Basic Python Project\n\nRun `python main.py` to execute.\n',
    },
  },
  {
    id: 'multifile',
    name: 'Multi-File Python Project',
    nameAr: 'مشروع متعدد الملفات',
    description: 'Modular package layout separating models, utilities, and main entry.',
    mainFile: 'main.py',
    files: {
      'main.py': `from utils.math_ops import add, multiply\nfrom models.user import User\n\ndef main():\n    u = User("Sara", "sara@example.com")\n    print(u.describe())\n    print("Sum:", add(12, 8))\n    print("Product:", multiply(6, 7))\n\nif __name__ == "__main__":\n    main()\n`,
      'utils/__init__.py': '',
      'utils/math_ops.py': `def add(a: float, b: float) -> float:\n    return a + b\n\ndef multiply(a: float, b: float) -> float:\n    return a * b\n`,
      'models/__init__.py': '',
      'models/user.py': `class User:\n    def __init__(self, name: str, email: str):\n        self.name = name\n        self.email = email\n\n    def describe(self) -> str:\n        return f"User<{self.name} | {self.email}>"\n`,
      'requirements.txt': '',
    },
  },
  {
    id: 'flask',
    name: 'Flask Web Project',
    nameAr: 'تطبيق ويب Flask',
    description: 'Local Flask server with HTML route and JSON API endpoint.',
    mainFile: 'app.py',
    files: {
      'app.py': `import os\nfrom flask import Flask, jsonify\n\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return """\n    <!doctype html>\n    <html lang="en">\n    <head><meta charset="utf-8"><title>PyLab Flask App</title></head>\n    <body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:40px;">\n      <h1>PyLab Studio — Local Flask Server</h1>\n      <p>Running directly on local Python runtime.</p>\n      <p><a href="/api/status" style="color:#a78bfa;">View JSON API Status</a></p>\n    </body>\n    </html>\n    """\n\n@app.route("/api/status")\ndef status():\n    return jsonify({"app": "PyLab Flask", "status": "running", "framework": "Flask"})\n\nif __name__ == "__main__":\n    port = int(os.environ.get("PORT", 5200))\n    host = os.environ.get("HOST", "127.0.0.1")\n    app.run(host=host, port=port, debug=False)\n`,
      'requirements.txt': 'flask\n',
      'README.md': '# Flask Web Project\nInstall `flask` via Package Manager, then launch in Web Servers tab.\n',
    },
  },
  {
    id: 'fastapi',
    name: 'FastAPI Project',
    nameAr: 'مشروع FastAPI',
    description: 'ASGI REST API template with FastAPI and Uvicorn.',
    mainFile: 'main.py',
    files: {
      'main.py': `import os\nfrom fastapi import FastAPI\n\napp = FastAPI(title="PyLab FastAPI Service")\n\n@app.get("/")\ndef read_root():\n    return {"service": "PyLab FastAPI", "status": "ok"}\n\n@app.get("/items/{item_id}")\ndef read_item(item_id: int, q: str = ""):\n    return {"item_id": item_id, "query": q}\n`,
      'requirements.txt': 'fastapi\nuvicorn\n',
      'README.md': '# FastAPI Project\nRequires fastapi and uvicorn packages.\n',
    },
  },
  {
    id: 'automation',
    name: 'Automation Project',
    nameAr: 'مشروع أتمتة',
    description: 'Batch file organizer, logger, and automated task runner.',
    mainFile: 'automate.py',
    files: {
      'automate.py': `import os\nimport json\nfrom datetime import datetime\nfrom pathlib import Path\n\ndef run_audit(target_dir: str = "."):\n    report = {\n        "timestamp": datetime.now().isoformat(),\n        "files": []\n    }\n    for p in Path(target_dir).iterdir():\n        if p.is_file():\n            report["files"].append({"name": p.name, "size": p.stat().st_size})\n    Path("audit_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")\n    print(f"Audited {len(report['files'])} files -> audit_report.json")\n\nif __name__ == "__main__":\n    run_audit()\n`,
      'requirements.txt': '',
    },
  },
  {
    id: 'data',
    name: 'Data Processing Project',
    nameAr: 'مشروع معالجة بيانات',
    description: 'CSV & statistics pipeline using Python standard library csv and statistics.',
    mainFile: 'pipeline.py',
    files: {
      'pipeline.py': `import csv\nimport statistics\n\nwith open("sales.csv", "w", newline="", encoding="utf-8") as f:\n    writer = csv.writer(f)\n    writer.writerow(["product", "units", "revenue"])\n    writer.writerow(["Notebook", 14, 420])\n    writer.writerow(["Pen Set", 35, 315])\n    writer.writerow(["Lamp", 8, 640])\n\nrevenues = []\nwith open("sales.csv", "r", encoding="utf-8") as f:\n    for row in csv.DictReader(f):\n        revenues.append(float(row["revenue"]))\n\nprint("Total Revenue:", sum(revenues))\nprint("Mean Revenue:", round(statistics.mean(revenues), 2))\n`,
      'requirements.txt': '',
    },
  },
  {
    id: 'sqlite',
    name: 'SQLite Database Project',
    nameAr: 'مشروع قاعدة بيانات SQLite',
    description: 'Persistent local SQLite CRUD application with parameterized queries.',
    mainFile: 'db_app.py',
    files: {
      'db_app.py': `import sqlite3\n\ndef init_db(conn):\n    conn.execute("""\n        CREATE TABLE IF NOT EXISTS tasks (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            title TEXT NOT NULL,\n            done INTEGER DEFAULT 0\n        )\n    """)\n    conn.commit()\n\ndef main():\n    conn = sqlite3.connect("tasks.db")\n    init_db(conn)\n    conn.execute("DELETE FROM tasks")\n    conn.executemany("INSERT INTO tasks (title, done) VALUES (?, ?)", [\n        ("Design schema", 1),\n        ("Write CRUD queries", 0),\n        ("Verify persistence", 0),\n    ])\n    conn.commit()\n    for row in conn.execute("SELECT id, title, done FROM tasks").fetchall():\n        print(f"#{row[0]} [{'x' if row[2] else ' '}] {row[1]}")\n    conn.close()\n\nif __name__ == "__main__":\n    main()\n`,
      'requirements.txt': '',
    },
  },
  {
    id: 'package',
    name: 'Python Package Project',
    nameAr: 'مشروع حزمة Python',
    description: 'Structured Python library package with unit tests and pyproject.toml.',
    mainFile: 'run_tests.py',
    files: {
      'mypkg/__init__.py': 'from .core import format_currency\n__all__ = ["format_currency"]\n',
      'mypkg/core.py': `def format_currency(amount: float, currency: str = "USD") -> str:\n    return f"{amount:,.2f} {currency}"\n`,
      'tests/test_core.py': `import unittest\nfrom mypkg import format_currency\n\nclass TestCore(unittest.TestCase):\n    def test_format(self):\n        self.assertEqual(format_currency(1250.5), "1,250.50 USD")\n\nif __name__ == "__main__":\n    unittest.main()\n`,
      'run_tests.py': `import unittest\nloader = unittest.TestLoader()\nsuite = loader.discover("tests")\nrunner = unittest.TextTestRunner(verbosity=2)\nrunner.run(suite)\n`,
      'pyproject.toml': `[project]\nname = "mypkg"\nversion = "0.1.0"\n`,
    },
  },
];
