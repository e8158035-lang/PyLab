import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, XCircle, Play, Plus, Trash2, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import type { RuntimeInfo } from '../types/pylab';

interface RuntimeManagerViewProps {
  runtimeInfo: RuntimeInfo | null;
  onRefreshRuntime: () => Promise<void>;
}

export const RuntimeManagerView: React.FC<RuntimeManagerViewProps> = ({
  runtimeInfo,
  onRefreshRuntime,
}) => {
  const [diagResults, setDiagResults] = useState<{
    ok: boolean;
    pythonVersion: string;
    tests: Array<{ name: string; passed: boolean; output: string; durationMs: number }>;
  } | null>(null);
  const [runningDiag, setRunningDiag] = useState(false);
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  useEffect(() => {
    api.getState<Record<string, string>>('custom_env').then((res) => {
      if (res.value) setCustomEnv(res.value);
    });
  }, []);

  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const res = await api.runDiagnostics();
      setDiagResults(res);
    } finally {
      setRunningDiag(false);
    }
  };

  const handleSaveEnv = async (updated: Record<string, string>) => {
    setCustomEnv(updated);
    await api.setState('custom_env', updated);
    await onRefreshRuntime();
  };

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvKey.trim()) return;
    await handleSaveEnv({ ...customEnv, [newEnvKey.trim()]: newEnvVal });
    setNewEnvKey('');
    setNewEnvVal('');
  };

  const handleResetEnv = async () => {
    await handleSaveEnv({});
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-violet-500" />
            <span>Python Environment Manager</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inspect interpreter paths, environment variables, standard library modules, and run runtime integrity diagnostics.
          </p>
        </div>

        <button
          onClick={handleRunDiagnostics}
          disabled={runningDiag}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{runningDiag ? 'Testing Runtime...' : 'Run 5-Test Runtime Diagnostics'}</span>
        </button>
      </div>

      {/* Diagnostics Results */}
      {diagResults && (
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-900 dark:text-white">
              Python {diagResults.pythonVersion} Integrity Check
            </span>
            <span className={diagResults.ok ? 'text-emerald-500 text-xs font-semibold' : 'text-red-500 text-xs font-semibold'}>
              {diagResults.ok ? 'All 5 Core Runtime Tests Passed' : 'Some tests failed'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {diagResults.tests.map((t) => (
              <div key={t.name} className="p-3 rounded-lg border border-slate-200 dark:border-[#23283B] bg-slate-50 dark:bg-[#0B0D14] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                    <span>{t.name}</span>
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">{t.durationMs} ms</span>
                </div>
                <pre className="font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                  {t.output}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpreter Info & sys.path */}
      {runtimeInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-3 text-xs">
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
              Interpreter Information
            </h2>
            <div className="space-y-2 font-mono">
              <div>
                <span className="text-slate-500">Version: </span>
                <span className="text-slate-900 dark:text-white">{runtimeInfo.pythonVersion}</span>
              </div>
              <div>
                <span className="text-slate-500">Executable: </span>
                <span className="text-slate-900 dark:text-white">{runtimeInfo.executable}</span>
              </div>
              <div>
                <span className="text-slate-500">Platform: </span>
                <span className="text-slate-900 dark:text-white">{runtimeInfo.platform}</span>
              </div>
              <div>
                <span className="text-slate-500">Isolated Packages Dir: </span>
                <span className="text-violet-500 break-all">{runtimeInfo.packagesDir}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1E2336]">
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">sys.path</div>
              <div className="space-y-1 font-mono text-[11px] text-slate-500 break-all">
                {runtimeInfo.sysPath.map((p, idx) => (
                  <div key={idx}>{p || '(cwd)'}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Environment Variables Editor */}
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
                Environment Variables
              </h2>
              <button
                onClick={handleResetEnv}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-500"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Defaults</span>
              </button>
            </div>

            <form onSubmit={handleAddEnv} className="flex gap-2">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="VAR_NAME"
                className="w-36 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs font-mono"
              />
              <input
                type="text"
                value={newEnvVal}
                onChange={(e) => setNewEnvVal(e.target.value)}
                placeholder="Value"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs font-mono"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Set</span>
              </button>
            </form>

            <div className="space-y-1.5 max-h-60 overflow-auto text-xs font-mono">
              {Object.entries(runtimeInfo.envVars).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-[#23283B]"
                >
                  <div className="min-w-0 truncate">
                    <span className="text-violet-500 font-semibold">{k}</span>=
                    <span className="text-slate-600 dark:text-slate-300">{v}</span>
                  </div>
                  {customEnv[k] !== undefined && (
                    <button
                      onClick={() => {
                        const copy = { ...customEnv };
                        delete copy[k];
                        handleSaveEnv(copy);
                      }}
                      className="text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Standard Library Browser */}
      {runtimeInfo && (
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-3">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
            Built-in Python Standard Library Modules ({runtimeInfo.stdlibModules.length}+)
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
            {runtimeInfo.stdlibModules.map((mod) => (
              <span key={mod}>{mod}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
