export type AppView =
  | 'dashboard'
  | 'editor'
  | 'terminal'
  | 'packages'
  | 'explorer'
  | 'servers'
  | 'examples'
  | 'learning'
  | 'runtime'
  | 'settings';

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  template: string;
  mainFile: string;
  pythonVersion: string;
  createdAt: string;
  updatedAt: string;
  path: string;
  fileCount: number;
  sizeBytes: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  extension: string;
  modifiedAt: string;
  children?: FileNode[];
}

export interface EditorTab {
  id: string;
  projectId: string;
  path: string;
  name: string;
  content: string;
  savedContent: string;
  dirty: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  accentColor: 'violet' | 'blue' | 'emerald';
  language: 'ar' | 'en';
  editorFontSize: number;
  editorFontFamily: string;
  tabSize: number;
  autoIndent: boolean;
  autoComplete: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
  autoSave: boolean;
  syntaxHighlighting: boolean;
  terminalFontSize: number;
  terminalTheme: 'slate' | 'midnight' | 'matrix';
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'violet',
  language: 'ar',
  editorFontSize: 14,
  editorFontFamily: 'JetBrains Mono',
  tabSize: 4,
  autoIndent: true,
  autoComplete: true,
  lineNumbers: true,
  wordWrap: false,
  autoSave: false,
  syntaxHighlighting: true,
  terminalFontSize: 13,
  terminalTheme: 'midnight',
};

export interface RuntimeInfo {
  pythonVersion: string;
  executable: string;
  platform: string;
  sysPath: string[];
  packagesDir: string;
  stdlibModules: string[];
  envVars: Record<string, string>;
}

export interface ExecutionHistoryItem {
  id: string;
  project_id: string;
  file_path: string;
  status: string;
  exit_code: number;
  duration_ms: number;
  started_at: string;
  output_preview: string;
}

export interface ConsoleOutputState {
  runId: string | null;
  status: 'idle' | 'running' | 'success' | 'error' | 'stopped';
  filePath: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  errorLine: number | null;
}

export interface DebugVariable {
  name: string;
  type: string;
  value: string;
}

export interface DebugStackFrame {
  file: string;
  fullPath: string;
  line: number;
  function: string;
}

export interface DebugState {
  debugId: string | null;
  status: 'idle' | 'running' | 'paused' | 'finished' | 'error';
  currentFile: string;
  currentLine: number | null;
  currentFunction: string;
  locals: DebugVariable[];
  globals: DebugVariable[];
  stack: DebugStackFrame[];
  output: string;
  exceptionText: string | null;
}

export interface InstalledPackage {
  name: string;
  normalized: string;
  version: string;
  summary: string;
  author: string;
  license: string;
  home_page: string;
  requires: string[];
}

export interface CatalogPackage {
  name: string;
  description: string;
  category: string;
  compatibility: 'compatible' | 'partial' | 'requires_setup' | 'incompatible';
  compatibilityNote: string;
}

export interface WebServerInstance {
  serverId: string;
  projectId: string;
  projectName: string;
  framework: 'flask' | 'fastapi' | 'http';
  entryFile: string;
  host: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startedAt: string;
  logs: string[];
  previewUrl: string;
}

export interface ExampleItem {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  description: string;
  requirements: string[];
  runInstructions: string;
  mainFile: string;
  files: Record<string, string>;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'fill_code' | 'fix_error';
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface CodingChallenge {
  prompt: string;
  starterCode: string;
  testHarness: string;
  hint: string;
}

export interface LearningLesson {
  id: string;
  order: number;
  level: SkillLevel;
  title: string;
  titleEn: string;
  durationMinutes: number;
  objectives: string[];
  intro: string;
  theory: string[];
  terminology: Array<{ term: string; meaning: string }>;
  syntax: string;
  howItWorks: string;
  examples: {
    simple: { title: string; code: string; lineByLine: string[]; expectedOutput: string };
    intermediate: { title: string; code: string; lineByLine: string[]; expectedOutput: string };
    advanced: { title: string; code: string; lineByLine: string[]; expectedOutput: string };
  };
  commonErrors: Array<{ error: string; cause: string; fix: string }>;
  practicalUses: string[];
  summary: string[];
  reviewQuestions: string[];
  exercises: string[];
  challenge: CodingChallenge;
  quiz: QuizQuestion[];
}

export interface AppliedProjectLesson {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  idea: string;
  requirements: string[];
  steps: string[];
  mainFile: string;
  files: Record<string, string>;
  codeExplanation: string[];
  runInstructions: string;
  expectedOutput: string;
  extraChallenges: string[];
}

export interface LearningProgress {
  completedLessons: string[];
  bookmarkedLessons: string[];
  lastLessonId: string | null;
  quizScores: Record<string, { score: number; total: number }>;
  solvedChallenges: string[];
  earnedBadges: string[];
}

export const DEFAULT_LEARNING_PROGRESS: LearningProgress = {
  completedLessons: [],
  bookmarkedLessons: [],
  lastLessonId: null,
  quizScores: {},
  solvedChallenges: [],
  earnedBadges: [],
};
