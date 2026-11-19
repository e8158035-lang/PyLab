import React from 'react';
import {
  Bug,
  Play,
  Pause,
  Square,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
} from 'lucide-react';
import type { DebugState } from '../types/pylab';

interface DebuggerPanelProps {
  debugState: DebugState;
  breakpoints: number[];
  onStartDebug: () => void;
  onCommand: (action: 'continue' | 'step_into' | 'step_over' | 'step_out' | 'pause' | 'stop') => void;
  onToggleBreakpoint: (line: number) => void;
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({
  debugState,
  breakpoints,
  onStartDebug,
  onCommand,
  onToggleBreakpoint,
}) => {
  const isActive = debugState.status === 'running' || debugState.status === 'paused';

  return (
    <div className="flex flex-col h-full bg-[#090B11] text-slate-200 border-t border-[#23283B]">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#23283B] bg-[#121521] text-xs">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-white">Python Debugger (bdb)</span>
          <span className="text-slate-400">
            · {debugState.status.toUpperCase()}
            {debugState.currentLine ? ` · Line ${debugState.currentLine}` : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!isActive ? (
            <button
              onClick={onStartDebug}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-medium whitespace-nowrap"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Start Debugging</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onCommand('continue')}
                disabled={debugState.status !== 'paused'}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 whitespace-nowrap"
              >
                <Play className="w-3 h-3" />
                <span>Continue</span>
              </button>
              <button
                onClick={() => onCommand('step_over')}
                disabled={debugState.status !== 'paused'}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] hover:bg-[#191D2D] disabled:opacity-40 whitespace-nowrap"
              >
                <ArrowRight className="w-3 h-3" />
                <span>Step Over</span>
              </button>
              <button
                onClick={() => onCommand('step_into')}
                disabled={debugState.status !== 'paused'}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] hover:bg-[#191D2D] disabled:opacity-40 whitespace-nowrap"
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>Step Into</span>
              </button>
              <button
                onClick={() => onCommand('step_out')}
                disabled={debugState.status !== 'paused'}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] hover:bg-[#191D2D] disabled:opacity-40 whitespace-nowrap"
              >
                <ArrowUpFromLine className="w-3 h-3" />
                <span>Step Out</span>
              </button>
              <button
                onClick={() => onCommand('pause')}
                disabled={debugState.status !== 'running'}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#2A3046] hover:bg-[#191D2D] disabled:opacity-40 whitespace-nowrap"
              >
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </button>
              <button
                onClick={() => onCommand('stop')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Inspector */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#23283B] overflow-auto text-xs">
        {/* Variables */}
        <div className="p-3 overflow-auto">
          <div className="font-semibold text-slate-300 mb-2">Variables (Locals & Globals)</div>
          {debugState.locals.length === 0 && debugState.globals.length === 0 ? (
            <div className="text-slate-500">
              Click line numbers in the editor gutter to toggle breakpoints, then press Start Debugging.
            </div>
          ) : (
            <div className="space-y-1 font-mono">
              {debugState.locals.map((v) => (
                <div key={`l-${v.name}`} className="flex items-start justify-between gap-2 py-0.5 border-b border-[#1A1E2E]">
                  <span className="text-sky-300 shrink-0">{v.name}</span>
                  <span className="text-slate-500 shrink-0">{v.type}</span>
                  <span className="text-emerald-300 truncate text-right">{v.value}</span>
                </div>
              ))}
              {debugState.globals.map((v) => (
                <div key={`g-${v.name}`} className="flex items-start justify-between gap-2 py-0.5 border-b border-[#1A1E2E] opacity-80">
                  <span className="text-violet-300 shrink-0">{v.name}</span>
                  <span className="text-slate-500 shrink-0">{v.type}</span>
                  <span className="text-slate-300 truncate text-right">{v.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call Stack */}
        <div className="p-3 overflow-auto">
          <div className="font-semibold text-slate-300 mb-2">Call Stack</div>
          {debugState.stack.length === 0 ? (
            <div className="text-slate-500">No active stack frames.</div>
          ) : (
            <div className="space-y-1.5 font-mono">
              {debugState.stack.map((fr, idx) => (
                <div key={idx} className="p-1.5 rounded bg-[#121521] border border-[#23283B]">
                  <div className="text-white">{fr.function}()</div>
                  <div className="text-slate-400 text-[11px]">
                    {fr.file} · line {fr.line}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakpoints & Debug Output */}
        <div className="p-3 overflow-auto space-y-3">
          <div>
            <div className="font-semibold text-slate-300 mb-1.5">
              Breakpoints ({breakpoints.length})
            </div>
            {breakpoints.length === 0 ? (
              <div className="text-slate-500">Defaults to line 1 if none set.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {breakpoints.map((ln) => (
                  <button
                    key={ln}
                    onClick={() => onToggleBreakpoint(ln)}
                    className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 font-mono"
                    title="Click to remove breakpoint"
                  >
                    Line {ln} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {debugState.exceptionText && (
            <div className="p-2 rounded bg-red-950/50 border border-red-500/40 text-red-300 font-mono whitespace-pre-wrap">
              {debugState.exceptionText}
            </div>
          )}

          {debugState.output && (
            <div>
              <div className="font-semibold text-slate-300 mb-1">Debug Output</div>
              <pre className="font-mono text-slate-200 whitespace-pre-wrap">{debugState.output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
