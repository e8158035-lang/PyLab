import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Play,
  RotateCcw,
  Copy,
  CheckCircle2,
  Bookmark,
  Award,
  Code2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';
import { ALL_LESSONS, APPLIED_PROJECTS, LEARNING_BADGES } from '../data/learningCurriculum';
import { api } from '../services/api';
import type {
  AppliedProjectLesson,
  LearningLesson,
  LearningProgress,
  SkillLevel,
} from '../types/pylab';

interface LearningCenterViewProps {
  progress: LearningProgress;
  onUpdateProgress: (next: LearningProgress) => void;
  onOpenCodeInEditor: (filename: string, code: string) => Promise<void>;
}

const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'مبتدئ (Beginner)',
  intermediate: 'متوسط (Intermediate)',
  advanced: 'متقدم (Advanced)',
  professional: 'احترافي (Professional)',
};

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  progress,
  onUpdateProgress,
  onOpenCodeInEditor,
}) => {
  const [sectionTab, setSectionTab] = useState<'overview' | 'lesson' | 'projects' | 'badges'>('overview');
  const [levelFilter, setLevelFilter] = useState<'all' | SkillLevel>('all');
  const [activeLesson, setActiveLesson] = useState<LearningLesson>(
    () => ALL_LESSONS.find((l) => l.id === progress.lastLessonId) || ALL_LESSONS[0]
  );
  const [exampleTier, setExampleTier] = useState<'simple' | 'intermediate' | 'advanced'>('simple');
  const [playgroundCode, setPlaygroundCode] = useState(activeLesson.examples.simple.code);
  const [playgroundResult, setPlaygroundResult] = useState<{
    stdout: string;
    stderr: string;
    durationMs: number;
  } | null>(null);
  const [runningPlayground, setRunningPlayground] = useState(false);

  // Challenge state
  const [challengeCode, setChallengeCode] = useState(activeLesson.challenge.starterCode);
  const [challengeResult, setChallengeResult] = useState<{ passed: boolean; msg: string } | null>(null);
  const [runningChallenge, setRunningChallenge] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Applied project state
  const [selectedApplied, setSelectedApplied] = useState<AppliedProjectLesson>(APPLIED_PROJECTS[0]);
  const [appliedOutput, setAppliedOutput] = useState<{ stdout: string; stderr: string } | null>(null);

  useEffect(() => {
    setPlaygroundCode(activeLesson.examples[exampleTier].code);
  }, [activeLesson.id, exampleTier]);

  useEffect(() => {
    setChallengeCode(activeLesson.challenge.starterCode);
    setChallengeResult(null);
    setPlaygroundResult(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
  }, [activeLesson.id]);

  const computeBadges = (p: LearningProgress): string[] => {
    const badges = new Set(p.earnedBadges);
    if (p.completedLessons.length >= 1) badges.add('badge-first-step');
    const beginnerIds = ALL_LESSONS.filter((l) => l.level === 'beginner').map((l) => l.id);
    if (beginnerIds.every((id) => p.completedLessons.includes(id))) badges.add('badge-beginner-master');
    if (p.solvedChallenges.length >= 5) badges.add('badge-code-challenger');
    if (Object.keys(p.quizScores).length >= 5) badges.add('badge-quiz-ace');
    if (p.completedLessons.length >= 12) badges.add('badge-python-architect');
    return Array.from(badges);
  };

  const openLesson = (lesson: LearningLesson) => {
    setActiveLesson(lesson);
    setSectionTab('lesson');
    onUpdateProgress({
      ...progress,
      lastLessonId: lesson.id,
    });
  };

  const toggleCompleteLesson = (lessonId: string) => {
    const exists = progress.completedLessons.includes(lessonId);
    const completedLessons = exists
      ? progress.completedLessons.filter((id) => id !== lessonId)
      : [...progress.completedLessons, lessonId];
    const next: LearningProgress = {
      ...progress,
      completedLessons,
      lastLessonId: lessonId,
    };
    next.earnedBadges = computeBadges(next);
    onUpdateProgress(next);
  };

  const toggleBookmark = (lessonId: string) => {
    const exists = progress.bookmarkedLessons.includes(lessonId);
    const bookmarkedLessons = exists
      ? progress.bookmarkedLessons.filter((id) => id !== lessonId)
      : [...progress.bookmarkedLessons, lessonId];
    onUpdateProgress({ ...progress, bookmarkedLessons });
  };

  const handleRunPlayground = async () => {
    setRunningPlayground(true);
    setPlaygroundResult(null);
    try {
      const res = await api.execInline({ code: playgroundCode });
      setPlaygroundResult({ stdout: res.stdout, stderr: res.stderr, durationMs: res.durationMs });
    } catch (err: unknown) {
      setPlaygroundResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        durationMs: 0,
      });
    } finally {
      setRunningPlayground(false);
    }
  };

  const handleRunChallenge = async () => {
    setRunningChallenge(true);
    setChallengeResult(null);
    const wrapped = `import io, contextlib, json
__buf__ = io.StringIO()
__user_code__ = ${JSON.stringify(challengeCode)}
with contextlib.redirect_stdout(__buf__):
    exec(compile(__user_code__, "challenge.py", "exec"), {"__name__": "__main__"})
__out__ = __buf__.getvalue()
print(__out__, end="")
${activeLesson.challenge.testHarness}
print("__CHALLENGE_OK__")
`;
    try {
      const res = await api.execInline({ code: wrapped });
      if (res.exitCode === 0 && res.stdout.includes('__CHALLENGE_OK__')) {
        setChallengeResult({
          passed: true,
          msg: `أحسنت! نجح الاختبار الفعلي.\nالمخرجات:\n${res.stdout.replace('__CHALLENGE_OK__', '').trim()}`,
        });
        if (!progress.solvedChallenges.includes(activeLesson.id)) {
          const next: LearningProgress = {
            ...progress,
            solvedChallenges: [...progress.solvedChallenges, activeLesson.id],
          };
          next.earnedBadges = computeBadges(next);
          onUpdateProgress(next);
        }
      } else {
        setChallengeResult({
          passed: false,
          msg: res.stderr || 'لم يحقق الكود شروط الاختبار بعد. راجع التلميح وحاول مجدداً.',
        });
      }
    } catch (err: unknown) {
      setChallengeResult({ passed: false, msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setRunningChallenge(false);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    let score = 0;
    for (const q of activeLesson.quiz) {
      if (quizAnswers[q.id] === q.correctAnswer) score += 1;
    }
    const next: LearningProgress = {
      ...progress,
      quizScores: {
        ...progress.quizScores,
        [activeLesson.id]: { score, total: activeLesson.quiz.length },
      },
    };
    next.earnedBadges = computeBadges(next);
    onUpdateProgress(next);
  };

  const handleRunAppliedProject = async () => {
    const code = selectedApplied.files[selectedApplied.mainFile] || '';
    const res = await api.execInline({ code });
    setAppliedOutput({ stdout: res.stdout, stderr: res.stderr });
  };

  const completedCount = progress.completedLessons.length;
  const totalCount = ALL_LESSONS.length;
  const pct = Math.round((completedCount / totalCount) * 100);
  const filteredLessons = ALL_LESSONS.filter((l) => levelFilter === 'all' || l.level === levelFilter);
  const currentExample = activeLesson.examples[exampleTier];
  const currentIdx = ALL_LESSONS.findIndex((l) => l.id === activeLesson.id);

  return (
    <div dir="rtl" className="p-5 sm:p-6 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-violet-500 shrink-0" />
            <span>مركز تعلم Python الشامل (Python Learning Center)</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            دورة متكاملة من الصفر حتى الاحتراف تعمل محلياً دون إنترنت مع تنفيذ فعلي للأكواد عبر Python 3.11
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#121521] border border-slate-200 dark:border-[#23283B] overflow-x-auto">
          {[
            { id: 'overview', label: 'المسار التعليمي' },
            { id: 'lesson', label: 'قارئ الدروس' },
            { id: 'projects', label: 'مشاريع تطبيقية' },
            { id: 'badges', label: 'الإنجازات' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSectionTab(t.id as typeof sectionTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                sectionTab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              نسبة الإنجاز: {pct}%
            </span>
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              المكتمل: {completedCount} · المتبقي: {totalCount - completedCount} · التحديات المحلولة: {progress.solvedChallenges.length}
            </span>
          </div>

          <button
            onClick={() => openLesson(ALL_LESSONS.find((l) => l.id === progress.lastLessonId) || ALL_LESSONS[0])}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
          >
            متابعة التعلم: {activeLesson.title}
          </button>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#1E2336] overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className="h-full bg-gradient-to-l from-violet-600 to-blue-500 transition-all duration-300"
          />
        </div>
      </div>

      {/* TAB 1: OVERVIEW & CURRICULUM */}
      {sectionTab === 'overview' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'beginner', 'intermediate', 'advanced', 'professional'] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => setLevelFilter(lv)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  levelFilter === lv
                    ? 'bg-violet-600 text-white'
                    : 'bg-white dark:bg-[#121521] border border-slate-200 dark:border-[#23283B] text-slate-700 dark:text-slate-300'
                }`}
              >
                {lv === 'all' ? `جميع المستويات (${ALL_LESSONS.length})` : LEVEL_LABELS[lv]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => {
              const done = progress.completedLessons.includes(lesson.id);
              const bookmarked = progress.bookmarkedLessons.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  onClick={() => openLesson(lesson)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] hover:border-violet-500/60 cursor-pointer transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>
                        الدرس {lesson.order} · {LEVEL_LABELS[lesson.level]}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {bookmarked && <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{lesson.intro}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-[#1E2336]">
                    <span className="text-slate-500">{lesson.durationMinutes} دقيقة</span>
                    <span className="font-semibold text-violet-600 dark:text-violet-400">ابدأ الدرس</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LESSON READER + PLAYGROUND + CHALLENGE + QUIZ */}
      {sectionTab === 'lesson' && (
        <div className="space-y-6">
          {/* Lesson Top Controls */}
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-violet-500 font-semibold">
                  الدرس {activeLesson.order} · {LEVEL_LABELS[activeLesson.level]} · {activeLesson.durationMinutes} دقيقة
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {activeLesson.title}
                </h2>
                <div dir="ltr" className="text-xs font-mono text-slate-500 text-right mt-0.5">
                  {activeLesson.titleEn}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleBookmark(activeLesson.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    progress.bookmarkedLessons.includes(activeLesson.id)
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-slate-300 dark:border-[#2A3046] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>حفظ الدرس</span>
                </button>

                <button
                  onClick={() => toggleCompleteLesson(activeLesson.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    progress.completedLessons.includes(activeLesson.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {progress.completedLessons.includes(activeLesson.id) ? 'تم الإكمال' : 'تحديد كمكتمل'}
                  </span>
                </button>
              </div>
            </div>

            {/* Objectives & Intro */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-[#1E2336]">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">الأهداف التعليمية</h3>
                <ul className="list-disc pr-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {activeLesson.objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">مقدمة مبسطة</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{activeLesson.intro}</p>
              </div>
            </div>
          </div>

          {/* Theory, Terminology, Syntax & How It Works */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">الشرح النظري وطريقة العمل</h3>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeLesson.theory.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1E2336]">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">آلية عمل المفسر (How It Works)</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">{activeLesson.howItWorks}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">بناء الجملة (Syntax)</h4>
                <pre dir="ltr" className="p-3 rounded-lg bg-[#090B11] text-slate-100 font-mono text-xs overflow-x-auto">
                  {activeLesson.syntax}
                </pre>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">المصطلحات البرمجية</h3>
              <div className="space-y-3">
                {activeLesson.terminology.map((t) => (
                  <div key={t.term} className="pb-2.5 border-b border-slate-100 dark:border-[#1E2336] last:border-0">
                    <div dir="ltr" className="font-mono text-xs font-semibold text-violet-500 text-right">
                      {t.term}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{t.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Tier Examples + Real Interactive Code Playground */}
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-violet-500" />
                <span>الأمثلة المتدرجة والمحرر التفاعلي الحقيقي</span>
              </h3>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0D14]">
                {(
                  [
                    { id: 'simple', label: 'مثال بسيط' },
                    { id: 'intermediate', label: 'مثال متوسط' },
                    { id: 'advanced', label: 'مثال متقدم' },
                  ] as const
                ).map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setExampleTier(tier.id)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      exampleTier === tier.id
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Interactive Playground (LTR) */}
              <div dir="ltr" className="rounded-xl border border-[#23283B] bg-[#090B11] overflow-hidden flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#121521] border-b border-[#23283B] text-xs">
                  <span className="font-mono text-slate-300">Code Playground (Python 3.11)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPlaygroundCode(currentExample.code)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:text-white"
                      title="Reset to original example"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={() => navigator.clipboard?.writeText(playgroundCode)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenCodeInEditor(`${activeLesson.id}.py`, playgroundCode)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                    >
                      <span>Open in IDE</span>
                    </button>
                    <button
                      onClick={handleRunPlayground}
                      disabled={runningPlayground}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                    >
                      <Play className="w-3 h-3" />
                      <span>{runningPlayground ? 'Running...' : 'Run'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={playgroundCode}
                  onChange={(e) => setPlaygroundCode(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="w-full p-3 bg-[#090B11] text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y"
                />

                {playgroundResult && (
                  <div className="p-3 border-t border-[#23283B] bg-[#06070B] font-mono text-xs">
                    <div className="text-[11px] text-slate-500 mb-1">
                      Execution Output ({playgroundResult.durationMs} ms):
                    </div>
                    {playgroundResult.stdout && (
                      <pre className="text-emerald-300 whitespace-pre-wrap">{playgroundResult.stdout}</pre>
                    )}
                    {playgroundResult.stderr && (
                      <pre className="text-red-400 whitespace-pre-wrap">{playgroundResult.stderr}</pre>
                    )}
                  </div>
                )}
              </div>

              {/* Line-by-line Explanation & Expected Output */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                    {currentExample.title} — شرح الكود سطراً بسطر
                  </h4>
                  <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {currentExample.lineByLine.map((ln, idx) => (
                      <li key={idx}>{ln}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1.5">النتيجة المتوقعة</h4>
                  <pre dir="ltr" className="p-3 rounded-lg bg-[#090B11] text-emerald-300 font-mono text-xs overflow-x-auto">
                    {currentExample.expectedOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Common Errors, Practical Uses, Summary, Exercises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-3">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                الأخطاء الشائعة وكيفية إصلاحها
              </h3>
              <div className="space-y-3">
                {activeLesson.commonErrors.map((err, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-[#23283B] text-xs space-y-1">
                    <div dir="ltr" className="font-mono font-semibold text-red-400 text-right">
                      {err.error}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">السبب: {err.cause}</div>
                    <div className="text-emerald-600 dark:text-emerald-400">الحل: {err.fix}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-1.5">
                  الاستخدامات العملية وملخص الدرس
                </h3>
                <ul className="list-disc pr-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {activeLesson.practicalUses.map((u, i) => (
                    <li key={`u-${i}`}>{u}</li>
                  ))}
                  {activeLesson.summary.map((s, i) => (
                    <li key={`s-${i}`} className="font-medium text-slate-800 dark:text-slate-100">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#1E2336]">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1.5">أسئلة مراجعة وتمارين</h4>
                <ul className="list-disc pr-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {activeLesson.reviewQuestions.map((q, i) => (
                    <li key={`rq-${i}`}>{q}</li>
                  ))}
                  {activeLesson.exercises.map((ex, i) => (
                    <li key={`ex-${i}`}>{ex}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Verified Coding Challenge */}
          <div className="rounded-xl border border-violet-500/40 bg-white dark:bg-[#121521] p-5 space-y-3">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              التحدي البرمجي التطبيقي (اختبار فعلي عبر Python)
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">{activeLesson.challenge.prompt}</p>
            <p className="text-xs text-slate-500">تلميح: {activeLesson.challenge.hint}</p>

            <textarea
              dir="ltr"
              value={challengeCode}
              onChange={(e) => setChallengeCode(e.target.value)}
              rows={5}
              spellCheck={false}
              className="w-full p-3 rounded-lg border border-[#23283B] bg-[#090B11] text-slate-100 font-mono text-xs focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunChallenge}
                disabled={runningChallenge}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
              >
                {runningChallenge ? 'جاري التحقق...' : 'تشغيل والتحقق من الحل'}
              </button>
            </div>
            {challengeResult && (
              <div
                className={`p-3 rounded-lg text-xs whitespace-pre-wrap ${
                  challengeResult.passed
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {challengeResult.msg}
              </div>
            )}
          </div>

          {/* Interactive Lesson Quiz */}
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>اختبار الدرس القصير</span>
            </h3>
            {activeLesson.quiz.map((q) => (
              <div key={q.id} className="space-y-2 pb-3 border-b border-slate-100 dark:border-[#1E2336] last:border-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{q.question}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(q.options || []).map((opt) => {
                    const chosen = quizAnswers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className={`p-2.5 rounded-lg border text-right text-xs transition-colors ${
                          quizSubmitted
                            ? opt === q.correctAnswer
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : chosen
                              ? 'border-red-500 bg-red-500/10 text-red-400'
                              : 'border-slate-200 dark:border-[#23283B] text-slate-500'
                            : chosen
                            ? 'border-violet-500 bg-violet-500/10 text-violet-400 font-semibold'
                            : 'border-slate-200 dark:border-[#23283B] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">التفسير: {q.explanation}</div>
                )}
              </div>
            ))}

            <button
              onClick={handleSubmitQuiz}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              تصحيح الاختبار وحفظ النتيجة
            </button>
          </div>

          {/* Prev / Next Lesson Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentIdx > 0 && openLesson(ALL_LESSONS[currentIdx - 1])}
              disabled={currentIdx <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الدرس السابق</span>
            </button>
            <button
              onClick={() => currentIdx < ALL_LESSONS.length - 1 && openLesson(ALL_LESSONS[currentIdx + 1])}
              disabled={currentIdx >= ALL_LESSONS.length - 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold disabled:opacity-40"
            >
              <span>الدرس التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: APPLIED PROJECTS */}
      {sectionTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] divide-y divide-slate-100 dark:divide-[#1E2336]">
            {APPLIED_PROJECTS.map((proj) => (
              <button
                key={proj.id}
                onClick={() => {
                  setSelectedApplied(proj);
                  setAppliedOutput(null);
                }}
                className={`w-full p-4 text-right transition-colors ${
                  selectedApplied.id === proj.id ? 'bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#191D2D]'
                }`}
              >
                <div className="text-xs text-violet-500 font-semibold">{LEVEL_LABELS[proj.level]}</div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">{proj.title}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {selectedApplied.title}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleRunAppliedProject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>تشغيل المشروع</span>
                </button>
                <button
                  onClick={() =>
                    onOpenCodeInEditor(
                      selectedApplied.mainFile,
                      selectedApplied.files[selectedApplied.mainFile] || ''
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                  <span>فتح في المحرر</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">{selectedApplied.idea}</p>

            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-1">خطوات التنفيذ</h4>
              <ol className="list-decimal pr-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {selectedApplied.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>

            <pre dir="ltr" className="p-3 rounded-lg bg-[#090B11] text-slate-100 font-mono text-xs overflow-x-auto">
              {selectedApplied.files[selectedApplied.mainFile]}
            </pre>

            {appliedOutput && (
              <div dir="ltr" className="p-3 rounded-lg bg-[#06070B] border border-[#23283B] font-mono text-xs">
                {appliedOutput.stdout && <pre className="text-emerald-300 whitespace-pre-wrap">{appliedOutput.stdout}</pre>}
                {appliedOutput.stderr && <pre className="text-red-400 whitespace-pre-wrap">{appliedOutput.stderr}</pre>}
              </div>
            )}

            <div>
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-1">تحديات إضافية</h4>
              <ul className="list-disc pr-5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                {selectedApplied.extraChallenges.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFLINE ACHIEVEMENTS & BADGES */}
      {sectionTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEARNING_BADGES.map((b) => {
            const earned = progress.earnedBadges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-5 rounded-xl border ${
                  earned
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Award className={`w-6 h-6 ${earned ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-semibold ${earned ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {earned ? 'مكتسبة' : 'مقفلة'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{b.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{b.description}</p>
                <div className="text-[11px] text-slate-500 mt-2">{b.requirementText}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
