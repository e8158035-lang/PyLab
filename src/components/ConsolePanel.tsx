import React, { useState } from 'react';
import {
  Square,
  Trash2,
  Copy,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { ConsoleOutputState } from '../types/pylab';

interface ConsolePanelProps {
  consoleState: ConsoleOutputState;
  onStop: () => void;
  onClear: () => void;
  onSendInput: (input: string) => void;
  onSaveOutput: (text: string) => void;
  onJumpToLine?: (line: number) => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  consoleState,
  onStop,
  onClear,
  onSendInput,
  onSaveOutput,
  onJumpToLine,
}) => {
  const [stdinText, setStdinText] = useState('');
  const [showFullTraceback, setShowFullTraceback] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const full = `${consoleState.stdout}${consoleState.stderr ? '\n' + consoleState.stderr : ''}`;
    navigator.clipboard?.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendInput(stdinText);
    setStdinText('');
  };

  const stderrLines = consoleState.stderr ? consoleState.stderr.split('\n') : [];
  const displayedStderr = showFullTraceback
    ? consoleState.stderr
    : stderrLines.slice(-2).join('\n');

  return (
    <div className="flex flex-col h-full bg-[#090B11] text-slate-200 border-t border-[#23283B]">
      {/* Console Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#23283B] bg-[#121521] text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-white whitespace-nowrap">Execution Console</span>
          <span className="text-slate-400 truncate font-mono">{consoleState.filePath || 'Ready'}</span>
          {consoleState.status === 'running' && (
            <span className="text-blue-400 font-medium whitespace-nowrap">Running...</span>
          )}
          {consoleState.status === 'success' && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Exit 0 · {consoleState.durationMs ?? 0}ms
            </span>
          )}
          {consoleState.status === 'error' && (
            <span className="inline-flex items-center gap-1 text-red-400 font-medium whitespace-nowrap">
              <XCircle className="w-3.5 h-3.5" />
              Exit {consoleState.exitCode ?? 1} · {consoleState.durationMs ?? 0}ms
            </span>
          )}
          {consoleState.status === 'stopped' && (
            <span className="inline-flex items-center gap-1 text-amber-400 font-medium whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5" />
              Stopped
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {consoleState.status === 'running' && (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium whitespace-nowrap"
            >
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </button>
          )}
          {consoleState.stderr && (
            <button
              onClick={() => setShowFullTraceback((v) => !v)}
              className="px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:bg-[#191D2D] whitespace-nowrap"
            >
              {showFullTraceback ? 'Compact Error' : 'Full Traceback'}
            </button>
          )}
          {consoleState.errorLine && onJumpToLine && (
            <button
              onClick={() => onJumpToLine(consoleState.errorLine!)}
              className="px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 whitespace-nowrap"
            >
              Go to Line {consoleState.errorLine}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:bg-[#191D2D] whitespace-nowrap"
            title="Copy Output"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => onSaveOutput(`${consoleState.stdout}\n${consoleState.stderr}`.trim())}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:bg-[#191D2D] whitespace-nowrap"
            title="Save Output to file"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] text-slate-300 hover:bg-[#191D2D] whitespace-nowrap"
            title="Clear Console"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">
        {consoleState.startedAt && (
          <div className="text-[11px] text-slate-500 mb-2 tabular-nums">
            Started: {new Date(consoleState.startedAt).toLocaleTimeString()}
            {consoleState.endedAt ? ` · Ended: ${new Date(consoleState.endedAt).toLocaleTimeString()}` : ''}
          </div>
        )}
        {!consoleState.stdout && !consoleState.stderr && consoleState.status === 'idle' && (
          <div className="text-slate-500">Click Run to execute Python code locally.</div>
        )}
        {consoleState.stdout && <div className="text-slate-100">{consoleState.stdout}</div>}
        {displayedStderr && <div className="text-red-400 mt-1">{displayedStderr}</div>}
      </div>

      {/* Stdin Bar */}
      <form
        onSubmit={handleStdinSubmit}
        className="flex items-center gap-2 px-3 py-2 border-t border-[#23283B] bg-[#121521]"
      >
        <span className="text-xs font-mono text-violet-400 shrink-0">stdin&gt;</span>
        <input
          type="text"
          value={stdinText}
          onChange={(e) => setStdinText(e.target.value)}
          disabled={consoleState.status !== 'running'}
          placeholder={
            consoleState.status === 'running'
              ? 'Type input for Python input() and press Enter...'
              : 'Interactive input available while script is running'
          }
          className="flex-1 bg-transparent text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={consoleState.status !== 'running'}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium disabled:opacity-40"
        >
          <Send className="w-3 h-3" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
