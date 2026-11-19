import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Bug,
  Save,
  Undo2,
  Redo2,
  Search,
  Hash,
  WrapText,
  X,
  FilePlus,
  Terminal as TerminalIcon,
  PanelBottom,
  FolderTree,
  ChevronRight,
  ChevronDown,
  FileCode2,
} from 'lucide-react';
import type {
  AppSettings,
  ConsoleOutputState,
  DebugState,
  EditorTab,
  FileNode,
  ProjectMeta,
} from '../types/pylab';
import { highlightCodeLine, PYTHON_AUTOCOMPLETE_WORDS } from '../utils/syntaxHighlight';
import { ConsolePanel } from './ConsolePanel';
import { DebuggerPanel } from './DebuggerPanel';
import { TerminalView } from './TerminalView';

interface CodeEditorViewProps {
  project: ProjectMeta | null;
  fileTree: FileNode[];
  tabs: EditorTab[];
  activeTabId: string | null;
  settings: AppSettings;
  consoleState: ConsoleOutputState;
  debugState: DebugState;
  breakpoints: Record<string, number[]>;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onUpdateTabContent: (id: string, content: string) => void;
  onSaveTab: (id: string) => Promise<void>;
  onOpenFile: (projectId: string, path: string) => Promise<void>;
  onNewFile: () => void;
  onRunActive: () => void;
  onStopRun: () => void;
  onClearConsole: () => void;
  onSendStdin: (input: string) => void;
  onSaveConsoleOutput: (text: string) => void;
  onStartDebug: () => void;
  onDebugCommand: (action: 'continue' | 'step_into' | 'step_over' | 'step_out' | 'pause' | 'stop') => void;
  onToggleBreakpoint: (tabKey: string, line: number) => void;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
}

