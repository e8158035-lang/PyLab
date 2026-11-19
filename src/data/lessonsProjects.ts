import type { AppliedProjectLesson } from '../types/pylab';

export const APPLIED_PROJECTS: AppliedProjectLesson[] = [
  {
    id: 'proj-beginner-calc',
    level: 'beginner',
    title: 'آلة حاسبة متقدمة ومحول وحدات',
    idea: 'بناء آلة حاسبة تدعم العمليات الحسابية الأساسية وتحويل الوحدات (حرارة، مسافات) عبر دوال منظمة.',
    requirements: ['Python 3.11 (لا يتطلب مكتبات خارجية)'],
    steps: [
      'تعريف دوال العمليات الحسابية مع معالجة القسمة على صفر.',
      'تعريف دوال التحويل بين Celsius و Fahrenheit و KM و Miles.',
      'تشغيل اختبارات سريعة للتحقق من دقة النتائج.',
    ],
    mainFile: 'main.py',
    files: {
      'main.py': `def calc(a: float, op: str, b: float) -> float:\n    if op == "+": return a + b\n    if op == "-": return a - b\n    if op == "*": return a * b\n    if op == "/":\n        if b == 0: raise ZeroDivisionError("Cannot divide by zero")\n        return a / b\n    raise ValueError(f"Unknown operator: {op}")\n\ndef c_to_f(c: float) -> float:\n    return round((c * 9 / 5) + 32, 2)\n\ndef km_to_miles(km: float) -> float:\n    return round(km * 0.621371, 3)\n\nif __name__ == "__main__":\n    print("12 * 8 =", calc(12, "*", 8))\n    print("37°C =", c_to_f(37), "°F")\n    print("10 km =", km_to_miles(10), "miles")\n`,
    },
    codeExplanation: [
      'calc(a, op, b): تستخدم شروطاً واضحة مع رفع استثناء عند القسمة على صفر.',
      'c_to_f و km_to_miles: دوال نقية تعيد قيماً مقربة.',
    ],
    runInstructions: 'اضغط تشغيل مباشر داخل Playground أو افتحه في محرر المشروع.',
    expectedOutput: '12 * 8 = 96\n37°C = 98.6 °F\n10 km = 6.214 miles',
    extraChallenges: ['أضف دالة تحويل العملات.', 'احفظ سجل العمليات في قائمة واطبعه.'],
  },
  {
    id: 'proj-beginner-passwords',
    level: 'beginner',
    title: 'مولد كلمات مرور آمنة وحساب الدرجات',
    idea: 'توليد كلمات مرور عشوائية آمنة تشفيرياً باستخدام secrets وتقييم درجات الطلاب.',
    requirements: ['Python 3.11 (مكتبات secrets و string القياسية)'],
    steps: [
      'استخدام secrets.choice لتوليد كلمات مرور عشوائية.',
      'حساب المعدل والتقدير اللفظي للطلاب.',
    ],
    mainFile: 'main.py',
    files: {
      'main.py': `import secrets\nimport string\n\ndef generate_password(length: int = 12) -> str:\n    alphabet = string.ascii_letters + string.digits + "!@#$%"\n    return "".join(secrets.choice(alphabet) for _ in range(length))\n\ndef grade_report(scores: list[int]) -> dict:\n    avg = sum(scores) / len(scores)\n    rank = "A" if avg >= 90 else "B" if avg >= 80 else "C" if avg >= 70 else "Pass"\n    return {"average": round(avg, 2), "rank": rank}\n\nif __name__ == "__main__":\n    print("Generated Password:", generate_password(14))\n    print("Grade Report:", grade_report([92, 88, 95, 84]))\n`,
    },
    codeExplanation: ['مكتبة secrets أكثر أماناً من random عند توليد كلمات المرور.'],
    runInstructions: 'شغّل الملف لمشاهدة كلمة مرور عشوائية وتقرير الدرجات.',
    expectedOutput: "Generated Password: ...\nGrade Report: {'average': 89.75, 'rank': 'B'}",
    extraChallenges: ['اشترط احتواء كلمة المرور على رقم واحد ورمز واحد على الأقل.'],
  },
  {
    id: 'proj-intermediate-students-sqlite',
    level: 'intermediate',
    title: 'نظام إدارة الطلاب ودفتر الملاحظات بـ SQLite',
    idea: 'تطبيق متكامل لإدارة بيانات الطلاب والبحث والترتيب مع التخزين الدائم في SQLite.',
    requirements: ['sqlite3 (مدمجة في Python)'],
    steps: [
      'إنشاء جدول students وتحديد الحقول.',
      'كتابة دوال CRUD (إضافة، عرض، تعديل، حذف).',
      'تجربة الاستعلامات الآمنة بـ Parameters.',
    ],
    mainFile: 'main.py',
    files: {
      'main.py': `import sqlite3\n\nclass SchoolManager:\n    def __init__(self, db_file="school.db"):\n        self.conn = sqlite3.connect(db_file)\n        self.conn.execute("""\n            CREATE TABLE IF NOT EXISTS students (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                name TEXT NOT NULL,\n                major TEXT NOT NULL,\n                gpa REAL NOT NULL\n            )\n        """)\n        self.conn.commit()\n\n    def add_student(self, name: str, major: str, gpa: float):\n        self.conn.execute("INSERT INTO students (name, major, gpa) VALUES (?, ?, ?)", (name, major, gpa))\n        self.conn.commit()\n\n    def list_students(self):\n        return self.conn.execute("SELECT id, name, major, gpa FROM students ORDER BY gpa DESC").fetchall()\n\n    def close(self):\n        self.conn.close()\n\nif __name__ == "__main__":\n    mgr = SchoolManager(":memory:")\n    mgr.add_student("عمر", "علوم الحاسب", 3.9)\n    mgr.add_student("ليلى", "هندسة البرمجيات", 3.75)\n    for row in mgr.list_students():\n        print(row)\n    mgr.close()\n`,
    },
    codeExplanation: ['يغلف SchoolManager الاتصال ويحمي الاستعلامات بالمعاملات.'],
    runInstructions: 'قم بالتشغيل مباشرة لتجربة قاعدة البيانات.',
    expectedOutput: "(1, 'عمر', 'علوم الحاسب', 3.9)\n(2, 'ليلى', 'هندسة البرمجيات', 3.75)",
    extraChallenges: ['أضف دالة search_by_name(query) باستخدام LIKE.'],
  },
  {
    id: 'proj-intermediate-csv-analyzer',
    level: 'intermediate',
    title: 'محلل ملفات CSV وتصدير تقارير JSON',
    idea: 'قراءة بيانات المبيعات من CSV، حساب الإجماليات حسب الفئة، وتصدير ملخص JSON.',
    requirements: ['csv, json, collections (مدمجة)'],
    steps: ['كتابة بيانات CSV.', 'قراءتها بـ DictReader.', 'تجميع المبيعات وتصدير JSON.'],
    mainFile: 'main.py',
    files: {
      'main.py': `import csv\nimport json\nfrom collections import defaultdict\n\nrows = [\n    ["category", "item", "amount"],\n    ["Books", "Python Guide", "45"],\n    ["Books", "Algorithms", "60"],\n    ["Hardware", "USB Hub", "35"],\n]\nwith open("sales.csv", "w", newline="", encoding="utf-8") as f:\n    csv.writer(f).writerows(rows)\n\ntotals = defaultdict(int)\nwith open("sales.csv", "r", encoding="utf-8") as f:\n    for row in csv.DictReader(f):\n        totals[row["category"]] += int(row["amount"])\n\nreport = {"by_category": dict(totals), "grand_total": sum(totals.values())}\nprint(json.dumps(report, indent=2))\n`,
    },
    codeExplanation: ['defaultdict(int) يبدأ القيم بصفر تلقائياً لتسهيل الجمع.'],
    runInstructions: 'شغّل السكربت لقراءة sales.csv وعرض التقرير.',
    expectedOutput: '{\n  "by_category": {\n    "Books": 105,\n    "Hardware": 35\n  },\n  "grand_total": 140\n}',
    extraChallenges: ['أضف حساب متوسط الفاتورة وأعلى عنصر مبيعاً.'],
  },
  {
    id: 'proj-advanced-inventory-auth',
    level: 'advanced',
    title: 'نظام إدارة مخزون وتسجيل دخول محلي مشفر (PBKDF2 + SQLite)',
    idea: 'نظام عملي متعدد الوحدات يحفظ المستخدمين بكلمات مرور مجزأة بـ hashlib.pbkdf2_hmac ويدير المخزون في SQLite.',
    requirements: ['hashlib, os, sqlite3 (مدمجة)'],
    steps: [
      'توليد Salt وتجزئة كلمة المرور بـ PBKDF2-HMAC-SHA256.',
      'التحقق من كلمة المرور عبر secrets.compare_digest.',
      'إدارة أصناف المخزون وخصم الكميات بأمان.',
    ],
    mainFile: 'main.py',
    files: {
      'main.py': `import hashlib\nimport os\nimport secrets\nimport sqlite3\n\ndef hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:\n    salt = salt or os.urandom(16)\n    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)\n    return salt.hex(), dk.hex()\n\ndef verify_password(password: str, salt_hex: str, expected_hex: str) -> bool:\n    _, candidate = hash_password(password, bytes.fromhex(salt_hex))\n    return secrets.compare_digest(candidate, expected_hex)\n\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE users (username TEXT PRIMARY KEY, salt TEXT, hash TEXT)")\nsalt, pw_hash = hash_password("PyLab#2026")\nconn.execute("INSERT INTO users VALUES (?, ?, ?)", ("admin", salt, pw_hash))\n\nrow = conn.execute("SELECT salt, hash FROM users WHERE username = ?", ("admin",)).fetchone()\nprint("Valid login:", verify_password("PyLab#2026", row[0], row[1]))\nprint("Wrong login:", verify_password("wrong", row[0], row[1]))\n`,
    },
    codeExplanation: [
      'pbkdf2_hmac مع 100,000 دورة يحمي كلمات المرور حتى محلياً.',
      'compare_digest يمنع هجمات التوقيت Timing Attacks.',
    ],
    runInstructions: 'شغّل السكربت لاختبار التسجيل والتحقق.',
    expectedOutput: 'Valid login: True\nWrong login: False',
    extraChallenges: ['اربط النظام بجدول products لإدارة الكميات بعد تسجيل الدخول.'],
  },
];

