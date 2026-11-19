import type { LearningLesson } from '../types/pylab';

export const ADVANCED_LESSONS: LearningLesson[] = [
  {
    id: 'lesson-14-files',
    order: 14,
    level: 'advanced',
    title: 'التعامل مع الملفات File Handling و JSON و CSV',
    titleEn: 'File I/O, UTF-8, JSON & CSV Processing',
    durationMinutes: 25,
    objectives: [
      'قراءة وكتابة وإضافة الملفات باستخدام with open(..., encoding="utf-8").',
      'معرفة أوضاع الفتح r و w و a و b.',
      'التعامل مع ملفات JSON و CSV وإدارة المسارات بـ pathlib.',
    ],
    intro:
      'البيانات المؤقتة تضيع عند إغلاق البرنامج؛ لحفظ البيانات دائماً نستخدم الملفات النصية و JSON و CSV.',
    theory: [
      'استخدم دائماً كتلة with open(...) لأنها تغلق الملف تلقائياً حتى عند حدوث خطأ.',
      'أوضاع الفتح: "r" للقراءة، "w" للكتابة (تنشئ الملف أو تستبدله)، "a" للإضافة في النهاية، و "rb"/"wb" للملفات الثنائية.',
      'مرّر دائماً encoding="utf-8" لضمان دعم اللغة العربية دون مشاكل.',
    ],
    terminology: [
      { term: 'Context Manager (with)', meaning: 'بنية تضمن فتح وإغلاق المورد (الملف) بأمان تلقائياً.' },
      { term: 'UTF-8', meaning: 'الترميز القياسي العالمي الذي يدعم العربية وجميع اللغات.' },
    ],
    syntax: `with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("سطر محفوظ\\n")`,
    howItWorks: 'تقوم دالة __exit__ في كائن الملف باستدعاء close() وتفريغ Buffer إلى القرص فور الخروج من كتلة with.',
    examples: {
      simple: {
        title: 'كتابة وقراءة وإضافة سطور لملف نصي',
        code: `with open("sample.txt", "w", encoding="utf-8") as f:\n    f.write("PyLab Studio\\n")\nwith open("sample.txt", "a", encoding="utf-8") as f:\n    f.write("سطر ثانٍ بالعربية\\n")\nwith open("sample.txt", "r", encoding="utf-8") as f:\n    print(f.read())`,
        lineByLine: ['كتابة السطر الأول، ثم الإضافة، ثم القراءة الكاملة.'],
        expectedOutput: 'PyLab Studio\nسطر ثانٍ بالعربية',
      },
      intermediate: {
        title: 'حفظ وقراءة ملف JSON بـ pathlib',
        code: `import json\nfrom pathlib import Path\n\np = Path("settings.json")\np.write_text(json.dumps({"lang": "ar", "font": 14}, indent=2), encoding="utf-8")\nloaded = json.loads(p.read_text(encoding="utf-8"))\nprint("Loaded font:", loaded["font"])`,
        lineByLine: ['pathlib توفر write_text و read_text باختصار وأمان.'],
        expectedOutput: 'Loaded font: 14',
      },
      advanced: {
        title: 'كتابة وتحليل ملف CSV',
        code: `import csv\nwith open("items.csv", "w", newline="", encoding="utf-8") as f:\n    w = csv.writer(f)\n    w.writerow(["name", "price"])\n    w.writerow(["Mouse", 25])\n    w.writerow(["Keyboard", 70])\n\nwith open("items.csv", "r", encoding="utf-8") as f:\n    total = sum(int(r["price"]) for r in csv.DictReader(f))\nprint("Total Price:", total)`,
        lineByLine: ['DictReader يقرأ كل صف كقاموس بأسماء الأعمدة.'],
        expectedOutput: 'Total Price: 95',
      },
    },
    commonErrors: [
      { error: 'UnicodeDecodeError', cause: 'قراءة ملف UTF-8 بدون تحديد الترميز على أنظمة قديمة.', fix: 'أضف encoding="utf-8" دائماً في open().' },
    ],
    practicalUses: ['حفظ الإعدادات والتقارير.', 'استيراد وتصدير جداول CSV.'],
    summary: ['with open تمنع تسرب الملفات المفتوحة.', 'استخدم json للبيانات المهيكلة و csv للجداول.'],
    reviewQuestions: ['ما الفرق بين وضع "w" ووضع "a"؟', 'لماذا نمرر newline="" عند كتابة CSV؟'],
    exercises: ['اكتب برنامجاً ينشئ ملفاً فيه 5 أسطر ثم يعد عدد الأسطر باستخدام readlines().'],
    challenge: {
      prompt: 'اكتب كوداً يحفظ القاموس {"ok": True} في ملف test.json ثم يقرؤه ويطبع قيمة ok.',
      starterCode: `import json\n`,
      testHarness: `assert "True" in __out__`,
      hint: 'json.dump({"ok": True}, open("test.json", "w")); print(json.load(open("test.json"))["ok"])',
    },
    quiz: [
      {
        id: 'q14-1',
        type: 'mcq',
        question: 'أي وضع فتح يُضيف بيانات لنهاية الملف دون مسح محتواه السابق؟',
        options: ['"a"', '"w"', '"r"', '"x"'],
        correctAnswer: '"a"',
        explanation: 'الوضع "a" (Append) يضيف للنهاية مع الحفاظ على المحتوى.',
      },
    ],
  },
  {
    id: 'lesson-15-exceptions',
    order: 15,
    level: 'advanced',
    title: 'معالجة الأخطاء والاستثناءات Exceptions و Traceback',
    titleEn: 'try, except, else, finally, raise & Custom Exceptions',
    durationMinutes: 24,
    objectives: [
      'التمييز بين Syntax Errors و Runtime Errors و Logical Errors.',
      'استخدام try / except / else / finally وقراءة Traceback.',
      'إنشاء استثناءات مخصصة باستخدام raise و class CustomError(Exception).',
    ],
    intro:
      'البرامج الاحترافية لا تنهار فجأة عند إدخال خاطئ؛ بل تلتقط الاستثناءات (Exceptions) وتتعامل معها بأمان.',
    theory: [
      'SyntaxError يُكتشف قبل التشغيل، أما Runtime Errors (مثل ZeroDivisionError, KeyError, FileNotFoundError) فتحدث أثناء التنفيذ.',
      'كتلة try تضم الكود المحتمل فشله، except تعالج الخطأ، else تُنفذ فقط إذا لم يحدث خطأ، و finally تُنفذ دائماً لتنظيف الموارد.',
      'يمكنك إطلاق خطأ بنفسك عبر raise ValueError("...") أو إنشاء صنف يرث من Exception.',
    ],
    terminology: [
      { term: 'Traceback', meaning: 'تقرير تسلسل الاستدعاءات الذي يحدد الملف والسطر الدقيق للخطأ.' },
      { term: 'Exception', meaning: 'كائن يمثل خطأً حدث وقت التشغيل ويمكن التقاطه ومعالجته.' },
    ],
    syntax: `try:
    num = int(raw)
except ValueError as e:
    print("Invalid number:", e)
else:
    print("Valid:", num)
finally:
    print("Cleanup done")`,
    howItWorks: 'عند حدوث استثناء يوقف المفسر التسلسل الطبيعي ويبحث في أقرب كتلة except مطابقة لنوع الاستثناء.',
    examples: {
      simple: {
        title: 'التقاط القسمة على صفر وتحويل النص',
        code: `def safe_div(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "خطأ: لا يمكن القسمة على صفر"\n\nprint(safe_div(10, 2))\nprint(safe_div(10, 0))`,
        lineByLine: ['التقاط ZeroDivisionError وإرجاع رسالة واضحة بدلاً من انهيار البرنامج.'],
        expectedOutput: '5.0\nخطأ: لا يمكن القسمة على صفر',
      },
      intermediate: {
        title: 'استخدام else و finally معاً',
        code: `for raw in ["42", "abc"]:\n    try:\n        val = int(raw)\n    except ValueError:\n        print(f"فشل تحويل {raw}")\n    else:\n        print(f"نجح التحويل: {val}")\n    finally:\n        print("--- انتهت المحاولة ---")`,
        lineByLine: ['else تعمل مع "42" فقط، بينما finally تعمل في الحالتين.'],
        expectedOutput: 'نجح التحويل: 42\n--- انتهت المحاولة ---\nفشل تحويل abc\n--- انتهت المحاولة ---',
      },
      advanced: {
        title: 'إنشاء استثناء مخصص Custom Exception',
        code: `class InsufficientBalanceError(Exception):\n    pass\n\ndef withdraw(balance, amount):\n    if amount > balance:\n        raise InsufficientBalanceError(f"الرصيد {balance} أقل من {amount}")\n    return balance - amount\n\ntry:\n    withdraw(100, 250)\nexcept InsufficientBalanceError as err:\n    print("تنبيه مالي:", err)`,
        lineByLine: ['تعريف صنف يرث Exception وإطلاقه عبر raise.'],
        expectedOutput: 'تنبيه مالي: الرصيد 100 أقل من 250',
      },
    },
    commonErrors: [
      { error: 'استخدام except: الفارغة', cause: 'التقاط كل الأخطاء بصمت يخفي الأخطاء البرمجية الحقيقية.', fix: 'حدد نوع الاستثناء دائماً مثل except ValueError as e.' },
    ],
    practicalUses: ['التحقق من مدخلات المستخدم.', 'التعامل مع أخطاء الشبكة والملفات.'],
    summary: ['try/except تحمي البرنامج من التوقف المفاجئ.', 'اقرأ آخر سطر في Traceback أولاً لتحديد نوع الخطأ ومكانه.'],
    reviewQuestions: ['متى تُنفذ كتلة else بعد try/except؟', 'ما فائدة finally؟'],
    exercises: ['أنشئ دالة تتحقق من العمر وتطلق ValueError إذا كان سالباً.'],
    challenge: {
      prompt: 'اكتب دالة parse_int(s) تعيد الرقم الصحيح أو -1 إذا أطلقت int(s) خطأ ValueError، ثم اطبع parse_int("x").',
      starterCode: `def parse_int(s):\n    pass\n\nprint(parse_int("x"))`,
      testHarness: `assert "-1" in __out__`,
      hint: 'try: return int(s)\nexcept ValueError: return -1',
    },
    quiz: [
      {
        id: 'q15-1',
        type: 'true_false',
        question: 'يُنفذ البلوك داخل finally فقط عند حدوث خطأ داخل try.',
        options: ['صح', 'خطأ'],
        correctAnswer: 'خطأ',
        explanation: 'finally تُنفذ في كل الأحوال سواء حدث خطأ أم لا.',
      },
    ],
  },
  {
    id: 'lesson-16-oop',
    order: 16,
    level: 'advanced',
    title: 'البرمجة الكائنية OOP: الأصناف والوراثة والتغليف وتعدد الأشكال',
    titleEn: 'Object-Oriented Programming (Classes, Inheritance, Magic Methods)',
    durationMinutes: 35,
    objectives: [
      'بناء Classes و Objects واستخدام __init__ و self.',
      'التمييز بين Instance Variables و Class Variables و @classmethod / @staticmethod.',
      'تطبيق Inheritance و Encapsulation (@property) و Polymorphism و Magic Methods (__str__, __repr__).',
    ],
    intro:
      'البرمجة الكائنية (OOP) تنظم البرنامج في كيانات (Objects) تجمع البيانات والسلوك معاً، مما يسهل بناء الأنظمة الكبيرة.',
    theory: [
      'Class هو المخطط الهندسي (Blueprint)، و Object هو النسخة الفعلية المنشأة منه. الدالة __init__ تهيئ الكائن عند إنشائه.',
      'الوراثة (Inheritance) تتيح لصنف فرعي وراثة خصائص ودوال الصنف الأب واستخدام super()، مع إمكانية إعادة تعريف الدوال (Method Overriding).',
      'التغليف (Encapsulation) يحمي البيانات الداخلية باستخدام _attr و @property للتحكم في القراءة والتعديل.',
      'Magic Methods (مثل __str__, __len__, __eq__) تتيح لكائناتك التفاعل مع دوال Python المدمجة.',
    ],
    terminology: [
      { term: 'self', meaning: 'مرجع يشير إلى الكائن الحالي داخل دوال الصنف.' },
      { term: 'Polymorphism', meaning: 'قدرة كائنات مختلفة على الاستجابة لنفس اسم الدالة بطرقها الخاصة.' },
    ],
    syntax: `class Vehicle:
    def __init__(self, brand: str):
        self.brand = brand
    def move(self):
        return f"{self.brand} moving"`,
    howItWorks: 'عند استدعاء MyClass()، يُنشئ Python الكائن ثم يستدعي __init__(instance, ...) ويمرر المرجع في self.',
    examples: {
      simple: {
        title: 'صنف بسيط مع Class Variable و __str__',
        code: `class Student:\n    school = "PyLab Academy"\n    def __init__(self, name: str, gpa: float):\n        self.name = name\n        self.gpa = gpa\n    def __str__(self):\n        return f"{self.name} ({self.gpa}) - {self.school}"\n\ns = Student("رنا", 3.9)\nprint(s)`,
        lineByLine: ['school متغير مشترك لكل الكائنات، بينما name و gpa خاصة بكل طالب.'],
        expectedOutput: 'رنا (3.9) - PyLab Academy',
      },
      intermediate: {
        title: 'الوراثة وتعدد الأشكال و super()',
        code: `class Shape:\n    def area(self) -> float:\n        return 0.0\n\nclass Rectangle(Shape):\n    def __init__(self, w, h):\n        self.w, self.h = w, h\n    def area(self) -> float:\n        return self.w * self.h\n\nshapes = [Shape(), Rectangle(4, 5)]\nprint([s.area() for s in shapes])`,
        lineByLine: ['Rectangle تعيد تعريف area() لإعطاء مساحة المستطيل.'],
        expectedOutput: '[0.0, 20]',
      },
      advanced: {
        title: 'التغليف بـ @property و @staticmethod و Composition',
        code: `class Engine:\n    def start(self): return "Engine ON"\n\nclass Car:\n    def __init__(self, speed: int = 0):\n        self.engine = Engine()\n        self._speed = speed\n    @property\n    def speed(self): return self._speed\n    @speed.setter\n    def speed(self, val):\n        if val < 0: raise ValueError("Speed cannot be negative")\n        self._speed = val\n\nc = Car(60)\nc.speed = 90\nprint(c.engine.start(), "| Speed:", c.speed)`,
        lineByLine: ['Composition: Car تمتلك كائن Engine.', '@speed.setter يتحقق من صحة القيمة.'],
        expectedOutput: 'Engine ON | Speed: 90',
      },
    },
    commonErrors: [
      { error: 'TypeError: takes 0 positional arguments but 1 was given', cause: 'نسيان معامل self في تعريف دالة داخل الكلاس.', fix: 'اجعل self أول معامل دائماً في دوال الكائن.' },
    ],
    practicalUses: ['تصميم نماذج البيانات (Users, Orders).', 'بناء ألعاب وتطبيقات واجهات رسومية.'],
    summary: ['__init__ تهيئ الخصائص.', 'الوراثة و Composition تقللان التكرار وتزيدان المرونة.'],
    reviewQuestions: ['ما الفرق بين @classmethod و @staticmethod؟', 'متى نفضل Composition على Inheritance؟'],
    exercises: ['أنشئ صنف BankAccount يدعم الإيداع والسحب مع منع السحب إذا كان الرصيد غير كافٍ.'],
    challenge: {
      prompt: 'عرّف صنف Box(w, h) يحتوي دالة volume(d) تعيد w * h * d، واطبع Box(2, 3).volume(4) -> 24.',
      starterCode: `class Box:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n    # أضف volume\n`,
      testHarness: `assert "24" in __out__`,
      hint: 'def volume(self, d): return self.w * self.h * d',
    },
    quiz: [
      {
        id: 'q16-1',
        type: 'mcq',
        question: 'أي دالة سحرية تُستدعى تلقائياً عند طباعة الكائن بـ print(obj)؟',
        options: ['__str__', '__init__', '__del__', '__call__'],
        correctAnswer: '__str__',
        explanation: 'الدالة __str__ تحدد التمثيل النصي المقروء للكائن.',
      },
    ],
  },
  {
    id: 'lesson-17-advanced-python',
    order: 17,
    level: 'advanced',
    title: 'مفاهيم متقدمة: Generators و Decorators و Dataclasses وإدارة الذاكرة',
    titleEn: 'Iterators, Generators, Decorators, Closures, Dataclasses & GC',
    durationMinutes: 30,
    objectives: [
      'بناء Generators باستخدام yield لتوفير الذاكرة.',
      'فهم Closures وكتابة Decorators.',
      'استخدام enumerate, zip, map, filter, functools.reduce, Dataclasses و Enums.',
      'فهم Memory Management و Garbage Collection.',
    ],
    intro:
      'هذه الأدوات هي ما يميز مبرمج Python المحترف في كتابة كود أنيق وعالي الكفاءة وقليل استهلاك للذاكرة.',
    theory: [
      'Generator دالة تحتوي yield: تنتج قيمة واحدة عند الطلب (Lazy Evaluation) دون تخزين مليون عنصر في RAM.',
      'Decorator دالة تأخذ دالة أخرى وتغلفها لإضافة سلوك إضافي (مثل قياس الزمن أو التحقق من الصلاحية) باستخدام @decorator.',
      '@dataclass تختصر كتابة الأصناف التي تخزن البيانات بتوليد __init__ و __repr__ و __eq__ تلقائياً.',
      'تدير Python الذاكرة عبر Reference Counting بالإضافة إلى Cyclic Garbage Collector لتحرير الكائنات غير المستخدمة.',
    ],
    terminology: [
      { term: 'yield', meaning: 'توقف الدالة مؤقتاً وتعيد قيمة مع حفظ حالتها للاستدعاء التالي.' },
      { term: 'Decorator', meaning: 'غلاف دالي يضيف سلوكاً لدالة دون تعديل مصدرها.' },
    ],
    syntax: `from dataclasses import dataclass

@dataclass
class Task:
    id: int
    title: str`,
    howItWorks: 'بناء @wrap على دالة fn يعادل fn = wrap(fn) عند تحميل الوحدة.',
    examples: {
      simple: {
        title: 'استخدام zip و enumerate و map و filter',
        code: `names = ["Ali", "Mona"]\nscores = [90, 95]\nfor idx, (n, s) in enumerate(zip(names, scores), start=1):\n    print(f"{idx}. {n} -> {s}")\nevens = list(filter(lambda x: x % 2 == 0, [1, 2, 3, 4]))\nprint("Evens:", evens)`,
        lineByLine: ['zip تربط القائمتين معاً و enumerate تضيف الترقيم.'],
        expectedOutput: '1. Ali -> 90\n2. Mona -> 95\nEvens: [2, 4]',
      },
      intermediate: {
        title: 'Generator بـ yield و Dataclass + Enum',
        code: `from dataclasses import dataclass\nfrom enum import Enum\n\nclass Priority(Enum):\n    LOW = 1\n    HIGH = 2\n\n@dataclass\nclass Ticket:\n    title: str\n    priority: Priority\n\ndef countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\nprint(Ticket("Fix bug", Priority.HIGH))\nprint("Gen:", list(countdown(4)))`,
        lineByLine: ['countdown لا تبني قائمة في الذاكرة إلا عند استهلاكها.'],
        expectedOutput: "Ticket(title='Fix bug', priority=<Priority.HIGH: 2>)\nGen: [4, 3, 2, 1]",
      },
      advanced: {
        title: 'بناء Decorator و Context Manager مخصص',
        code: `import functools\nfrom contextlib import contextmanager\n\ndef trace(fn):\n    @functools.wraps(fn)\n    def wrapper(*args, **kwargs):\n        print(f"Calling {fn.__name__}")\n        return fn(*args, **kwargs)\n    return wrapper\n\n@trace\ndef double(x): return x * 2\n\n@contextmanager\ndef section(title):\n    print(f"[{title}] start")\n    yield\n    print(f"[{title}] end")\n\nwith section("Test"):\n    print("Result:", double(7))`,
        lineByLine: ['@trace تطبع اسم الدالة قبل تنفيذها.', '@contextmanager تبسط بناء كتل with.'],
        expectedOutput: '[Test] start\nCalling double\nResult: 14\n[Test] end',
      },
    },
    commonErrors: [
      { error: 'استهلاك Generator مرتين', cause: 'الـ Generator يُستهلك مرة واحدة ثم يفرغ.', fix: 'حوّله لقائمة إذا احتجت إعادة المرور، أو أعد استدعاء الدالة.' },
    ],
    practicalUses: ['قراءة الملفات الضخمة سطراً بسطر.', 'تسجيل العمليات والتحقق من الصلاحيات عبر Decorators.'],
    summary: ['yield توفر الذاكرة.', '@dataclass تقلل الكود المكرر.', 'Decorators تفصل الاهتمامات الجانبية بنظافة.'],
    reviewQuestions: ['ما الفرق بين return و yield؟', 'لماذا نستخدم @functools.wraps؟'],
    exercises: ['اكتب Generator يولد أول 10 أعداد من متتالية فيبوناتشي.'],
    challenge: {
      prompt: 'اكتب Generator باسم gen_evens(n) يولد الأعداد الزوجية من 0 حتى n (شاملاً) واطبع list(gen_evens(6)) -> [0, 2, 4, 6].',
      starterCode: `def gen_evens(n):\n    pass\n\nprint(list(gen_evens(6)))`,
      testHarness: `assert "[0, 2, 4, 6]" in __out__`,
      hint: 'for i in range(0, n + 1, 2): yield i',
    },
    quiz: [
      {
        id: 'q17-1',
        type: 'mcq',
        question: 'أي كلمة مفتاحية تحول الدالة العادية إلى Generator؟',
        options: ['yield', 'async', 'return', 'lambda'],
        correctAnswer: 'yield',
        explanation: 'وجود yield يجعل الدالة تعيد كائن Generator.',
      },
    ],
  },
  {
    id: 'lesson-18-async-concurrency',
    order: 18,
    level: 'professional',
    title: 'البرمجة غير المتزامنة Asyncio والخيوط Threads',
    titleEn: 'Asyncio, Coroutines, Threading & Multiprocessing',
    durationMinutes: 25,
    objectives: [
      'فهم الفرق بين Concurrency (التزامن) و Parallelism (التوازي).',
      'كتابة Coroutines باستخدام async / await و asyncio.gather.',
      'استخدام threading.Thread و Lock و Queue ومعرفة قيود Android.',
    ],
    intro:
      'عند انتظار الشبكة أو القرص لا يجب أن يتجمد التطبيق؛ نستخدم Asyncio أو Threads للحفاظ على سلاسة التنفيذ.',
    theory: [
      'Concurrency تعني إدارة عدة مهام متداخلة زمنياً (مثل asyncio و Threads المناسبة لعمليات I/O). أما Parallelism فتعني التنفيذ الفعلي المتوازي على عدة أنوية CPU عبر multiprocessing.',
      'على Android داخل Chaquopy: يُفضل استخدام threading و asyncio مع تجنب multiprocessing المكلف بسبب قيود النظام على fork() واستهلاك الذاكرة.',
    ],
    terminology: [
      { term: 'Event Loop', meaning: 'الحلقة المركزية التي تجدول وتبدّل بين مهام async في asyncio.' },
      { term: 'Lock', meaning: 'قفل يمنع تداخل الخيوط عند تعديل بيانات مشتركة (Race Condition).' },
    ],
    syntax: `import asyncio

async def fetch(name):
    await asyncio.sleep(0.05)
    return f"{name} done"`,
    howItWorks: 'عند الوصول إلى await، تتنازل المهمة عن المعالج مؤقتاً للـ Event Loop لتشغيل مهمة أخرى جاهزة.',
    examples: {
      simple: {
        title: 'تشغيل مهام متزامنة بـ asyncio.gather',
        code: `import asyncio\n\nasync def task(name, delay):\n    await asyncio.sleep(delay)\n    return f"Task {name} completed"\n\nasync def main():\n    results = await asyncio.gather(task("A", 0.05), task("B", 0.02))\n    print(results)\n\nasyncio.run(main())`,
        lineByLine: ['gather تشغل المهمتين معاً وتجمع النتائج.'],
        expectedOutput: "['Task A completed', 'Task B completed']",
      },
      intermediate: {
        title: 'استخدام threading.Lock لحماية عداد مشترك',
        code: `import threading\n\ncounter = 0\nlock = threading.Lock()\n\ndef worker():\n    global counter\n    for _ in range(1000):\n        with lock:\n            counter += 1\n\nthreads = [threading.Thread(target=worker) for _ in range(4)]\nfor t in threads: t.start()\nfor t in threads: t.join()\nprint("Final Counter:", counter)`,
        lineByLine: ['with lock تضمن عدم فقدان أي زيادة من الخيوط الأربعة.'],
        expectedOutput: 'Final Counter: 4000',
      },
      advanced: {
        title: 'نموذج Producer/Consumer بـ queue.Queue',
        code: `import queue, threading\n\nq = queue.Queue()\nfor item in ["job1", "job2", "job3"]:\n    q.put(item)\n\nwhile not q.empty():\n    print("Processed:", q.get())\n    q.task_done()`,
        lineByLine: ['Queue توفر طابوراً آمناً لتبادل المهام بين الخيوط.'],
        expectedOutput: 'Processed: job1\nProcessed: job2\nProcessed: job3',
      },
    },
    commonErrors: [
      { error: 'RuntimeWarning: coroutine was never awaited', cause: 'استدعاء دالة async بدون await أو asyncio.run.', fix: 'استخدم await داخل async أو asyncio.run() في المستوى الأعلى.' },
    ],
    practicalUses: ['إبقاء واجهة Android سريعة الاستجابة.', 'تنفيذ عدة طلبات شبكة في وقت واحد.'],
    summary: ['asyncio مثالية للـ I/O المتزامن.', 'threading + Lock تحمي البيانات المشتركة.', 'تجنب multiprocessing على الأجهزة المحدودة.'],
    reviewQuestions: ['متى نستخدم asyncio ومتى نستخدم multiprocessing؟'],
    exercises: ['أنشئ 3 دوال async تنتظر أوقاتاً مختلفة واطبع نتائجها عبر asyncio.gather.'],
    challenge: {
      prompt: 'شغّل دالة async def hello(): return "Async OK" باستخدام asyncio.run واطبع النتيجة.',
      starterCode: `import asyncio\n\nasync def hello():\n    return "Async OK"\n`,
      testHarness: `assert "Async OK" in __out__`,
      hint: 'print(asyncio.run(hello()))',
    },
    quiz: [
      {
        id: 'q18-1',
        type: 'mcq',
        question: 'أي دالة في asyncio تجمع وتنتظر عدة Coroutines بالتزامن؟',
        options: ['asyncio.gather()', 'asyncio.lock()', 'asyncio.fork()', 'asyncio.join()'],
        correctAnswer: 'asyncio.gather()',
        explanation: 'asyncio.gather تشغّل المهام معاً وتعيد قائمة نتائجها.',
      },
    ],
  },
  {
    id: 'lesson-19-sqlite',
    order: 19,
    level: 'professional',
    title: 'قواعد البيانات المحلية SQLite عبر sqlite3',
    titleEn: 'SQLite Relational Databases & Parameterized Queries',
    durationMinutes: 28,
    objectives: [
      'تصميم الجداول وتنفيذ INSERT, SELECT, UPDATE, DELETE, WHERE, ORDER BY.',
      'حماية الاستعلامات من SQL Injection باستخدام Parameters (?).',
      'بناء نظام كامل لإدارة الطلاب باستخدام sqlite3.',
    ],
    intro:
      'تأتي مكتبة sqlite3 مدمجة في Python وتعمل محلياً دون خادم أو إنترنت، وهي قاعدة البيانات القياسية لتطبيقات الهاتف.',
    theory: [
      'يخزن SQLite قاعدة البيانات كاملة في ملف واحد (مثل students.db).',
      'قاعدة ذهبية أمنية: لا تدمج مدخلات المستخدم في نص SQL عبر f-string؛ استخدم دائماً علامات الاستفهام ? مثل cursor.execute("SELECT * FROM users WHERE name = ?", (name,)).',
      'تذكر استدعاء conn.commit() لحفظ التعديلات (INSERT/UPDATE/DELETE).',
    ],
    terminology: [
      { term: 'SQL Injection', meaning: 'ثغرة خطيرة تحدث عند تمرير مدخلات المستخدم مباشرة في نص الاستعلام.' },
      { term: 'commit()', meaning: 'تثبيت التغييرات نهائياً في ملف قاعدة البيانات.' },
    ],
    syntax: `conn = sqlite3.connect("app.db")
conn.execute("INSERT INTO users (name) VALUES (?)", ("Omar",))
conn.commit()`,
    howItWorks: 'يتعامل sqlite3 مباشرة مع محرك C المدمج لقراءة وكتابة الصفحات على القرص بعمليات ACID آمنة.',
    examples: {
      simple: {
        title: 'إنشاء جدول وإضافة وقراءة البيانات',
        code: `import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT)")\nconn.execute("INSERT INTO notes (body) VALUES (?)", ("درس SQLite",))\nconn.commit()\nprint(conn.execute("SELECT * FROM notes").fetchall())\nconn.close()`,
        lineByLine: ['استخدام :memory: لقاعدة بيانات سريعة في الذاكرة للتجربة.'],
        expectedOutput: "[(1, 'درس SQLite')]",
      },
      intermediate: {
        title: 'UPDATE و DELETE و WHERE و ORDER BY',
        code: `import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE items (name TEXT, qty INT)")\nconn.executemany("INSERT INTO items VALUES (?, ?)", [("Pen", 5), ("Book", 12), ("Bag", 2)])\nconn.execute("UPDATE items SET qty = qty + 3 WHERE name = ?", ("Bag",))\nconn.execute("DELETE FROM items WHERE qty < ?", (5,))\nrows = conn.execute("SELECT name, qty FROM items ORDER BY qty DESC").fetchall()\nprint(rows)`,
        lineByLine: ['تحديث الحقيبة، حذف الأقل من 5، ثم الترتيب تنازلياً.'],
        expectedOutput: "[('Book', 12), ('Pen', 5), ('Bag', 5)]",
      },
      advanced: {
        title: 'نظام إدارة الطلاب المتكامل بـ sqlite3',
        code: `import sqlite3\n\nclass StudentDB:\n    def __init__(self, path=":memory:"):\n        self.conn = sqlite3.connect(path)\n        self.conn.execute("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, name TEXT, gpa REAL)")\n    def add(self, name: str, gpa: float):\n        self.conn.execute("INSERT INTO students (name, gpa) VALUES (?, ?)", (name, gpa))\n        self.conn.commit()\n    def top_students(self, min_gpa: float):\n        return self.conn.execute("SELECT name, gpa FROM students WHERE gpa >= ? ORDER BY gpa DESC", (min_gpa,)).fetchall()\n\ndb = StudentDB()\ndb.add("سلمى", 3.85)\ndb.add("طارق", 3.20)\ndb.add("نور", 3.95)\nprint("المتفوقون:", db.top_students(3.5))`,
        lineByLine: ['تغليف عمليات SQLite داخل كلاس منظم مع استعلامات محمية.'],
        expectedOutput: "المتفوقون: [('نور', 3.95), ('سلمى', 3.85)]",
      },
    },
    commonErrors: [
      { error: 'ProgrammingError: Incorrect number of bindings', cause: 'تمرير قيمة مفردة ("Ali") بدلاً من Tuple ("Ali",).', fix: 'ضع فاصلة بعد العنصر الوحيد: (value,).' },
    ],
    practicalUses: ['تخزين بيانات التطبيقات محلياً.', 'إدارة المخزون والطلاب والملاحظات.'],
    summary: ['sqlite3 تعمل محلياً بلا إنترنت.', 'استخدم ? لحماية الاستعلامات دائماً.'],
    reviewQuestions: ['لماذا نستخدم (val,) مع فاصلة؟', 'ما وظيفة commit()؟'],
    exercises: ['أضف دالة delete_student(id) إلى كلاس StudentDB.'],
    challenge: {
      prompt: 'أنشئ جدول products في :memory: وأدرج ("Laptop", 1200) ثم اطبع الصف عبر fetchall().',
      starterCode: `import sqlite3\nconn = sqlite3.connect(":memory:")\n`,
      testHarness: `assert "Laptop" in __out__ and "1200" in __out__`,
      hint: 'conn.execute("CREATE TABLE products (name TEXT, price INT)")...',
    },
    quiz: [
      {
        id: 'q19-1',
        type: 'mcq',
        question: 'ما الرمز المستخدم في sqlite3 لتمرير المعاملات الآمنة ومنع SQL Injection؟',
        options: ['?', '%d', '${}', '@var'],
        correctAnswer: '?',
        explanation: 'مكتبة sqlite3 تستخدم ? كـ Placeholder للمعاملات.',
      },
    ],
  },
  {
    id: 'lesson-20-networking-web',
    order: 20,
    level: 'professional',
    title: 'الشبكات وتطوير تطبيقات الويب بـ Flask و FastAPI',
    titleEn: 'HTTP, Requests, Sockets, Flask & FastAPI',
    durationMinutes: 30,
    objectives: [
      'فهم بروتوكول HTTP (GET, POST, Headers, Status Codes, JSON APIs).',
      'معرفة أساسيات Socket Programming والعمل دون/مع إنترنت.',
      'بناء تطبيقات ويب بـ Flask و FastAPI وتشغيلها محلياً داخل PyLab Studio.',
    ],
    intro:
      'تتواصل التطبيقات الحديثة عبر HTTP و JSON APIs. يمكنك استخدام Python كعميل (Client) يطلب البيانات أو كخادم (Server) عبر Flask و FastAPI.',
    theory: [
      'طلبات HTTP الأساسية: GET لجلب البيانات، POST لإرسالها، مع رموز حالة مثل 200 OK و 201 Created و 404 Not Found و 500 Server Error.',
      'تتطلب طلبات الإنترنت الخارجية اتصالاً بالشبكة، بينما خوادم Flask و FastAPI المحلية واختبارات urllib/http.server تعمل محلياً على 127.0.0.1.',
      'Flask خفيف ومرن ومتوافق تماماً عبر عجلات Pure Python؛ بينما FastAPI يوفر توثيقاً تلقائياً والتحقق من الأنواع.',
    ],
    terminology: [
      { term: 'Status Code', meaning: 'رقم ثلاثي يشير لنتيجة طلب HTTP مثل 200 (نجاح) أو 404 (غير موجود).' },
      { term: 'Route / Endpoint', meaning: 'مسار URL مرتبط بدالة Python تستجيب للطلبات.' },
    ],
    syntax: `from flask import Flask, jsonify
app = Flask(__name__)

@app.route("/api/ping")
def ping():
    return jsonify({"ok": True})`,
    howItWorks: 'يستمع خادم الويب على منفذ محلي (Port) ويوجه كل مسار URL إلى الدالة المعرفة فوقها @app.route.',
    examples: {
      simple: {
        title: 'بناء وتحليل JSON API محلي بـ urllib.parse و json',
        code: `import json\nfrom urllib.parse import urlencode\n\nparams = urlencode({"q": "python android", "page": 1})\nurl = f"https://api.example.local/search?{params}"\nresponse_body = json.dumps({"status": 200, "url": url})\nprint(response_body)`,
        lineByLine: ['تجهيز رابط URL آمن باستخدام urlencode دون اتصال خارجي.'],
        expectedOutput: '{"status": 200, "url": "https://api.example.local/search?q=python+android&page=1"}',
      },
      intermediate: {
        title: 'اختبار تطبيق Flask محلياً دون فتح منفذ (test_client)',
        code: `# يتطلب تثبيت flask عبر Package Manager\ntry:\n    from flask import Flask, jsonify\n    app = Flask(__name__)\n    @app.route("/hello")\n    def hello():\n        return jsonify({"msg": "Flask Local OK"})\n    res = app.test_client().get("/hello")\n    print("Status:", res.status_code, "| JSON:", res.get_json())\nexcept ImportError:\n    print("ثبت flask من مدير المكتبات لتشغيل هذا المثال.")`,
        lineByLine: ['test_client() يختبر مسارات Flask في الذاكرة مباشرة.'],
        expectedOutput: "Status: 200 | JSON: {'msg': 'Flask Local OK'}",
      },
      advanced: {
        title: 'أساسيات Socket Server/Client محلي في الذاكرة',
        code: `import socket\ns1, s2 = socket.socketpair()\ns1.sendall(b"PING PyLab")\ndata = s2.recv(1024)\nprint("Socket received:", data.decode("utf-8"))\ns1.close(); s2.close()`,
        lineByLine: ['socketpair ينشئ قناة اتصال ثنائية محلية لاختبار TCP/IPC.'],
        expectedOutput: 'Socket received: PING PyLab',
      },
    },
    commonErrors: [
      { error: 'OSError: Address already in use', cause: 'محاولة تشغيل خادم على منفذ مستخدم مسبقاً.', fix: 'أوقف الخادم القديم أو اختر منفذاً آخر مثل 5201.' },
    ],
    practicalUses: ['بناء REST APIs.', 'خدمة لوحات التحكم المحلية وتطبيقات الويب.'],
    summary: ['HTTP يعتمد على الطلب والاستجابة ورموز الحالة.', 'يمكنك تشغيل Flask محلياً عبر شاشة Web Servers في PyLab Studio.'],
    reviewQuestions: ['ما الفرق بين GET و POST؟', 'ماذا يعني رمز الحالة 404؟'],
    exercises: ['أنشئ مشروع Flask من القوالب وشغله في تبويب Web Servers.'],
    challenge: {
      prompt: 'استخدم socket.socketpair() لإرسال النص b"OK" واستلامه وطباعة OK.',
      starterCode: `import socket\ns1, s2 = socket.socketpair()\n`,
      testHarness: `assert "OK" in __out__`,
      hint: 's1.sendall(b"OK"); print(s2.recv(16).decode())',
    },
    quiz: [
      {
        id: 'q20-1',
        type: 'mcq',
        question: 'ما رمز الحالة الذي يدل على نجاح طلب HTTP؟',
        options: ['200', '404', '500', '403'],
        correctAnswer: '200',
        explanation: 'الرمز 200 OK يعني أن الخادم عالج الطلب بنجاح.',
      },
    ],
  },
  {
    id: 'lesson-21-science-testing',
    order: 21,
    level: 'professional',
    title: 'المكتبات العلمية واختبار البرامج unittest و Debugging',
    titleEn: 'Scientific Ecosystem, Unit Testing, Logging & Profiling',
    durationMinutes: 26,
    objectives: [
      'معرفة استخدامات NumPy, Pandas, Matplotlib, SymPy, Pillow, OpenPyXL وتوافقها على Android.',
      'كتابة اختبارات وحدات تلقائية بـ unittest و assert.',
      'استخدام logging و cProfile/timeit لتحسين الأداء.',
    ],
    intro:
      'جودة البرنامج لا تكتمل إلا بالاختبار الآلي (Unit Testing) وتسجيل الأحداث (Logging) وقياس الأداء (Profiling).',
    theory: [
      'المكتبات العلمية: SymPy و OpenPyXL مكتبات Pure Python تعمل مباشرة؛ بينما NumPy و Pandas و Pillow و Matplotlib تحتوي كود C/C++ وتحتاج عجلات Chaquopy/manylinux مسبقة البناء على Android.',
      'مكتبة unittest المدمجة توفر اختبارات آلية تمنع عودة الأخطاء عند تعديل الكود.',
      'مكتبة logging أفضل من print() في الإنتاج لأنها تدعم مستويات (INFO, WARNING, ERROR) والطوابع الزمنية.',
    ],
    terminology: [
      { term: 'Unit Test', meaning: 'اختبار آلي صغير يتحقق من عمل دالة واحدة بدقة.' },
      { term: 'Profiling', meaning: 'قياس زمن تنفيذ أجزاء الكود لاكتشاف الاختناقات.' },
    ],
    syntax: `import unittest

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(2 + 3, 5)`,
    howItWorks: 'يرث صف الاختبار من unittest.TestCase ويبحث unittest.main() عن كل دالة تبدأ بـ test_.',
    examples: {
      simple: {
        title: 'اختبار دالة بـ assert و unittest',
        code: `import unittest\n\ndef discount(price: float, pct: float) -> float:\n    return round(price * (1 - pct / 100), 2)\n\nclass TestPricing(unittest.TestCase):\n    def test_discount(self):\n        self.assertEqual(discount(100, 20), 80.0)\n        self.assertEqual(discount(50, 0), 50.0)\n\nunittest.main(exit=False, verbosity=2)`,
        lineByLine: ['exit=False تمنع إنهاء العملية عند الاختبار البرمجي.'],
        expectedOutput: 'test_discount ... ok\nRan 1 test ... OK',
      },
      intermediate: {
        title: 'التسجيل المنظم بـ logging',
        code: `import logging\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")\nlogging.info("بدء معالجة البيانات")\nlogging.warning("الذاكرة المتاحة منخفضة")`,
        lineByLine: ['تحديد مستوى INFO وتنسيق السجل بوضوح.'],
        expectedOutput: 'INFO: بدء معالجة البيانات\nWARNING: الذاكرة المتاحة منخفضة',
      },
      advanced: {
        title: 'قياس سرعة الخوارزمية بـ timeit',
        code: `import timeit\nt1 = timeit.timeit("[x*x for x in range(100)]", number=1000)\nprint(f"1000 runs took: {t1:.4f}s")`,
        lineByLine: ['timeit تقارن سرعة الكود بدقة عالية.'],
        expectedOutput: '1000 runs took: 0.00xx s',
      },
    },
    commonErrors: [
      { error: 'عدم اكتشاف الاختبار', cause: 'تسمية دالة الاختبار باسم لا يبدأ بـ test_.', fix: 'ابدأ كل دالة اختبار بـ test_ دائماً.' },
    ],
    practicalUses: ['ضمان موثوقية الحزم والمشاريع.', 'تتبع الأخطاء عبر logging.'],
    summary: ['unittest مدمجة ولا تحتاج تثبيتاً.', 'المكتبات ذات إضافات C تحتاج توافقاً خاصاً على Android.'],
    reviewQuestions: ['ما فائدة logging على print في المشاريع الكبيرة؟'],
    exercises: ['اكتب اختبار unittest يتحقق من دالة تقلب النص.'],
    challenge: {
      prompt: 'اكتب دالة is_palindrome(s) واختبرها عبر assert is_palindrome("radar") is True ثم اطبع "TEST PASSED".',
      starterCode: `def is_palindrome(s):\n    return s == s[::-1]\n`,
      testHarness: `assert "TEST PASSED" in __out__`,
      hint: 'assert is_palindrome("radar") is True; print("TEST PASSED")',
    },
    quiz: [
      {
        id: 'q21-1',
        type: 'mcq',
        question: 'بمَ يجب أن يبدأ اسم كل دالة اختبار داخل unittest.TestCase؟',
        options: ['test_', 'check_', 'run_', 'spec_'],
        correctAnswer: 'test_',
        explanation: 'يكتشف unittest تلقائياً الدوال التي تبدأ بـ test_.',
      },
    ],
  },
];