const SYMBOL_KEYS = ['(', ')', '[', ']', '{', '}', ':', '=', '"', "'", '#', '@', ',', '.', '_', '->'];

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  project,
  fileTree,
  tabs,
  activeTabId,
  settings,
  consoleState,
  debugState,
  breakpoints,
  onSelectTab,
  onCloseTab,
  onUpdateTabContent,
  onSaveTab,
  onOpenFile,
  onNewFile,
  onRunActive,
  onStopRun,
  onClearConsole,
  onSendStdin,
  onSaveConsoleOutput,
  onStartDebug,
  onDebugCommand,
  onToggleBreakpoint,
  onUpdateSettings,
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || null;
  const [showSidebar, setShowSidebar] = useState(true);
  const [bottomMode, setBottomMode] = useState<'none' | 'console' | 'terminal' | 'debugger'>('console');
  const [bottomHeight, setBottomHeight] = useState(250);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [goToLineVal, setGoToLineVal] = useState('');
  const [cursorLine, setCursorLine] = useState(1);
  const [foldedBlocks, setFoldedBlocks] = useState<Set<number>>(new Set());
  const [autocompleteList, setAutocompleteList] = useState<string[]>([]);
  const [undoStacks, setUndoStacks] = useState<Record<string, string[]>>({});
  const [redoStacks, setRedoStacks] = useState<Record<string, string[]>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Switch bottom panel automatically when running or debugging
  useEffect(() => {
    if (consoleState.status === 'running') setBottomMode('console');
  }, [consoleState.status]);

  useEffect(() => {
    if (debugState.status === 'running' || debugState.status === 'paused') setBottomMode('debugger');
  }, [debugState.status]);

  const tabKey = activeTab ? `${activeTab.projectId}:${activeTab.path}` : '';
  const activeBreakpoints = tabKey ? breakpoints[tabKey] || [] : [];

  const lines = useMemo(() => (activeTab ? activeTab.content.split('\n') : ['']), [activeTab]);

  const syncScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const pushUndo = (tabId: string, prevContent: string) => {
    setUndoStacks((prev) => ({
      ...prev,
      [tabId]: [...(prev[tabId] || []).slice(-40), prevContent],
    }));
    setRedoStacks((prev) => ({ ...prev, [tabId]: [] }));
  };

  const applyEdit = (newContent: string, nextSelection?: number) => {
    if (!activeTab) return;
    pushUndo(activeTab.id, activeTab.content);
    onUpdateTabContent(activeTab.id, newContent);
    if (nextSelection !== undefined) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = nextSelection;
          textareaRef.current.selectionEnd = nextSelection;
          updateCursorLine();
        }
      });
    }
  };

  const handleUndo = () => {
    if (!activeTab) return;
    const stack = undoStacks[activeTab.id] || [];
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    setUndoStacks((u) => ({ ...u, [activeTab.id]: stack.slice(0, -1) }));
    setRedoStacks((r) => ({ ...r, [activeTab.id]: [...(r[activeTab.id] || []), activeTab.content] }));
    onUpdateTabContent(activeTab.id, prev);
  };

  const handleRedo = () => {
    if (!activeTab) return;
    const stack = redoStacks[activeTab.id] || [];
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    setRedoStacks((r) => ({ ...r, [activeTab.id]: stack.slice(0, -1) }));
    setUndoStacks((u) => ({ ...u, [activeTab.id]: [...(u[activeTab.id] || []), activeTab.content] }));
    onUpdateTabContent(activeTab.id, next);
  };

  const updateCursorLine = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart || 0;
    const lineNum = textareaRef.current.value.slice(0, pos).split('\n').length;
    setCursorLine(lineNum);
  };

  const insertSymbol = (sym: string) => {
    if (!activeTab || !textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = activeTab.content;
    const next = val.slice(0, start) + sym + val.slice(end);
    applyEdit(next, start + sym.length);
    el.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeTab) return;
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = activeTab.content;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onSaveTab(activeTab.id);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowFind((v) => !v);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      setShowGoToLine(true);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (autocompleteList.length > 0) {
        applyAutocomplete(autocompleteList[0]);
        return;
      }
      const spaces = ' '.repeat(settings.tabSize);
      applyEdit(val.slice(0, start) + spaces + val.slice(end), start + spaces.length);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter' && settings.autoIndent) {
      e.preventDefault();
      const before = val.slice(0, start);
      const currentLineText = before.split('\n').pop() || '';
      const leadingSpaces = currentLineText.match(/^(\s*)/)?.[1] || '';
      const extraIndent = currentLineText.trimEnd().endsWith(':') ? ' '.repeat(settings.tabSize) : '';
      const insertText = '\n' + leadingSpaces + extraIndent;
      applyEdit(val.slice(0, start) + insertText + val.slice(end), start + insertText.length);
      setAutocompleteList([]);
      return;
    }

    // Auto-close brackets & quotes
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const close = pairs[e.key];
      applyEdit(val.slice(0, start) + e.key + close + val.slice(end), start + 1);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeTab) return;
    const val = e.target.value;
    pushUndo(activeTab.id, activeTab.content);
    onUpdateTabContent(activeTab.id, val);
    updateCursorLine();

    if (settings.autoComplete) {
      const pos = e.target.selectionStart;
      const before = val.slice(0, pos);
      const wordMatch = before.match(/([A-Za-z_][A-Za-z0-9_]{1,})$/);
      if (wordMatch) {
        const prefix = wordMatch[1];
        const matches = PYTHON_AUTOCOMPLETE_WORDS.filter(
          (w) => w.startsWith(prefix) && w !== prefix
        ).slice(0, 6);
        setAutocompleteList(matches);
      } else {
        setAutocompleteList([]);
      }
    }
  };

  const applyAutocomplete = (word: string) => {
    if (!activeTab || !textareaRef.current) return;
    const el = textareaRef.current;
    const pos = el.selectionStart;
    const before = activeTab.content.slice(0, pos);
    const match = before.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    if (!match) return;
    const startIdx = pos - match[1].length;
    const next = activeTab.content.slice(0, startIdx) + word + activeTab.content.slice(pos);
    applyEdit(next, startIdx + word.length);
    setAutocompleteList([]);
  };

  const jumpToLine = (lineNum: number) => {
    if (!activeTab || !textareaRef.current) return;
    const allLines = activeTab.content.split('\n');
    const clamped = Math.max(1, Math.min(lineNum, allLines.length));
    let charOffset = 0;
    for (let i = 0; i < clamped - 1; i++) {
      charOffset += allLines[i].length + 1;
    }
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset + (allLines[clamped - 1]?.length || 0));
    setCursorLine(clamped);
    const approxTop = (clamped - 3) * (settings.editorFontSize * 1.6);
    textareaRef.current.scrollTop = Math.max(0, approxTop);
    syncScroll();
  };

  const handleFindNext = () => {
    if (!findQuery || !activeTab || !textareaRef.current) return;
    const el = textareaRef.current;
    const from = el.selectionEnd;
    let idx = activeTab.content.indexOf(findQuery, from);
    if (idx === -1) idx = activeTab.content.indexOf(findQuery, 0);
    if (idx !== -1) {
      el.focus();
      el.setSelectionRange(idx, idx + findQuery.length);
      updateCursorLine();
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery || !activeTab) return;
    const updated = activeTab.content.split(findQuery).join(replaceQuery);
    applyEdit(updated);
  };

  const toggleFoldAtLine = (lineNum: number) => {
    setFoldedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Determine foldable lines (def / class / if / for / while ending with :)
  const foldableLines = useMemo(() => {
    const set = new Set<number>();
    lines.forEach((l, idx) => {
      if (/^\s*(def|class|if|elif|else|for|while|try|with)\b.*:\s*(#.*)?$/.test(l)) {
        set.add(idx + 1);
      }
    });
    return set;
  }, [lines]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen bg-[#0B0D14] text-slate-100 overflow-hidden">
      {/* Top IDE Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#23283B] bg-[#121521]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              showSidebar
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                : 'border-[#2A3046] text-slate-300 hover:bg-[#191D2D]'
            }`}
            title="Toggle Project Files"
          >
            <FolderTree className="w-4 h-4" />
          </button>

          <button
            onClick={onNewFile}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2A3046] hover:bg-[#191D2D] text-xs font-medium text-slate-200 whitespace-nowrap"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-400" />
            <span>New File</span>
          </button>

          <button
            onClick={() => activeTab && onSaveTab(activeTab.id)}
            disabled={!activeTab || !activeTab.dirty}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2A3046] hover:bg-[#191D2D] text-xs font-medium text-slate-200 disabled:opacity-40 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save</span>
          </button>

          <button
            onClick={handleUndo}
            disabled={!activeTab || !(undoStacks[activeTab.id]?.length > 0)}
            className="p-1.5 rounded-lg border border-[#2A3046] hover:bg-[#191D2D] text-slate-300 disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!activeTab || !(redoStacks[activeTab.id]?.length > 0)}
            className="p-1.5 rounded-lg border border-[#2A3046] hover:bg-[#191D2D] text-slate-300 disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowFind((v) => !v)}
            className={`p-1.5 rounded-lg border ${
              showFind ? 'border-violet-500 text-violet-300' : 'border-[#2A3046] text-slate-300 hover:bg-[#191D2D]'
            }`}
            title="Find & Replace"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowGoToLine((v) => !v)}
            className="p-1.5 rounded-lg border border-[#2A3046] hover:bg-[#191D2D] text-slate-300"
            title="Go To Line"
          >
            <Hash className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })}
            className={`p-1.5 rounded-lg border ${
              settings.wordWrap ? 'border-violet-500 text-violet-300' : 'border-[#2A3046] text-slate-300 hover:bg-[#191D2D]'
            }`}
            title="Toggle Word Wrap"
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStartDebug}
            disabled={!activeTab}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-xs font-semibold disabled:opacity-40 whitespace-nowrap"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Debug</span>
          </button>

          <button
            onClick={onRunActive}
            disabled={!activeTab}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-40 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Find / Replace & GoToLine Bars */}
      {showFind && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#23283B] bg-[#161A29] text-xs">
          <input
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find..."
            className="px-2.5 py-1 rounded border border-[#2A3046] bg-[#0B0D14] text-white focus:outline-none focus:border-violet-500"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with..."
            className="px-2.5 py-1 rounded border border-[#2A3046] bg-[#0B0D14] text-white focus:outline-none focus:border-violet-500"
          />
          <button onClick={handleFindNext} className="px-2.5 py-1 rounded bg-violet-600 text-white">
            Find Next
          </button>
          <button onClick={handleReplaceAll} className="px-2.5 py-1 rounded border border-[#2A3046] text-slate-200">
            Replace All
          </button>
          <button onClick={() => setShowFind(false)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showGoToLine && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(goToLineVal, 10);
            if (!isNaN(n)) jumpToLine(n);
            setShowGoToLine(false);
          }}
          className="flex items-center gap-2 px-3 py-2 border-b border-[#23283B] bg-[#161A29] text-xs"
        >
          <span className="text-slate-300">Go to line (1–{lines.length}):</span>
          <input
            type="number"
            min={1}
            max={lines.length}
            value={goToLineVal}
            onChange={(e) => setGoToLineVal(e.target.value)}
            className="w-24 px-2 py-1 rounded border border-[#2A3046] bg-[#0B0D14] text-white font-mono"
            autoFocus
          />
          <button type="submit" className="px-2.5 py-1 rounded bg-violet-600 text-white">
            Jump
          </button>
          <button type="button" onClick={() => setShowGoToLine(false)} className="text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Main Split Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Project File Drawer */}
        {showSidebar && (
          <div className="w-56 shrink-0 border-r border-[#23283B] bg-[#121521] flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-[#23283B] text-xs font-semibold text-slate-300 truncate">
              {project ? project.name : 'Workspace'}
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 text-xs">
              {project ? (
                <MiniTree
                  nodes={fileTree}
                  projectId={project.id}
                  activePath={activeTab?.path || ''}
                  onOpenFile={onOpenFile}
                />
              ) : (
                <div className="p-2 text-slate-500">Select or create a project.</div>
              )}
            </div>
          </div>
        )}

        {/* Editor Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Open Tabs Bar */}
          <div className="flex items-center gap-1 px-2 pt-1.5 border-b border-[#23283B] bg-[#121521] overflow-x-auto">
            {tabs.map((tab) => {
              const isAct = activeTab?.id === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer border-t border-x transition-colors whitespace-nowrap shrink-0 ${
                    isAct
                      ? 'bg-[#0B0D14] border-[#23283B] text-white'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#191D2D]'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>{tab.name}</span>
                  {tab.dirty && <span className="text-amber-400 font-bold">*</span>}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Code Surface */}
          {activeTab ? (
            <div className="relative flex-1 flex min-h-0 overflow-hidden bg-[#0B0D14]">
              {/* Line Numbers & Breakpoint Gutter */}
              {settings.lineNumbers && (
                <div
                  ref={gutterRef}
                  style={{
                    fontSize: `${settings.editorFontSize}px`,
                    lineHeight: 1.6,
                  }}
                  className="w-14 shrink-0 bg-[#0E111B] border-r border-[#23283B] py-3 select-none overflow-hidden font-mono text-right pr-2 text-slate-500"
                >
                  {lines.map((_, idx) => {
                    const lineNum = idx + 1;
                    const hasBp = activeBreakpoints.includes(lineNum);
                    const isDebugCurrent = debugState.currentLine === lineNum && debugState.status === 'paused';
                    const isErrorLine = consoleState.errorLine === lineNum && consoleState.status === 'error';
                    const canFold = foldableLines.has(lineNum);
                    const isFolded = foldedBlocks.has(lineNum);
                    return (
                      <div
                        key={lineNum}
                        onClick={() => onToggleBreakpoint(tabKey, lineNum)}
                        className={`flex items-center justify-end gap-1 cursor-pointer hover:text-white tabular-nums ${
                          isDebugCurrent
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : isErrorLine
                            ? 'bg-red-500/20 text-red-400 font-bold'
                            : cursorLine === lineNum
                            ? 'text-slate-200'
                            : ''
                        }`}
                        title="Click to toggle breakpoint"
                      >
                        {hasBp && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                        {canFold && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFoldAtLine(lineNum);
                            }}
                            className="text-[10px] text-slate-500 hover:text-violet-400"
                          >
                            {isFolded ? '+' : '−'}
                          </button>
                        )}
                        <span>{lineNum}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Syntax Highlight Overlay + Transparent Textarea */}
              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={highlightRef}
                  aria-hidden="true"
                  style={{
                    fontSize: `${settings.editorFontSize}px`,
                    fontFamily: settings.editorFontFamily,
                    lineHeight: 1.6,
                    fontVariantLigatures: 'none',
                  }}
                  className={`absolute inset-0 p-3 pointer-events-none overflow-hidden font-mono ${
                    settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                  }`}
                >
                  {lines.map((lineText, idx) => {
                    const lineNum = idx + 1;
                    const isCurrent = cursorLine === lineNum;
                    const isDebugPaused = debugState.currentLine === lineNum && debugState.status === 'paused';
                    return (
                      <div
                        key={lineNum}
                        className={`${
                          isDebugPaused
                            ? 'bg-amber-500/15'
                            : isCurrent
                            ? 'bg-white/[0.03]'
                            : ''
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: highlightCodeLine(lineText, activeTab.name, settings.syntaxHighlighting),
                        }}
                      />
                    );
                  })}
                </div>

                <textarea
                  ref={textareaRef}
                  value={activeTab.content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  onScroll={syncScroll}
                  onClick={updateCursorLine}
                  onKeyUp={updateCursorLine}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  style={{
                    fontSize: `${settings.editorFontSize}px`,
                    fontFamily: settings.editorFontFamily,
                    lineHeight: 1.6,
                    fontVariantLigatures: 'none',
                  }}
                  className={`code-input relative w-full h-full p-3 bg-transparent text-transparent caret-violet-400 resize-none focus:outline-none overflow-auto ${
                    settings.wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                  }`}
                />

                {/* Autocomplete Floating Menu */}
                {autocompleteList.length > 0 && (
                  <div className="absolute bottom-3 left-3 z-20 w-64 rounded-lg border border-[#2A3046] bg-[#161A29] shadow-xl overflow-hidden text-xs font-mono">
                    <div className="px-2.5 py-1 bg-[#121521] text-[10px] text-slate-400 border-b border-[#23283B]">
                      Autocomplete (Tab to insert)
                    </div>
                    {autocompleteList.map((word) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => applyAutocomplete(word)}
                        className="w-full text-left px-3 py-1.5 hover:bg-violet-600/20 text-slate-200 flex items-center justify-between"
                      >
                        <span>{word}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
              <p className="text-sm">No file open. Select a file from the left tree or create a new Python file.</p>
              <button
                onClick={onNewFile}
                className="mt-3 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold"
              >
                New Python File
              </button>
            </div>
          )}

          {/* Mobile / Quick Programming Symbols Bar */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[#23283B] bg-[#121521] overflow-x-auto">
            {SYMBOL_KEYS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="px-2.5 py-1 rounded bg-[#0B0D14] border border-[#2A3046] hover:border-violet-500/50 text-xs font-mono text-slate-200 shrink-0"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Bottom Split Pane Switcher */}
          <div className="flex items-center justify-between px-3 py-1 border-t border-[#23283B] bg-[#121521] text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBottomMode(bottomMode === 'console' ? 'none' : 'console')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium ${
                  bottomMode === 'console' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <PanelBottom className="w-3.5 h-3.5" />
                <span>Console</span>
              </button>
              <button
                onClick={() => setBottomMode(bottomMode === 'terminal' ? 'none' : 'terminal')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium ${
                  bottomMode === 'terminal' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Terminal</span>
              </button>
              <button
                onClick={() => setBottomMode(bottomMode === 'debugger' ? 'none' : 'debugger')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium ${
                  bottomMode === 'debugger' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Debugger</span>
              </button>
            </div>

            {bottomMode !== 'none' && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Ln {cursorLine} · Tab {settings.tabSize} · UTF-8</span>
                <button
                  onClick={() => setBottomHeight((h) => (h === 250 ? 380 : 250))}
                  className="hover:text-white"
                >
                  {bottomHeight === 250 ? 'Expand' : 'Compact'}
                </button>
              </div>
            )}
          </div>

          {bottomMode !== 'none' && (
            <div style={{ height: `${bottomHeight}px` }} className="shrink-0 overflow-hidden">
              {bottomMode === 'console' && (
                <ConsolePanel
                  consoleState={consoleState}
                  onStop={onStopRun}
                  onClear={onClearConsole}
                  onSendInput={onSendStdin}
                  onSaveOutput={onSaveConsoleOutput}
                  onJumpToLine={jumpToLine}
                />
              )}
              {bottomMode === 'terminal' && (
                <TerminalView projectId={project?.id} settings={settings} compact />
              )}
              {bottomMode === 'debugger' && (
                <DebuggerPanel
                  debugState={debugState}
                  breakpoints={activeBreakpoints}
                  onStartDebug={onStartDebug}
                  onCommand={onDebugCommand}
                  onToggleBreakpoint={(ln) => tabKey && onToggleBreakpoint(tabKey, ln)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MiniTreeProps {
  nodes: FileNode[];
  projectId: string;
  activePath: string;
  onOpenFile: (projectId: string, path: string) => void;
  depth?: number;
}

const MiniTree: React.FC<MiniTreeProps> = ({ nodes, projectId, activePath, onOpenFile, depth = 0 }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => {
        if (node.type === 'directory') {
          const isOpen = expanded[node.path] ?? true;
          return (
            <div key={node.path}>
              <button
                onClick={() => setExpanded((p) => ({ ...p, [node.path]: !isOpen }))}
                style={{ paddingLeft: `${depth * 12 + 6}px` }}
                className="w-full flex items-center gap-1.5 py-1 pr-2 rounded hover:bg-[#191D2D] text-slate-300 text-left"
              >
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate font-medium">{node.name}</span>
              </button>
              {isOpen && node.children && (
                <MiniTree
                  nodes={node.children}
                  projectId={projectId}
                  activePath={activePath}
                  onOpenFile={onOpenFile}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }
        const active = activePath === node.path;
        return (
          <button
            key={node.path}
            onClick={() => onOpenFile(projectId, node.path)}
            style={{ paddingLeft: `${depth * 12 + 20}px` }}
            className={`w-full flex items-center gap-1.5 py-1 pr-2 rounded text-left font-mono truncate ${
              active ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:bg-[#191D2D] hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
        );
      })}
    </div>
  );
};
