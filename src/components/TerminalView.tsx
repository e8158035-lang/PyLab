import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, Copy, CornerDownLeft } from 'lucide-react';
import { api } from '../services/api';
import type { AppSettings } from '../types/pylab';

interface TerminalEntry {
  id: string;
  cwd: string;
  command?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

interface TerminalViewProps {
  projectId?: string;
  settings: AppSettings;
  compact?: boolean;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ projectId, settings, compact = false }) => {
  const [sessionId] = useState(() => `term_${Date.now()}`);
  const [cwd, setCwd] = useState('~/projects');
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: 'welcome',
      cwd: '~/projects',
      stdout:
        'PyLab Studio Terminal — Connected to local Python 3.11 & pip.\nType "help" for available commands (python, pip, ls, cd, cat, mkdir, rm, clear).',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const runCmd = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    setHistory((prev) => [cmd, ...prev.slice(0, 99)]);
    setHistoryIdx(-1);
    setInput('');
    setRunning(true);

    try {
      const res = await api.execTerminal(sessionId, cmd, projectId);
      setCwd(res.displayCwd || cwd);
      if (res.clear) {
        setEntries([]);
      } else {
        setEntries((prev) => [
          ...prev,
          {
            id: `${Date.now()}_${Math.random()}`,
            cwd: res.displayCwd || cwd,
            command: cmd,
            stdout: res.stdout,
            stderr: res.stderr,
            exitCode: res.exitCode,
          },
        ]);
      }
    } catch (err: unknown) {
      setEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          cwd,
          command: cmd,
          stderr: err instanceof Error ? err.message : String(err),
          exitCode: 1,
        },
      ]);
    } finally {
      setRunning(false);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cmds = ['python ', 'pip install ', 'pip list', 'pip freeze', 'pip check', 'ls', 'cd ', 'cat ', 'mkdir ', 'clear', 'help'];
      const match = cmds.find((c) => c.startsWith(input));
      if (match) setInput(match);
    }
  };

  const copyAll = () => {
    const text = entries
      .map((en) => `${en.command ? `${en.cwd} $ ${en.command}\n` : ''}${en.stdout || ''}${en.stderr ? '\n' + en.stderr : ''}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
  };

  const bgClass =
    settings.terminalTheme === 'matrix'
      ? 'bg-black text-emerald-300'
      : settings.terminalTheme === 'slate'
      ? 'bg-slate-900 text-slate-100'
      : 'bg-[#090B11] text-slate-200';

  const quickChips = ['python --version', 'ls', 'pip list', 'help'];

  return (
    <div className={`flex flex-col h-full ${bgClass} ${compact ? '' : 'pb-16 lg:pb-0'}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#23283B] bg-[#121521] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <TerminalIcon className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="font-semibold text-white whitespace-nowrap">Terminal</span>
          <span className="font-mono text-slate-400 truncate">{cwd}</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => runCmd(chip)}
              className="px-2 py-1 rounded border border-[#2A3046] bg-[#0B0D14] text-slate-300 hover:text-white hover:border-violet-500/50 font-mono text-[11px] whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:bg-[#191D2D] whitespace-nowrap"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
          <button
            type="button"
            onClick={() => setEntries([])}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:bg-[#191D2D] whitespace-nowrap"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Output Stream */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        style={{ fontSize: `${settings.terminalFontSize}px` }}
        className="flex-1 overflow-auto p-3 font-mono leading-relaxed space-y-2 cursor-text"
      >
        {entries.map((en) => (
          <div key={en.id} className="space-y-0.5">
            {en.command && (
              <div className="flex items-center gap-2 text-violet-400">
                <span className="text-blue-400">{en.cwd}</span>
                <span>$</span>
                <span className="text-white">{en.command}</span>
              </div>
            )}
            {en.stdout && <pre className="whitespace-pre-wrap break-words text-slate-100">{en.stdout}</pre>}
            {en.stderr && <pre className="whitespace-pre-wrap break-words text-red-400">{en.stderr}</pre>}
          </div>
        ))}
      </div>

      {/* Command Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCmd(input);
        }}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-[#23283B] bg-[#121521]"
      >
        <span className="font-mono text-xs text-blue-400 shrink-0">{cwd} $</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={running}
          placeholder={running ? 'Executing...' : 'Enter python, pip, or file command (Tab to complete)...'}
          className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-slate-500 focus:outline-none"
          autoFocus={!compact}
        />
        <button
          type="submit"
          disabled={running || !input.trim()}
          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium disabled:opacity-40 whitespace-nowrap"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};