export interface LearningBadge {
  id: string;
  title: string;
  description: string;
  requirementText: string;
}

export const LEARNING_BADGES: LearningBadge[] = [
  {
    id: 'badge-first-step',
    title: 'أول سطر برمجي',
    description: 'أكملت أول درس في مسار Python بنجاح.',
    requirementText: 'أكمل درساً واحداً على الأقل',
  },
  {
    id: 'badge-beginner-master',
    title: 'أساسيات متينة',
    description: 'أتممت جميع دروس المستوى المبتدئ.',
    requirementText: 'أكمل جميع دروس Beginner',
  },
  {
    id: 'badge-code-challenger',
    title: 'محارب التحديات',
    description: 'اجتزت 5 تحديات برمجية باختبارات حقيقية.',
    requirementText: 'حل 5 تحديات برمجية',
  },
  {
    id: 'badge-quiz-ace',
    title: 'متفوق الاختبارات',
    description: 'أنهيت 5 اختبارات بنجاح.',
    requirementText: 'اجتز 5 اختبارات',
  },
  {
    id: 'badge-python-architect',
    title: 'مهندس Python محترف',
    description: 'أتممت 12 درساً عبر المستويات المتقدمة والاحترافية.',
    requirementText: 'أكمل 12 درساً في المسار',
  },
];
