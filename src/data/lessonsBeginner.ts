import type { LearningLesson } from '../types/pylab';

export const BEGINNER_LESSONS: LearningLesson[] = [
  {
    id: 'lesson-01-intro',
    order: 1,
    level: 'beginner',
    title: 'مقدمة إلى البرمجة ولغة Python',
    titleEn: 'Introduction to Programming & Python',
    durationMinutes: 15,
    objectives: [
      'فهم ماهية البرمجة وكيف يترجم الحاسوب الأوامر.',
      'التعرف على لغة Python ومجالات استخدامها ومميزاتها.',
      'فهم آلية عمل مفسر Python (Interpreter) مقارنة باللغات المترجمة.',
    ],
    intro:
      'البرمجة هي لغة التواصل بين الإنسان والحاسوب. الحاسوب جهاز سريع ودقيق لكنه لا يفهم اللغة البشرية مباشرة؛ بل ينفذ تعليمات منطقية مكتوبة بدقة تُسمى الكود البرمجي (Source Code).',
    theory: [
      'يعمل معالج الحاسوب بلغة الآلة (Machine Code) المكونة من الأصفار والآحاد (0 و 1). كتابة البرامج مباشرة بلغة الآلة أمر بالغ الصعوبة، لذلك ابتكر العلماء لغات البرمجة عالية المستوى مثل Python.',
      'تأسست لغة Python على يد Guido van Rossum عام 1991، وصُممت لتكون واضحة وقريبة من اللغة الإنجليزية، مما يجعل قراءة الكود وصيانته أسهل بكثير مقارنة بلغات مثل C++ أو Java.',
      'تعتمد Python على مفسر (Interpreter) يقرأ الكود ويحوّله إلى Bytecode ثم ينفذه مباشرة عبر Python Virtual Machine (PVM)، مما يتيح لك تجربة الكود فوراً داخل PyLab Studio دون خطوة Compilation منفصلة.',
      'تُستخدم Python في تطبيقات الويب (Flask, FastAPI, Django)، وتحليل البيانات (NumPy, Pandas)، والأتمتة، وقواعد البيانات، والاختبارات، وتطبيقات الشبكات.',
    ],
    terminology: [
      { term: 'Source Code', meaning: 'النص البرمجي الذي يكتبه المبرمج بلغة مفهومة مثل Python.' },
      { term: 'Interpreter', meaning: 'المفسر الذي يقرأ الكود وينفذه سطراً تلو الآخر دون بناء ملف تنفيذي مسبق.' },
      { term: 'Bytecode', meaning: 'تمثيل وسيط للكود يُنتجه مفسر Python لتسريع التنفيذ داخل PVM.' },
      { term: 'Syntax', meaning: 'القواعد النحوية لكتابة أوامر اللغة بشكل صحيح.' },
    ],
    syntax: `# تعليمة طباعة بسيطة في Python
print("النص المراد طباعته")`,
    howItWorks:
      'عند تشغيل ملف .py، يقوم مفسر Python بتحليل الجمل (Parsing)، ثم تحويلها إلى Bytecode، ثم تنفيذها أمراً تلو الآخر من الأعلى إلى الأسفل.',
    examples: {
      simple: {
        title: 'رسالة ترحيب وتحقق من الإصدار',
        code: `import sys\nprint("أهلاً بك في عالم Python")\nprint("الإصدار:", sys.version.split()[0])`,
        lineByLine: [
          'import sys: استيراد وحدة النظام القياسية لمعرفة معلومات المفسر.',
          'print(...): طباعة رسالة ترحيب عربية على الشاشة.',
          'sys.version.split()[0]: استخراج رقم إصدار Python المثبت محلياً.',
        ],
        expectedOutput: 'أهلاً بك في عالم Python\nالإصدار: 3.11.2',
      },
      intermediate: {
        title: 'تنفيذ سلسلة خطوات متتالية',
        code: `step1 = "تحليل المشكلة"\nstep2 = "كتابة الكود"\nstep3 = "تشغيل واختبار البرنامج"\nprint("1.", step1)\nprint("2.", step2)\nprint("3.", step3)`,
        lineByLine: [
          'الأسطر 1 إلى 3 تخزن أسماء مراحل البرمجة في متغيرات نصية.',
          'الأسطر 4 إلى 6 تطبع الخطوات بالترتيب من الأعلى للأسفل.',
        ],
        expectedOutput: '1. تحليل المشكلة\n2. كتابة الكود\n3. تشغيل واختبار البرنامج',
      },
      advanced: {
        title: 'فحص خصائص المفسر والمنصة',
        code: `import platform\ninfo = {\n    "language": "Python",\n    "version": platform.python_version(),\n    "implementation": platform.python_implementation(),\n}\nfor k, v in info.items():\n    print(f"{k}: {v}")`,
        lineByLine: [
          'import platform: استيراد مكتبة قراءة معلومات النظام.',
          'info = {...}: تجميع المعلومات داخل قاموس Dictionary.',
          'for k, v in info.items(): المرور على كل مفتاح وقيمة وطباعتها.',
        ],
        expectedOutput: 'language: Python\nversion: 3.11.2\nimplementation: CPython',
      },
    },
    commonErrors: [
      { error: 'SyntaxError', cause: 'نسيان علامات التنصيص أو الأقواس عند كتابة print.', fix: 'تأكد من إغلاق كل قوس ( ) وكل علامة تنصيص " ".' },
      { error: 'IndentationError', cause: 'ترك مسافة بادئة غير مبررة في بداية السطر.', fix: 'ابدأ كتابة الأوامر العادية من العمود الأول دون مسافات زائدة.' },
    ],
    practicalUses: ['بناء سكربتات أتمتة سريعة.', 'تطوير خوادم ويب باستخدام Flask.', 'تحليل البيانات والملفات.'],
    summary: [
      'Python لغة مفسرة عالية المستوى وسهلة القراءة.',
      'ينفذ المفسر الأوامر بالتسلسل من الأعلى إلى الأسفل.',
      'تعمل Python محلياً داخل PyLab Studio دون حاجة لخدمات سحابية.',
    ],
    reviewQuestions: [
      'ما الفرق الأساسي بين Interpreter و Compiler؟',
      'لماذا تُعد Python مناسبة للمبتدئين والمحترفين معاً؟',
    ],
    exercises: [
      'اطبع اسمك وتخصصك في سطرين منفصلين باستخدام print().',
      'استورد مكتبة platform واطبع اسم نظام التشغيل.',
    ],
    challenge: {
      prompt: 'اكتب برنامجاً يطبع العبارة الدقيقة: Python 3 Ready',
      starterCode: `# اطبع العبارة المطلوبة هنا\n`,
      testHarness: `assert "Python 3 Ready" in __out__, "يجب أن يطبع البرنامج Python 3 Ready"`,
      hint: 'استخدم دالة print("Python 3 Ready")',
    },
    quiz: [
      {
        id: 'q1-1',
        type: 'mcq',
        question: 'ما هي الأداة المسؤولة عن قراءة وتنفيذ كود Python مباشرة؟',
        options: ['Interpreter (المفسر)', 'Linker', 'BIOS', 'Browser Engine'],
        correctAnswer: 'Interpreter (المفسر)',
        explanation: 'لغة Python لغة مفسرة تعتمد على Interpreter لتنفيذ التعليمات.',
      },
      {
        id: 'q1-2',
        type: 'true_false',
        question: 'تتطلب لغة Python ترجمة الكود إلى ملف تنفيذي .exe قبل تشغيله في كل مرة.',
        options: ['صح', 'خطأ'],
        correctAnswer: 'خطأ',
        explanation: 'ينفذ المفسر ملفات .py مباشرة دون الحاجة لبناء ملف .exe مسبقاً.',
      },
    ],
  },
  {
    id: 'lesson-02-environment',
    order: 2,
    level: 'beginner',
    title: 'بيئة التطوير والفرق بين Editor و Terminal',
    titleEn: 'Python Environment, Editor & Terminal',
    durationMinutes: 12,
    objectives: [
      'التمييز بين محرر الأكواد (Code Editor) والطرفية (Terminal).',
      'فهم وظيفة Console ومخرجات التنفيذ.',
      'إنشاء وحفظ وتشغيل ملف Python (.py).',
    ],
    intro:
      'لبرمجة تطبيقات حقيقية، نحتاج إلى أدوات منظمة: محرر لكتابة وحفظ الملفات، وطرفية لإدارة الملفات والمكتبات، ومحرك تنفيذ لعرض النتائج.',
    theory: [
      'Code Editor هو المساحة التي تكتب فيها ملفات المشروع مثل main.py وتحفظها على القرص مع تلوين الأكواد واكتشاف الأخطاء مبكراً.',
      'Terminal (الطرفية) هي واجهة سطر أوامر تسمح لك بتشغيل الملفات عبر python main.py، وتثبيت المكتبات عبر pip install، والتنقل بين المجلدات.',
      'Console هو نافذة المخرجات التي تعرض stdout (المخرجات القياسية) و stderr (الأخطاء والتنبيهات) أثناء تشغيل البرنامج.',
    ],
    terminology: [
      { term: 'Code Editor', meaning: 'محرر النصوص البرمجية لحفظ وتعديل ملفات المشروع.' },
      { term: 'Terminal', meaning: 'واجهة الأوامر النصية للتحكم في البيئة وتشغيل الأوامر.' },
      { term: 'stdout / stderr', meaning: 'قناتا الإخراج القياسي وإخراج الأخطاء في نظام التشغيل.' },
    ],
    syntax: `# تشغيل ملف من الطرفية:
# python main.py
print("Running from file")`,
    howItWorks:
      'عند الضغط على زر Run في PyLab Studio، يتم حفظ الملف ثم استدعاء python3 على مسار الملف وتوجيه stdout/stderr إلى Console.',
    examples: {
      simple: {
        title: 'طباعة مسار التشغيل الحالي',
        code: `import os\nprint("المجلد الحالي:", os.getcwd())`,
        lineByLine: [
          'import os: استيراد مكتبة نظام التشغيل.',
          'os.getcwd(): دالة تعيد مسار مجلد العمل الحالي.',
        ],
        expectedOutput: 'المجلد الحالي: /.../pylab_workspace/...',
      },
      intermediate: {
        title: 'عرض معاملات سطر الأوامر',
        code: `import sys\nprint("اسم الملف المنفذ:", sys.argv[0])\nprint("عدد المعاملات:", len(sys.argv))`,
        lineByLine: [
          'sys.argv: قائمة تحتوي على اسم السكربت والمعاملات الممررة له.',
          'len(sys.argv): حساب عدد العناصر في القائمة.',
        ],
        expectedOutput: 'اسم الملف المنفذ: ...\nعدد المعاملات: 1',
      },
      advanced: {
        title: 'قراءة متغيرات البيئة',
        code: `import os\nencoding = os.environ.get("PYTHONIOENCODING", "utf-8")\nprint("الترميز النشط:", encoding)`,
        lineByLine: [
          'os.environ: قاموس يحتوي على متغيرات البيئة Environment Variables.',
          '.get(..., "utf-8"): قراءة آمنة مع قيمة افتراضية.',
        ],
        expectedOutput: 'الترميز النشط: utf-8',
      },
    },
    commonErrors: [
      { error: 'FileNotFoundError', cause: 'محاولة تشغيل ملف غير موجود في المجلد الحالي.', fix: 'تأكد من حفظ الملف أو التحقق من اسم المسار.' },
    ],
    practicalUses: ['إدارة ملفات المشاريع الكبيرة.', 'تشغيل الأوامر والاختبارات من Terminal.'],
    summary: [
      'Editor لكتابة الأكواد وحفظها.',
      'Terminal لتنفيذ الأوامر وإدارة المكتبات.',
      'Console لمراقبة النتائج والأخطاء.',
    ],
    reviewQuestions: ['ما الفرق بين Editor و Terminal؟', 'ما فائدة sys.argv؟'],
    exercises: ['استخدم os.listdir(".") لطباعة قائمة الملفات في مجلد المشروع.'],
    challenge: {
      prompt: 'استورد os واطبع قيمة os.name',
      starterCode: `import os\n# اطبع os.name هنا\n`,
      testHarness: `assert len(__out__.strip()) > 0, "يجب طباعة اسم النظام عبر os.name"`,
      hint: 'print(os.name)',
    },
    quiz: [
      {
        id: 'q2-1',
        type: 'mcq',
        question: 'ما الامتداد القياسي لملفات Python؟',
        options: ['.py', '.pt', '.java', '.html'],
        correctAnswer: '.py',
        explanation: 'جميع ملفات سكربتات Python تنتهي بامتداد .py.',
      },
    ],
  },
  {
    id: 'lesson-03-print',
    order: 3,
    level: 'beginner',
    title: 'أول برنامج Python ودالة print() والتعليقات',
    titleEn: 'First Program, print() & Comments',
    durationMinutes: 18,
    objectives: [
      'إتقان استخدام دالة print() لطباعة النصوص والأرقام.',
      'استخدام المعاملين sep و end لتنسيق المخرجات.',
      'كتابة التعليقات الأحادية ومتعددة الأسطر لتوثيق الكود.',
    ],
    intro:
      'دالة print() هي أول أداة تستخدمها للتواصل مع المستخدم وعرض النتائج، بينما تتيح لك التعليقات (Comments) شرح الكود لنفسك ولفريقك دون أن ينفذها المفسر.',
    theory: [
      'تقبل دالة print() قيمة واحدة أو عدة قيم مفصولة بفواصل، وتضع مسافة بينها افتراضياً وتنتهي بسطر جديد.',
      'يمكن تغيير الفاصل باستخدام المعامل sep="..."، وتغيير نهاية السطر باستخدام end="...".',
      'التعليقات تبدأ برمز # للسطر الواحد، ويتجاهلها مفسر Python تماماً عند التنفيذ. للتوثيق متعدد الأسطر (Docstrings) نستخدم ثلاث علامات تنصيص """...""".',
    ],
    terminology: [
      { term: 'print()', meaning: 'دالة مدمجة لطباعة البيانات على وحدة الإخراج القياسية.' },
      { term: 'sep', meaning: 'معامل يحدد الفاصل بين القيم المطبوعة (الافتراضي مسافة).' },
      { term: 'end', meaning: 'معامل يحدد ما يُطبع في نهاية الجملة (الافتراضي سطر جديد \\n).' },
      { term: 'Comment', meaning: 'ملاحظة توضيحية داخل الكود يتجاهلها المفسر.' },
    ],
    syntax: `# تعليق أحادي السطر
print("القيمة 1", "القيمة 2", sep=" | ", end="\\n")`,
    howItWorks: 'تحوّل print() كل معامل إلى نص عبر str() ثم ترسلها إلى sys.stdout مفصولة بقيمة sep.',
    examples: {
      simple: {
        title: 'طباعة نصوص وأرقام',
        code: `print("مرحباً بكم في PyLab Studio")\nprint("السنة:", 2026)`,
        lineByLine: [
          'السطر 1: طباعة نص ثابت.',
          'السطر 2: طباعة نص متبوع برقم صحيح مفصول بمسافة.',
        ],
        expectedOutput: 'مرحباً بكم في PyLab Studio\nالسنة: 2026',
      },
      intermediate: {
        title: 'تنسيق الفواصل والنهاية باستخدام sep و end',
        code: `print("2026", "11", "19", sep="-")\nprint("جاري التحميل", end="...")\nprint("تم!")`,
        lineByLine: [
          'sep="-": استبدال المسافة بشرطة بين التاريخ.',
          'end="...": عدم النزول لسطر جديد ووضع ثلاث نقاط.',
          'print("تم!"): تُطبع على نفس السطر مباشرة.',
        ],
        expectedOutput: '2026-11-19\nجاري التحميل...تم!',
      },
      advanced: {
        title: 'تنسيق جدول نصي مع توثيق Docstring',
        code: `"""\nبرنامج طباعة فاتورة مبسطة\n"""\n# طباعة العنوان\nprint("Item", "Qty", "Price", sep="\\t")\nprint("Book", 2, 45.5, sep="\\t")`,
        lineByLine: [
          '"""...""": توثيق يشرح هدف السكربت.',
          '\\t: رمز Tab لمحاذاة الأعمدة.',
        ],
        expectedOutput: 'Item\tQty\tPrice\nBook\t2\t45.5',
      },
    },
    commonErrors: [
      { error: 'SyntaxError: unterminated string literal', cause: 'نسيان إغلاق علامة الاقتباس.', fix: 'أغلق النص بنفس نوع علامة الاقتباس التي بدأت بها.' },
    ],
    practicalUses: ['عرض نتائج الحسابات.', 'توثيق الدوال والملفات بالتعليقات.', 'تصدير مخرجات منسقة بالـ Tab أو الفواصل.'],
    summary: [
      'print() تعرض النصوص والأرقام وتدعم sep و end.',
      'التعليقات # تحسن وضوح الكود ولا تؤثر على التنفيذ.',
    ],
    reviewQuestions: ['ما القيمة الافتراضية للمعامل sep في print()؟', 'كيف تمنع print() من الانتقال لسطر جديد؟'],
    exercises: ['اطبع الأرقام 1 و 2 و 3 مفصولة برمز السهم -> باستخدام sep.'],
    challenge: {
      prompt: 'اطبع التاريخ 2026/11/19 باستخدام print("2026", "11", "19", sep=...) ',
      starterCode: `print("2026", "11", "19")`,
      testHarness: `assert "2026/11/19" in __out__, "استخدم sep='/'"`,
      hint: 'أضف sep="/" داخل دالة print',
    },
    quiz: [
      {
        id: 'q3-1',
        type: 'fill_code',
        question: 'ما المعامل المستخدم لتغيير الفاصل بين القيم في print()؟',
        options: ['sep', 'split', 'gap', 'join'],
        correctAnswer: 'sep',
        explanation: 'المعامل sep (اختصار separator) يحدد الفاصل بين القيم.',
      },
    ],
  },
  {
    id: 'lesson-04-variables-types',
    order: 4,
    level: 'beginner',
    title: 'المتغيرات وأنواع البيانات وتحويل الأنواع',
    titleEn: 'Variables, Data Types & Type Casting',
    durationMinutes: 25,
    objectives: [
      'فهم المتغيرات وقواعد تسميتها (Variable Naming).',
      'معرفة الأنواع الأساسية: int, float, str, bool, None.',
      'استخدام type() و isinstance() وتحويل الأنواع Type Casting.',
      'التمييز بين المتغيرات المحلية والعامة.',
    ],
    intro:
      'المتغير هو اسم يشير إلى قيمة مخزنة في الذاكرة. تتميز Python بـ Dynamic Typing، أي أنك لا تحتاج لإعلان نوع المتغير مسبقاً.',
    theory: [
      'أسماء المتغيرات تبدأ بحرف أو شرطة سفلية _ ولا تبدأ برقم ولا تحتوي على مسافات. يُفضل أسلوب snake_case مثل student_age.',
      'الأنواع الأساسية: int للأعداد الصحيحة، float للعشرية، str للنصوص، bool للقيم المنطقية True/False، و None لتمثيل غياب القيمة.',
      'يمكن فحص النوع عبر type(x) أو isinstance(x, int)، وتحويله عبر int() و float() و str() و bool().',
      'المتغير المعرف خارج الدوال يُسمى Global (عام)، والمعرف داخل دالة يُسمى Local (محلي) ولا يُرى خارجها.',
    ],
    terminology: [
      { term: 'Dynamic Typing', meaning: 'تحديد نوع المتغير تلقائياً وقت التشغيل حسب القيمة المسندة.' },
      { term: 'Type Casting', meaning: 'تحويل قيمة من نوع إلى آخر مثل int("42").' },
      { term: 'None', meaning: 'كائن خاص يمثل القيمة الفارغة أو عدم وجود نتيجة.' },
    ],
    syntax: `age = 21          # int
price = 19.95     # float
name = "Amina"    # str
is_active = True  # bool
result = None     # NoneType`,
    howItWorks: 'تقوم عملية الإسناد (=) بربط الاسم البرمجي بالكائن الموجود في الذاكرة دون نسخ غير ضروري.',
    examples: {
      simple: {
        title: 'تعريف الأنواع وفحصها بـ type()',
        code: `count = 10\nratio = 0.75\ntitle = "Python"\nactive = True\nprint(type(count), type(ratio), type(title), type(active))`,
        lineByLine: [
          'تعريف 4 متغيرات بأنواع مختلفة.',
          'طباعة نوع كل متغير باستخدام type().',
        ],
        expectedOutput: "<class 'int'> <class 'float'> <class 'str'> <class 'bool'>",
      },
      intermediate: {
        title: 'تحويل الأنواع Type Casting والتحقق عبر isinstance()',
        code: `raw_price = "150"\nqty = 3\ntotal = int(raw_price) * qty\nprint("Total:", total)\nprint("Is int?", isinstance(total, int))`,
        lineByLine: [
          'int(raw_price): تحويل النص "150" إلى عدد صحيح 150.',
          'isinstance(total, int): التحقق المنطقي من نوع الناتج.',
        ],
        expectedOutput: 'Total: 450\nIs int? True',
      },
      advanced: {
        title: 'المتغيرات المحلية والعامة (Local vs Global Scope)',
        code: `app_name = "PyLab"\n\ndef show_info():\n    local_ver = 3.11\n    print(app_name, local_ver)\n\nshow_info()\nprint("Global:", app_name)`,
        lineByLine: [
          'app_name: متغير عام متاح داخل الدالة وخارجها.',
          'local_ver: متغير محلي داخل show_info فقط.',
        ],
        expectedOutput: 'PyLab 3.11\nGlobal: PyLab',
      },
    },
    commonErrors: [
      { error: 'ValueError: invalid literal for int()', cause: 'محاولة تحويل نص غير رقمي مثل int("abc").', fix: 'تحقق أن النص يحتوي أرقاماً قبل التحويل أو استخدم try/except.' },
      { error: 'TypeError: can only concatenate str to str', cause: 'جمع نص مع رقم مباشرة مثل "Age: " + 20.', fix: 'استخدم str(20) أو f-string.' },
    ],
    practicalUses: ['قراءة مدخلات المستخدم النصية وتحويلها لأرقام.', 'تمثيل حالات النظام المنطقية.'],
    summary: [
      'الأنواع الأساسية هي int, float, str, bool, None.',
      'استخدم int(), float(), str() لتحويل البيانات بأمان.',
    ],
    reviewQuestions: ['ما الفرق بين type() و isinstance()؟', 'ما هي القيمة المنطقية لـ bool("")؟'],
    exercises: ['عرّف متغيرين نصيين لرقمين ثم اجمعهما حسابياً بعد التحويل إلى float.'],
    challenge: {
      prompt: 'حوّل المتغير text_num = "25" إلى int واضف له 15 ثم اطبع الناتج 40.',
      starterCode: `text_num = "25"\n# أكمل الكود هنا\n`,
      testHarness: `assert "40" in __out__, "يجب أن يطبع البرنامج 40"`,
      hint: 'print(int(text_num) + 15)',
    },
    quiz: [
      {
        id: 'q4-1',
        type: 'mcq',
        question: 'أي من أسماء المتغيرات التالية غير صالح في Python؟',
        options: ['2fast', 'user_name', '_count', 'totalAmount'],
        correctAnswer: '2fast',
        explanation: 'لا يجوز أن يبدأ اسم المتغير برقم في Python.',
      },
    ],
  },
  {
    id: 'lesson-05-operators',
    order: 5,
    level: 'beginner',
    title: 'العمليات الحسابية والمنطقية والمقارنة والبتات',
    titleEn: 'Arithmetic, Comparison, Logical, Identity, Membership & Bitwise Operators',
    durationMinutes: 25,
    objectives: [
      'استخدام جميع العمليات الحسابية بما فيها // و % و **.',
      'إتقان عمليات المقارنة والعمليات المنطقية and / or / not.',
      'فهم عوامل الإسناد المختصرة و Identity (is) و Membership (in) و Bitwise (& | ^ << >>).',
    ],
    intro:
      'العمليات (Operators) هي الأدوات التي تعالج القيم وتُجري المقارنات واتخاذ القرارات المنطقية في برامجك.',
    theory: [
      'العمليات الحسابية: + جمع، - طرح، * ضرب، / قسمة عشرية، // قسمة صحيحة (Floor Division)، % باقي القسمة (Modulus)، ** الأس (Exponentiation).',
      'عمليات المقارنة تعيد True أو False: ==, !=, >, <, >=, <=.',
      'العمليات المنطقية: and (تتحقق إذا صح الشرطان)، or (إذا صح أحدهما)، not (تعكس النتيجة).',
      'Identity: المعامل is يتحقق من تطابق الكائن نفسه في الذاكرة (مهم مع None)، بينما Membership (in / not in) يتحقق من وجود عنصر داخل نص أو قائمة.',
      'Bitwise Operators (& AND, | OR, ^ XOR, ~ NOT, << إزاحة لليسار, >> إزاحة لليمين) تعمل على البتات الثنائية للأعداد الصحيحة، وتُستخدم في التشفير والأذونات (Permissions).',
    ],
    terminology: [
      { term: 'Floor Division (//)', meaning: 'قسمة تعيد الجزء الصحيح الأصغر دون كسور.' },
      { term: 'Modulus (%)', meaning: 'يعيد باقي القسمة الصحيح (مفيد لمعرفة الأعداد الزوجية).' },
      { term: 'Bitwise', meaning: 'عمليات على مستوى البتات (0 و 1) داخل الأرقام.' },
    ],
    syntax: `a, b = 17, 5
print(a // b, a % b, 2 ** 4)
print(a > 10 and b < 10)
print("py" in "python")`,
    howItWorks: 'تنفذ Python العمليات حسب أولوية رياضية دقيقة: الأقواس، ثم الأس، ثم الضرب/القسمة، ثم الجمع/الطرح، ثم المقارنة، ثم not / and / or.',
    examples: {
      simple: {
        title: 'العمليات الحسابية والإسناد المختصر',
        code: `x = 10\nx += 5\nprint("x =", x)\nprint("17 // 5 =", 17 // 5, "| 17 % 5 =", 17 % 5, "| 2**5 =", 2 ** 5)`,
        lineByLine: [
          'x += 5 تعادل x = x + 5.',
          '17 // 5 تعطي 3، وباقي القسمة % يعطي 2، و 2**5 تعطي 32.',
        ],
        expectedOutput: 'x = 15\n17 // 5 = 3 | 17 % 5 = 2 | 2**5 = 32',
      },
      intermediate: {
        title: 'المقارنة والمنطق و Membership و Identity',
        code: `score = 85\nval = None\nprint("Passed:", score >= 60 and score <= 100)\nprint("Is None:", val is None)\nprint("'Py' in PyLab:", "Py" in "PyLab")`,
        lineByLine: [
          'score >= 60 and score <= 100: التحقق من النطاق.',
          'val is None: الطريقة الصحيحة لفحص None.',
          '"Py" in "PyLab": البحث عن نص فرعي.',
        ],
        expectedOutput: "Passed: True\nIs None: True\n'Py' in PyLab: True",
      },
      advanced: {
        title: 'العمليات الثنائية Bitwise للأذونات',
        code: `READ, WRITE, EXEC = 1, 2, 4\nperms = READ | WRITE\nprint("Binary:", bin(perms))\nprint("Can write?", bool(perms & WRITE))\nprint("Can exec?", bool(perms & EXEC))`,
        lineByLine: [
          'READ=001, WRITE=010, EXEC=100 بالنظام الثنائي.',
          'perms = READ | WRITE تدمج الصلاحيتين (011 = 3).',
          'perms & WRITE تفحص هل بت الكتابة مفعّل.',
        ],
        expectedOutput: 'Binary: 0b11\nCan write? True\nCan exec? False',
      },
    },
    commonErrors: [
      { error: 'ZeroDivisionError', cause: 'القسمة على صفر عبر / أو // أو %.', fix: 'تحقق دائماً أن المقسوم عليه لا يساوي 0.' },
      { error: 'خلط = مع ==', cause: 'استخدام = في المقارنة بدلاً من ==.', fix: '= للإسناد و == للمقارنة.' },
    ],
    practicalUses: ['التحقق من شروط تسجيل الدخول.', 'فحص قابلية القسمة.', 'إدارة صلاحيات Bitmask.'],
    summary: [
      '// للقسمة الصحيحة و % للباقي و ** للأس.',
      'استخدم is مع None و in للبحث في التتابعات.',
    ],
    reviewQuestions: ['ما ناتج 10 // 3 و 10 % 3؟', 'متى نستخدم is بدلاً من ==؟'],
    exercises: ['اكتب تعبيراً يتحقق مما إذا كان العدد n زوجياً وموجباً.'],
    challenge: {
      prompt: 'احسب باقي قسمة 29 على 5 واطبع النتيجة.',
      starterCode: `n = 29\n# اطبع باقي القسمة على 5\n`,
      testHarness: `assert "4" in __out__, "باقي قسمة 29 على 5 هو 4"`,
      hint: 'print(n % 5)',
    },
    quiz: [
      {
        id: 'q5-1',
        type: 'mcq',
        question: 'ما ناتج العملية 2 ** 3 + 1 في Python؟',
        options: ['9', '7', '16', '8'],
        correctAnswer: '9',
        explanation: 'الأس ** له أولوية أعلى من الجمع +، لذا 8 + 1 = 9.',
      },
    ],
  },
  {
    id: 'lesson-06-strings',
    order: 6,
    level: 'beginner',
    title: 'النصوص Strings ودوالها والتعامل مع العربية',
    titleEn: 'Strings, Slicing, f-strings & Unicode',
    durationMinutes: 25,
    objectives: [
      'إنشاء النصوص والفهرسة (Indexing) والتقطيع (Slicing).',
      'استخدام الدوال الشائعة: upper, lower, strip, replace, split, join, find.',
      'إتقان التنسيق الحديث f-strings والتعامل مع Unicode والعربية.',
    ],
    intro:
      'النصوص (str) هي تسلسل غير قابل للتغيير (Immutable) من حروف Unicode، وتدعم Python اللغة العربية وجميع الرموز العالمية افتراضياً بترميز UTF-8.',
    theory: [
      'يبدأ الترقيم (Indexing) من 0 من اليسار، ومن -1 من اليمين. أما Slicing [start:end:step] فيستخرج مقطعاً نصياً.',
      'بما أن النصوص غير قابلة للتعديل، فإن دوال مثل replace() و upper() تعيد نصاً جديداً ولا تغير النص الأصلي.',
      'تُعد f-strings مثل f"الاسم: {name}" أسرع وأوضح طريقة لدمج المتغيرات والأرقام داخل النصوص.',
    ],
    terminology: [
      { term: 'Immutable', meaning: 'غير قابل للتعديل المباشر في مكانه بعد إنشائه.' },
      { term: 'Slicing', meaning: 'استخراج جزء من النص باستخدام [start:stop:step].' },
      { term: 'f-string', meaning: 'صيغة تنسيق نصوص حديثة تسمح بتضمين المتغيرات والتعبيرات داخل {}.' },
    ],
    syntax: `text = "  PyLab Studio  "
clean = text.strip()
print(f"Length={len(clean)}, Slice={clean[0:5]}")`,
    howItWorks: 'يخزن Python 3 النصوص كسلسلة Unicode موحدة، مما يجعل len("مرحبا") يعيد 5 بدقة.',
    examples: {
      simple: {
        title: 'الفهرسة والتقطيع والطول',
        code: `word = "Python"\nprint("الأول:", word[0], "الأخير:", word[-1])\nprint("أول 3 حروف:", word[:3])\nprint("الطول:", len(word))`,
        lineByLine: [
          'word[0]: أول حرف P، و word[-1]: آخر حرف n.',
          'word[:3]: الأحرف من الفهرس 0 إلى 2.',
        ],
        expectedOutput: 'الأول: P الأخير: n\nأول 3 حروف: Pyt\nالطول: 6',
      },
      intermediate: {
        title: 'تنظيف النصوص وتقسيمها ودمجها',
        code: `raw = "  ahmed,sara,omar  "\nnames = raw.strip().split(",")\nformatted = " | ".join(n.capitalize() for n in names)\nprint(formatted)`,
        lineByLine: [
          '.strip(): إزالة المسافات من الطرفين.',
          '.split(","): تحويل النص إلى قائمة.',
          '.join(...): إعادة دمج القائمة بفاصل جديد.',
        ],
        expectedOutput: 'Ahmed | Sara | Omar',
      },
      advanced: {
        title: 'f-strings متقدمة ونصوص عربية متعددة الأسطر',
        code: `student = "خالد"\nscore = 93.456\nmsg = f"""الطالب: {student}\nالنسبة: {score:.1f}%\nالحالة: {'ناجح' if score >= 50 else 'راسب'}"""\nprint(msg)`,
        lineByLine: [
          '{score:.1f}: تقريب الرقم لخانة عشرية واحدة.',
          'إمكانية كتابة شرط مختصر داخل {}.',
        ],
        expectedOutput: 'الطالب: خالد\nالنسبة: 93.5%\nالحالة: ناجح',
      },
    },
    commonErrors: [
      { error: 'TypeError: str object does not support item assignment', cause: 'محاولة كتابة s[0] = "A".', fix: 'أنشئ نصاً جديداً بالتقطيع أو replace().' },
      { error: 'IndexError', cause: 'الوصول لفهرس أكبر من طول النص.', fix: 'تأكد من طول النص باستخدام len().' },
    ],
    practicalUses: ['معالجة مدخلات النماذج.', 'تحليل السجلات والملفات النصية.', 'تنسيق التقارير العربية والإنجليزية.'],
    summary: [
      'التقطيع [start:end] لا يشمل العنصر عند end.',
      'استخدم f-strings لتنسيق احترافي وسريع.',
    ],
    reviewQuestions: ['ما ناتج "Python"[::-1]؟', 'ماذا تفعل دالة split()؟'],
    exercises: ['اقرأ جملة فيها كلمات مفصولة بمسافات واطبع عدد كلماتها.'],
    challenge: {
      prompt: 'حوّل النص "  hello python  " بإزالة المسافات وجعل أول حرف من كل كلمة كبيراً (.title()) ثم اطبعه.',
      starterCode: `s = "  hello python  "\n`,
      testHarness: `assert "Hello Python" in __out__, "النتيجة يجب أن تكون Hello Python"`,
      hint: 'print(s.strip().title())',
    },
    quiz: [
      {
        id: 'q6-1',
        type: 'mcq',
        question: 'ما ناتج "PyLab"[1:4]؟',
        options: ['yLa', 'PyL', 'Lab', 'yLab'],
        correctAnswer: 'yLa',
        explanation: 'الفهرس 1 هو y، و2 هو L، و3 هو a، ويتوقف قبل 4.',
      },
    ],
  },
  {
    id: 'lesson-07-lists',
    order: 7,
    level: 'beginner',
    title: 'القوائم Lists و List Comprehension',
    titleEn: 'Lists, Methods & List Comprehension',
    durationMinutes: 25,
    objectives: [
      'إنشاء القوائم وتعديل عناصرها وإضافتها وحذفها.',
      'إتقان دوال القوائم: append, extend, insert, remove, pop, sort, reverse, copy.',
      'استخدام List Comprehension والقوائم المتداخلة.',
    ],
    intro:
      'القائمة (List) هي البنية الأساسية لتخزين مجموعات مرتبة وقابلة للتعديل من العناصر في Python.',
    theory: [
      'تُكتب القائمة بين أقواس مربعة [ ] وتقبل أي نوع من البيانات مع إمكانية التعديل والإضافة والحذف.',
      'append(x) تضيف عنصراً في النهاية، بينما extend(iterable) تدمج عناصر قائمة أخرى، و insert(i, x) تضيف في موقع محدد.',
      'للحذف: remove(val) تحذف أول ظهور للقيمة، و pop(i) تحذف وتعيد العنصر عند الفهرس. وللنسخ الآمن نستخدم .copy() لتجنب تعديل القائمة الأصلية.',
      'List Comprehension طريقة مختصرة وسريعة لبناء قوائم جديدة في سطر واحد مثل [x*x for x in nums if x > 0].',
    ],
    terminology: [
      { term: 'Mutable', meaning: 'قابل للتعديل المباشر بعد الإنشاء مثل القوائم.' },
      { term: 'List Comprehension', meaning: 'صياغة مختصرة لإنشاء قائمة عبر حلقة وشرط في سطر واحد.' },
    ],
    syntax: `items = [10, 20, 30]
items.append(40)
squares = [n ** 2 for n in items]`,
    howItWorks: 'تخزن القائمة مصفوفة ديناميكية من المراجع (Pointers) إلى الكائنات، وتتوسع تلقائياً عند append.',
    examples: {
      simple: {
        title: 'الإضافة والحذف والفرز',
        code: `nums = [5, 2, 9]\nnums.append(1)\nnums.sort()\nprint("Sorted:", nums)\nlast = nums.pop()\nprint("Popped:", last, "| Remaining:", nums)`,
        lineByLine: [
          'append(1): إضافة 1 للنهاية.',
          'sort(): ترتيب القائمة تصاعدياً في مكانها.',
          'pop(): إزالة وإرجاع آخر عنصر.',
        ],
        expectedOutput: 'Sorted: [1, 2, 5, 9]\nPopped: 9 | Remaining: [1, 2, 5]',
      },
      intermediate: {
        title: 'القوائم المتداخلة والنسخ الآمن',
        code: `matrix = [[1, 2], [3, 4]]\nflat = [cell for row in matrix for cell in row]\nbackup = flat.copy()\nbackup.reverse()\nprint("Flat:", flat)\nprint("Reversed:", backup)`,
        lineByLine: [
          'matrix: قائمة ثنائية الأبعاد.',
          'flat: تسطيح المصفوفة بـ List Comprehension.',
          '.copy(): إنشاء نسخة مستقلة قبل reverse().',
        ],
        expectedOutput: 'Flat: [1, 2, 3, 4]\nReversed: [4, 3, 2, 1]',
      },
      advanced: {
        title: 'تصفية وتحويل بيانات الطلاب بـ Comprehension',
        code: `scores = [45, 78, 92, 55, 88]\npassed = [s for s in scores if s >= 60]\nprint("Passed count:", len(passed), "| Scores:", passed)`,
        lineByLine: [
          'تصفية الدرجات التي تساوي أو تفوق 60 فقط.',
        ],
        expectedOutput: 'Passed count: 3 | Scores: [78, 92, 88]',
      },
    },
    commonErrors: [
      { error: 'ValueError: list.remove(x): x not in list', cause: 'محاولة حذف قيمة غير موجودة.', fix: 'تحقق بـ if x in my_list قبل الحذف.' },
    ],
    practicalUses: ['تخزين قوائم المهام والبيانات.', 'بناء المصفوفات ومعالجة الصفوف.'],
    summary: [
      'القوائم مرتبة وقابلة للتعديل.',
      'استخدم .copy() لعمل نسخة مستقلة.',
      'List Comprehension تجعل التحويلات أنظف وأسرع.',
    ],
    reviewQuestions: ['ما الفرق بين append() و extend()؟', 'لماذا نستخدم .copy() بدلاً من b = a؟'],
    exercises: ['أنشئ قائمة بالأرقام من 1 إلى 10 ثم استخرج الأعداد الزوجية باستخدام List Comprehension.'],
    challenge: {
      prompt: 'أنشئ قائمة مربعات الأعداد [1, 2, 3, 4] واطبعها كقائمة [1, 4, 9, 16].',
      starterCode: `nums = [1, 2, 3, 4]\n`,
      testHarness: `assert "[1, 4, 9, 16]" in __out__`,
      hint: 'print([n * n for n in nums])',
    },
    quiz: [
      {
        id: 'q7-1',
        type: 'mcq',
        question: 'أي دالة تضيف جميع عناصر قائمة أخرى إلى نهاية القائمة الحالية؟',
        options: ['extend()', 'append()', 'insert()', 'count()'],
        correctAnswer: 'extend()',
        explanation: 'extend() تدمج العناصر واحدة تلو الأخرى، بينما append() تضيف القائمة كعنصر واحد.',
      },
    ],
  },
];
