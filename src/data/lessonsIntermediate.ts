import type { LearningLesson } from '../types/pylab';

export const INTERMEDIATE_LESSONS: LearningLesson[] = [
  {
    id: 'lesson-08-tuples-sets',
    order: 8,
    level: 'intermediate',
    title: 'المجموعات الثابتة Tuples و المجموعات الفريدة Sets',
    titleEn: 'Tuples, Unpacking & Sets',
    durationMinutes: 22,
    objectives: [
      'إنشاء Tuples وفهم ثباتها واستخدام Packing و Unpacking.',
      'استخدام Sets لإزالة التكرار وتنفيذ عمليات المجموعات الرياضية.',
      'التمييز الدقيق بين List و Tuple و Set.',
    ],
    intro:
      'لا تحتاج كل البيانات إلى التعديل؛ أحياناً نريد بيانات محمية من التغيير (Tuple) أو مجموعة عناصر فريدة دون تكرار (Set).',
    theory: [
      'Tuple يُكتب بين أقواس دائرية ( ) وهو غير قابل للتعديل (Immutable)، لذا فهو أسرع وأخف في الذاكرة ويصلح كمفتاح في Dictionary.',
      'Unpacking يتيح توزيع عناصر Tuple على متغيرات مباشرة: x, y = (10, 20).',
      'Set يُكتب بين أقواس معقوفة { } وهو غير مرتب ولا يسمح بتكرار العناصر، ويدعم عمليات الاتحاد (| union)، التقاطع (& intersection)، الفرق (- difference)، والفرق المتماثل (^ symmetric_difference).',
    ],
    terminology: [
      { term: 'Unpacking', meaning: 'تفكيك عناصر Tuple أو List وإسنادها لعدة متغيرات في سطر واحد.' },
      { term: 'Hashable', meaning: 'كائن يمكن حساب بصمته الثابتة لاستخدامه في Set أو مفتاح Dictionary.' },
    ],
    syntax: `point = (10, 20)
x, y = point
unique_tags = {"python", "android", "python"}`,
    howItWorks: 'تعتمد Set داخلياً على Hash Table، مما يجعل البحث عن عنصر (x in my_set) يتم في زمن ثابت O(1).',
    examples: {
      simple: {
        title: 'Tuple Packing و Unpacking',
        code: `coords = (24.7136, 46.6753)\nlat, lon = coords\nprint(f"Latitude: {lat}, Longitude: {lon}")\nsingle = (42,)\nprint(type(single))`,
        lineByLine: [
          'lat, lon = coords: تفكيك الإحداثيات إلى متغيرين.',
          '(42,): الفاصلة إلزامية لإنشاء Tuple من عنصر واحد.',
        ],
        expectedOutput: "Latitude: 24.7136, Longitude: 46.6753\n<class 'tuple'>",
      },
      intermediate: {
        title: 'إزالة التكرار باستخدام Set',
        code: `emails = ["a@x.com", "b@x.com", "a@x.com", "c@x.com"]\nunique = sorted(set(emails))\nprint("Unique:", unique)`,
        lineByLine: [
          'set(emails): يحذف التكرارات فوراً.',
          'sorted(...): يعيدها كقائمة مرتبة.',
        ],
        expectedOutput: "Unique: ['a@x.com', 'b@x.com', 'c@x.com']",
      },
      advanced: {
        title: 'عمليات المجموعات الرياضية',
        code: `team_a = {"Python", "SQL", "Flask"}\nteam_b = {"Python", "FastAPI", "Docker"}\nprint("Union:", sorted(team_a | team_b))\nprint("Intersection:", team_a & team_b)\nprint("Only A:", sorted(team_a - team_b))\nprint("Symmetric Diff:", sorted(team_a ^ team_b))`,
        lineByLine: [
          '|: الاتحاد (كل المهارات).',
          '&: التقاطع (المشتركة).',
          '-: الفرق (في A وليست في B).',
          '^: العناصر غير المشتركة بينهما.',
        ],
        expectedOutput: "Union: ['Docker', 'FastAPI', 'Flask', 'Python', 'SQL']\nIntersection: {'Python'}\nOnly A: ['Flask', 'SQL']\nSymmetric Diff: ['Docker', 'FastAPI', 'Flask', 'SQL']",
      },
    },
    commonErrors: [
      { error: 'TypeError: tuple object does not support item assignment', cause: 'محاولة تعديل عنصر داخل Tuple.', fix: 'حولها إلى list إذا احتجت التعديل، أو أنشئ Tuple جديداً.' },
      { error: 'إنشاء {} يظن أنه Set فارغ', cause: '{} تنشئ Dictionary فارغاً وليس Set.', fix: 'استخدم set() لإنشاء مجموعة فارغة.' },
    ],
    practicalUses: ['إزالة التكرار من البيانات.', 'إرجاع أكثر من قيمة من دالة عبر Tuple.'],
    summary: [
      'List: مرتب وقابل للتعديل.',
      'Tuple: مرتب وغير قابل للتعديل.',
      'Set: غير مرتب وفريد العناصر.',
    ],
    reviewQuestions: ['لماذا نكتب (5,) لـ Tuple من عنصر واحد؟', 'كيف تنشئ Set فارغاً؟'],
    exercises: ['أوجد العناصر المشتركة بين قائمتين باستخدام set intersection.'],
    challenge: {
      prompt: 'احسب التقاطع بين s1 = {1, 2, 3} و s2 = {2, 3, 4} واطبع الناتج مرتباً كقائمة [2, 3].',
      starterCode: `s1 = {1, 2, 3}\ns2 = {2, 3, 4}\n`,
      testHarness: `assert "[2, 3]" in __out__`,
      hint: 'print(sorted(s1 & s2))',
    },
    quiz: [
      {
        id: 'q8-1',
        type: 'mcq',
        question: 'أي بنية بيانات تمنع تكرار العناصر تلقائياً؟',
        options: ['Set', 'List', 'Tuple', 'String'],
        correctAnswer: 'Set',
        explanation: 'المجموعة Set لا تحتفظ إلا بالقيم الفريدة فقط.',
      },
    ],
  },
  {
    id: 'lesson-09-dictionaries',
    order: 9,
    level: 'intermediate',
    title: 'القواميس Dictionaries وبناء قاعدة بيانات طلاب',
    titleEn: 'Dictionaries & Nested Data Structures',
    durationMinutes: 25,
    objectives: [
      'إنشاء Dictionaries والوصول للبيانات عبر المفاتيح و get().',
      'استخدام keys(), values(), items(), update(), pop(), popitem().',
      'استخدام القواميس المتداخلة و Dictionary Comprehension.',
    ],
    intro:
      'القاموس (dict) يربط كل مفتاح (Key) بقيمة (Value)، وهو حجر الأساس لتمثيل السجلات وملفات JSON واستجابات الويب.',
    theory: [
      'تُكتب القواميس داخل {key: value}. يجب أن يكون المفتاح فريداً و Hashable (مثل str أو int أو tuple).',
      'الوصول عبر d["key"] يطلق KeyError إذا غاب المفتاح، أما d.get("key", default) فيعيد قيمة افتراضية بأمان.',
      'منذ Python 3.7 تحافظ القواميس على ترتيب الإدخال.',
    ],
    terminology: [
      { term: 'Key-Value Pair', meaning: 'زوج يربط اسماً فريداً (مفتاح) بقيمة مقابلة له.' },
      { term: 'get()', meaning: 'دالة آمنة لاسترجاع قيمة المفتاح دون التسبب بخطأ عند غيابه.' },
    ],
    syntax: `user = {"name": "Noor", "role": "dev"}
print(user.get("email", "N/A"))
squares = {x: x*x for x in range(5)}`,
    howItWorks: 'يستخدم القاموس جدول تجزئة Hash Table للبحث عن أي مفتاح بسرعة فائقة O(1).',
    examples: {
      simple: {
        title: 'العمليات الأساسية على القاموس',
        code: `profile = {"name": "Yusuf", "level": 2}\nprofile["city"] = "Cairo"\nprint("Role:", profile.get("role", "Student"))\nremoved = profile.pop("level")\nprint("Removed:", removed, "| Profile:", profile)`,
        lineByLine: [
          'إضافة مفتاح city.',
          'get("role", "Student") تعود بالقيمة الافتراضية دون خطأ.',
          'pop("level") تحذف المفتاح وتعيد قيمته.',
        ],
        expectedOutput: "Role: Student\nRemoved: 2 | Profile: {'name': 'Yusuf', 'city': 'Cairo'}",
      },
      intermediate: {
        title: 'تحديث القاموس والمرور على العناصر',
        code: `scores = {"Math": 90, "Physics": 85}\nscores.update({"Physics": 92, "CS": 98})\nfor subject, mark in scores.items():\n    print(f"{subject}: {mark}")`,
        lineByLine: [
          'update(): تعدّل المفاتيح الموجودة وتضيف الجديدة.',
          'items(): تعيد أزواج (مفتاح، قيمة).',
        ],
        expectedOutput: 'Math: 90\nPhysics: 92\nCS: 98',
      },
      advanced: {
        title: 'قاعدة بيانات مصغرة للطلاب (Nested Dictionary)',
        code: `students = {\n    101: {"name": "سارة", "grades": [95, 90, 93]},\n    102: {"name": "كريم", "grades": [80, 84, 88]},\n}\navgs = {sid: round(sum(d["grades"])/len(d["grades"]), 1) for sid, d in students.items()}\nprint("Averages:", avgs)`,
        lineByLine: [
          'قاموس متداخل يربط رقم الطالب بسجله.',
          'Dictionary Comprehension لحساب معدل كل طالب.',
        ],
        expectedOutput: 'Averages: {101: 92.7, 102: 84.0}',
      },
    },
    commonErrors: [
      { error: 'KeyError', cause: 'قراءة مفتاح غير موجود بـ d["missing"].', fix: 'استخدم d.get("missing") أو تحقق بـ if "missing" in d.' },
    ],
    practicalUses: ['تمثيل بيانات JSON.', 'فهرسة السجلات بالمعرّف ID.', 'إعدادات التطبيقات.'],
    summary: [
      'استخدم get() لتجنب KeyError.',
      'items() تتيح قراءة المفاتيح والقيم معاً في الحلقات.',
    ],
    reviewQuestions: ['ما الفرق بين pop() و popitem()؟', 'لماذا لا تصلح القائمة List كمفتاح في القاموس؟'],
    exercises: ['أنشئ قاموساً لمنتجات متجر وأسعارها واحسب مجموع الأسعار.'],
    challenge: {
      prompt: 'أنشئ قاموساً {"a": 1, "b": 2} وأضف "c": 3 ثم اطبع مجموع القيم (6).',
      starterCode: `d = {"a": 1, "b": 2}\n`,
      testHarness: `assert "6" in __out__`,
      hint: 'd["c"] = 3; print(sum(d.values()))',
    },
    quiz: [
      {
        id: 'q9-1',
        type: 'mcq',
        question: 'أي دالة تعيد القيمة الافتراضية إذا لم تجد المفتاح في القاموس؟',
        options: ['get()', 'pop()', 'keys()', 'update()'],
        correctAnswer: 'get()',
        explanation: 'd.get(key, default) تتفادى KeyError وتعيد default.',
      },
    ],
  },
  {
    id: 'lesson-10-conditionals',
    order: 10,
    level: 'intermediate',
    title: 'الجمل الشرطية Conditional Statements',
    titleEn: 'if, elif, else & Ternary Expressions',
    durationMinutes: 20,
    objectives: [
      'التحكم في مسار البرنامج باستخدام if و elif و else.',
      'بناء الشروط المركبة (and, or) والشروط المتداخلة.',
      'استخدام المعامل الثلاثي Ternary Operator.',
    ],
    intro:
      'تمكننا الجمل الشرطية من جعل البرنامج يتخذ قرارات ذكية بناءً على البيانات والمدخلات.',
    theory: [
      'يعتمد Python على المسافة البادئة (Indentation — عادة 4 مسافات) لتحديد الكود التابع للشرط.',
      'تُفحص الشروط بالترتيب: إذا تحقق if يتم تجاوز elif و else.',
      'المعامل الثلاثي: value = "ناجح" if score >= 50 else "راسب".',
    ],
    terminology: [
      { term: 'Indentation', meaning: 'المسافة البادئة التي تحدد كتلة الكود التابعة للشرط أو الحلقة.' },
      { term: 'Ternary Operator', meaning: 'تعبير شرطي مختصر في سطر واحد.' },
    ],
    syntax: `if condition:
    action()
elif other_condition:
    other_action()
else:
    fallback()`,
    howItWorks: 'يقوم المفسر بتقييم كل تعبير شرطي إلى bool ثم ينفذ الكتلة الأولى التي تعيد True فقط.',
    examples: {
      simple: {
        title: 'التحقق من العمر',
        code: `age = 20\nif age >= 18:\n    print("مسموح بالتسجيل")\nelse:\n    print("العمر أقل من الحد المطلوب")`,
        lineByLine: ['فحص هل العمر 18 فأكثر وطباعة النتيجة.'],
        expectedOutput: 'مسموح بالتسجيل',
      },
      intermediate: {
        title: 'تقدير الدرجات بـ elif',
        code: `grade = 84\nif grade >= 90:\n    rank = "ممتاز"\nelif grade >= 80:\n    rank = "جيد جداً"\nelif grade >= 60:\n    rank = "ناجح"\nelse:\n    rank = "راسب"\nprint("التقدير:", rank)`,
        lineByLine: ['يتوقف الفحص عند أول شرط يتحقق (grade >= 80).'],
        expectedOutput: 'التقدير: جيد جداً',
      },
      advanced: {
        title: 'فحص قوة كلمة المرور بشرط مركب',
        code: `pwd = "PyLab2026!"\nhas_digit = any(c.isdigit() for c in pwd)\nhas_upper = any(c.isupper() for c in pwd)\nstatus = "قوية" if (len(pwd) >= 8 and has_digit and has_upper) else "ضعيفة"\nprint("حالة كلمة المرور:", status)`,
        lineByLine: [
          'any(...): تتحقق من وجود رقم وحرف كبير.',
          'تجميع 3 شروط عبر and داخل Ternary Operator.',
        ],
        expectedOutput: 'حالة كلمة المرور: قوية',
      },
    },
    commonErrors: [
      { error: 'SyntaxError: expected ":"', cause: 'نسيان النقطتين الرأسيتين : في نهاية سطر if أو else.', fix: 'أضف : دائماً بعد الشرط.' },
    ],
    practicalUses: ['التحقق من الصلاحيات وكلمات المرور.', 'حساب الخصومات والضرائب حسب الشرائح.'],
    summary: ['if/elif/else تحدد مسار التنفيذ.', 'المسافات البادئة جزء إلزامي من قواعد Python.'],
    reviewQuestions: ['كم مرة يمكن تكرار elif؟', 'ما صيغة Ternary Operator؟'],
    exercises: ['اكتب شرطاً يحدد إن كان العام كبيساً (Leap Year) أم لا.'],
    challenge: {
      prompt: 'اطبع "Even" إذا كان num = 14 زوجياً أو "Odd" إذا كان فردياً.',
      starterCode: `num = 14\n`,
      testHarness: `assert "Even" in __out__`,
      hint: 'print("Even" if num % 2 == 0 else "Odd")',
    },
    quiz: [
      {
        id: 'q10-1',
        type: 'mcq',
        question: 'كم مسافة يُنصح بها كمسافة بادئة (Indentation) حسب PEP 8؟',
        options: ['4 مسافات', 'مسافة واحدة', '3 مسافات', '7 مسافات'],
        correctAnswer: '4 مسافات',
        explanation: 'معيار PEP 8 يعتمد 4 مسافات لكل مستوى.',
      },
    ],
  },
  {
    id: 'lesson-11-loops',
    order: 11,
    level: 'intermediate',
    title: 'الحلقات التكرارية For & While Loops',
    titleEn: 'for, while, range(), break, continue & pass',
    durationMinutes: 25,
    objectives: [
      'استخدام for مع range() والقوائم والنصوص والقواميس.',
      'فهم while loop وتجنب الحلقات اللانهائية.',
      'التحكم في الحلقات عبر break و continue و pass.',
    ],
    intro:
      'الحلقات التكرارية تُغنيك عن تكرار كتابة الكود وتسمح بمعالجة آلاف العناصر خلال أجزاء من الثانية.',
    theory: [
      'حلقة for تمر على أي Iterable (قائمة، نص، range، قاموس). الدالة range(start, stop, step) تولد أرقاماً دون حجزها كلها في الذاكرة.',
      'حلقة while تستمر طالما الشرط True؛ يجب تحديث متغير الشرط داخلها حتى لا تصبح لا نهائية.',
      'break توقف الحلقة فوراً، continue تتخطى الدورة الحالية للتي تليها، و pass عبارة فارغة تستخدم كحجز مكان.',
    ],
    terminology: [
      { term: 'Iteration', meaning: 'دورة واحدة من تنفيذ جسم الحلقة.' },
      { term: 'break / continue', meaning: 'أوامر للخروج المبكر من الحلقة أو تخطي الدورة الحالية.' },
    ],
    syntax: `for i in range(1, 6):
    if i == 3:
        continue
    print(i)`,
    howItWorks: 'تطلب حلقة for كائن Iterator عبر iter() وتستدعي next() حتى انتهاء العناصر (StopIteration).',
    examples: {
      simple: {
        title: 'استخدام range() والمرور على قائمة',
        code: `total = 0\nfor n in range(1, 6):\n    total += n\nprint("Sum 1..5 =", total)`,
        lineByLine: ['range(1, 6) تولد الأعداد 1 إلى 5.', 'تراكم المجموع في total.'],
        expectedOutput: 'Sum 1..5 = 15',
      },
      intermediate: {
        title: 'while مع break و continue',
        code: `i = 0\nwhile i < 6:\n    i += 1\n    if i == 2:\n        continue\n    if i == 5:\n        break\n    print(i)`,
        lineByLine: ['تتخطى الطباعة عند 2 وتخرج تماماً عند 5.'],
        expectedOutput: '1\n3\n4',
      },
      advanced: {
        title: 'حلقات متداخلة لجدول ضرب مصغر',
        code: `for r in range(1, 4):\n    row = [str(r * c) for c in range(1, 4)]\n    print(" | ".join(row))`,
        lineByLine: ['لكل صف r نحسب مضاعفاته من 1 إلى 3.'],
        expectedOutput: '1 | 2 | 3\n2 | 4 | 6\n3 | 6 | 9',
      },
    },
    commonErrors: [
      { error: 'Infinite Loop', cause: 'نسيان تحديث العداد داخل while.', fix: 'تأكد من تغيير شرط التوقف أو استخدام break.' },
    ],
    practicalUses: ['معالجة ملفات CSV.', 'بناء الألعاب والتكرار حتى فوز اللاعب.'],
    summary: ['for للتكرار على مجموعات معروفة.', 'while للتكرار المعتمد على شرط.'],
    reviewQuestions: ['ما الفرق بين break و continue؟', 'ما الأعداد التي ينتجها range(2, 10, 2)؟'],
    exercises: ['احسب مضروب العدد 6 باستخدام حلقة for.'],
    challenge: {
      prompt: 'احسب مجموع الأعداد الزوجية من 2 إلى 10 (الناتج 30) واطبعه.',
      starterCode: `total = 0\n`,
      testHarness: `assert "30" in __out__`,
      hint: 'for i in range(2, 11, 2): total += i; print(total)',
    },
    quiz: [
      {
        id: 'q11-1',
        type: 'mcq',
        question: 'أي أمر يتخطى بقية السطور في الدورة الحالية وينتقل للدورة التالية من الحلقة؟',
        options: ['continue', 'break', 'pass', 'return'],
        correctAnswer: 'continue',
        explanation: 'continue تنتقل مباشرة للتكرار التالي دون كسر الحلقة.',
      },
    ],
  },
  {
    id: 'lesson-12-functions',
    order: 12,
    level: 'intermediate',
    title: 'الدوال Functions و *args و **kwargs و Lambda',
    titleEn: 'Functions, Parameters, Recursion, Lambda & Type Hints',
    durationMinutes: 28,
    objectives: [
      'تعريف الدوال باستخدام def وإرجاع القيم بـ return.',
      'التمييز بين Positional, Keyword, Default Arguments و *args / **kwargs.',
      'كتابة دوال Lambda والدوال العودية (Recursive) و Type Hints و Docstrings.',
    ],
    intro:
      'الدوال هي كتل برمجية قابلة لإعادة الاستخدام تُنظّم الكود وتمنع التكرار وتجعل اختبار البرنامج سهلاً.',
    theory: [
      'المعاملات الافتراضية: def greet(name="Guest"). يجب وضع المعاملات الافتراضية بعد الإلزامية.',
      '*args تجمع عدداً غير محدود من المعاملات الموضعية في Tuple، بينما **kwargs تجمع المعاملات المسماة في Dictionary.',
      'Lambda هي دالة مجهولة مختصرة من تعبير واحد مثل lambda x: x * 2.',
      'الدالة العودية (Recursive) تستدعي نفسها لحل مشكلة متفرعة بشرط وجود Base Case للتوقف.',
    ],
    terminology: [
      { term: '*args / **kwargs', meaning: 'استقبال عدد متغير من المعاملات الموضعية والمسماة.' },
      { term: 'Type Hints', meaning: 'تلميحات توضيحية لأنواع المدخلات والمخرجات مثل (x: int) -> int.' },
    ],
    syntax: `def add(a: int, b: int = 0) -> int:
    """Return sum of two integers."""
    return a + b`,
    howItWorks: 'تُنشأ للدالة مساحة أسماء محلية (Local Frame) في Stack عند استدعائها، وتُزال فور return.',
    examples: {
      simple: {
        title: 'آلة حاسبة بالدوال ومعامل افتراضي',
        code: `def power(base: float, exp: int = 2) -> float:\n    """Raise base to exponent."""\n    return base ** exp\n\nprint(power(5), power(2, exp=5))`,
        lineByLine: ['exp=2 قيمة افتراضية عند عدم تمرير الأس الثاني.'],
        expectedOutput: '25 32',
      },
      intermediate: {
        title: 'استخدام *args و **kwargs',
        code: `def log_order(customer, *items, **meta):\n    print("Customer:", customer)\n    print("Items:", items)\n    print("Meta:", meta)\n\nlog_order("Tariq", "Book", "Pen", express=True, city="Amman")`,
        lineByLine: ['items تستقبل ("Book", "Pen") و meta تستقبل القاموس.'],
        expectedOutput: "Customer: Tariq\nItems: ('Book', 'Pen')\nMeta: {'express': True, 'city': 'Amman'}",
      },
      advanced: {
        title: 'الدالة العودية Factorial ودالة Lambda للفرز',
        code: `def factorial(n: int) -> int:\n    return 1 if n <= 1 else n * factorial(n - 1)\n\nstudents = [("Ali", 82), ("Zain", 95), ("Huda", 89)]\nstudents.sort(key=lambda s: s[1], reverse=True)\nprint("5! =", factorial(5))\nprint("Top:", students[0])`,
        lineByLine: ['factorial تستدعي نفسها حتى n <= 1.', 'lambda s: s[1] تحدد الفرز حسب الدرجة.'],
        expectedOutput: "5! = 120\nTop: ('Zain', 95)",
      },
    },
    commonErrors: [
      { error: 'RecursionError', cause: 'نسيان شرط التوقف (Base Case) في الدالة العودية.', fix: 'أضف شرطاً ينهي الاستدعاء الذاتي.' },
      { error: 'Mutable default argument', cause: 'كتابة def f(items=[]) لأن القائمة تتشارك بين الاستدعاءات.', fix: 'استخدم def f(items=None): items = items or [].' },
    ],
    practicalUses: ['تقسيم المنطق البرمجي لوحدات قابلة للاختبار.', 'تمرير دوال فرز مخصصة بـ lambda.'],
    summary: [
      'الدوال تمنع تكرار الكود وتسهل الصيانة.',
      'Docstrings و Type Hints تجعل دوالك احترافية وواضحة.',
    ],
    reviewQuestions: ['ما الفرق بين print داخل الدالة و return؟', 'ما نوع *args داخل الدالة؟'],
    exercises: ['اكتب دالة آلة حاسبة calculator(a, b, op) تدعم + - * /.'],
    challenge: {
      prompt: 'اكتب دالة multiply_all(*nums) تضرب جميع الأرقام الممررة وتعيد الناتج، ثم اطبع multiply_all(2, 3, 4) -> 24.',
      starterCode: `def multiply_all(*nums):\n    pass\n\nprint(multiply_all(2, 3, 4))`,
      testHarness: `assert "24" in __out__`,
      hint: 'res = 1\nfor n in nums: res *= n\nreturn res',
    },
    quiz: [
      {
        id: 'q12-1',
        type: 'mcq',
        question: 'ما نوع البيانات الذي تجمعه **kwargs داخل الدالة؟',
        options: ['dict', 'tuple', 'list', 'set'],
        correctAnswer: 'dict',
        explanation: '**kwargs تجمع المعاملات المسماة في قاموس dict.',
      },
    ],
  },
  {
    id: 'lesson-13-modules-packages',
    order: 13,
    level: 'intermediate',
    title: 'الوحدات Modules والحزم Packages والمكتبات القياسية',
    titleEn: 'Modules, Packages & Standard Library',
    durationMinutes: 22,
    objectives: [
      'تقسيم المشروع إلى Modules و Packages باستخدام __init__.py.',
      'استخدام import و from ... import و as.',
      'استثمار المكتبات القياسية: math, random, datetime, pathlib, collections, re.',
    ],
    intro:
      'المشروعات الحقيقية لا تُكتب في ملف واحد! توفر Python نظام الوحدات والحزم بالإضافة إلى مكتبة قياسية ضخمة جاهزة دون إنترنت.',
    theory: [
      'أي ملف .py هو Module يمكن استيراده عبر import module_name. والمجلد الذي يجمع عدة وحدات (مع __init__.py) هو Package.',
      'استخدم if __name__ == "__main__": لمنع تنفيذ كود الاختبار عند استيراد الملف كوحدة.',
      'توفر المكتبة القياسية أدوات قوية مدمجة مثل math للرياضيات، datetime للتواريخ، pathlib للمسارات، collections للعدادات، و re للتعابير النمطية.',
    ],
    terminology: [
      { term: 'Module', meaning: 'ملف Python يحتوي دوال وكلاسات يمكن استيرادها.' },
      { term: 'Package', meaning: 'مجلد يضم مجموعة Modules ويحتوي عادة __init__.py.' },
    ],
    syntax: `import math as m
from datetime import date
from collections import Counter`,
    howItWorks: 'يبحث Python عن الوحدة في sys.path بدءاً من مجلد المشروع ثم المكتبات المثبتة ثم المكتبة القياسية.',
    examples: {
      simple: {
        title: 'استخدام math و random و datetime',
        code: `import math\nimport random\nfrom datetime import date\n\nprint("Sqrt(144):", math.sqrt(144))\nprint("Random choice:", random.choice(["Py", "Lab", "Studio"]))\nprint("Today:", date.today().isoformat())`,
        lineByLine: ['استيراد 3 مكتبات قياسية واستدعاء دوالها مباشرة.'],
        expectedOutput: 'Sqrt(144): 12.0\nRandom choice: ...\nToday: 2026-...',
      },
      intermediate: {
        title: 'تحليل التكرارات بـ collections.Counter',
        code: `from collections import Counter\nwords = ["python", "code", "python", "app", "code", "python"]\ncounts = Counter(words)\nprint("Most common:", counts.most_common(2))`,
        lineByLine: ['Counter يحسب تكرار كل كلمة تلقائياً.'],
        expectedOutput: "Most common: [('python', 3), ('code', 2)]",
      },
      advanced: {
        title: 'استخدام __name__ == "__main__" مع re',
        code: `import re\n\ndef extract_numbers(text: str) -> list[int]:\n    return [int(x) for x in re.findall(r"\\d+", text)]\n\nif __name__ == "__main__":\n    print(extract_numbers("Order #42 has 15 items"))`,
        lineByLine: ['re.findall تستخرج الأرقام من النص باستخدام Regex.'],
        expectedOutput: '[42, 15]',
      },
    },
    commonErrors: [
      { error: 'ModuleNotFoundError', cause: 'استيراد مكتبة غير مثبتة أو اسم ملف مكتوب بشكل خاطئ.', fix: 'ثبت المكتبة عبر pip أو تأكد من المسار داخل المشروع.' },
      { error: 'Circular Import', cause: 'ملف A يستورد B و B يستورد A في المستوى الأعلى.', fix: 'أعد هيكلة الدوال المشتركة في ملف ثالث.' },
    ],
    practicalUses: ['بناء مشاريع متعددة الملفات نظيفة.', 'الاعتماد على المكتبة القياسية للعمل دون إنترنت.'],
    summary: ['قسّم مشروعك لوحدات مستقلة.', 'استفد من math و datetime و collections و pathlib قبل البحث عن مكتبات خارجية.'],
    reviewQuestions: ['ما فائدة __name__ == "__main__"؟', 'ما وظيفة ملف __init__.py؟'],
    exercises: ['استخدم datetime لحساب عدد الأيام المتبقية حتى نهاية السنة.'],
    challenge: {
      prompt: 'استورد math واحسب math.factorial(6) ثم اطبع الناتج 720.',
      starterCode: `import math\n`,
      testHarness: `assert "720" in __out__`,
      hint: 'print(math.factorial(6))',
    },
    quiz: [
      {
        id: 'q13-1',
        type: 'mcq',
        question: 'أي وحدة قياسية تُستخدم للتعامل مع التواريخ والأوقات؟',
        options: ['datetime', 'math', 'json', 're'],
        correctAnswer: 'datetime',
        explanation: 'وحدة datetime مسؤولة عن التواريخ والأوقات والفروق الزمنية.',
      },
    ],
  },
];
