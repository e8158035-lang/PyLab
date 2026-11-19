import React, { useState } from 'react';
import { BookOpen, Play, FolderPlus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { EXAMPLES_LIBRARY } from '../data/examplesLibrary';
import { api } from '../services/api';
import type { ExampleItem, ProjectMeta } from '../types/pylab';

interface ExamplesLibraryViewProps {
  onCreateFromExample: (example: ExampleItem) => Promise<ProjectMeta>;
}

export const ExamplesLibraryView: React.FC<ExamplesLibraryViewProps> = ({ onCreateFromExample }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<ExampleItem>(EXAMPLES_LIBRARY[0]);
  const [runResult, setRunResult] = useState<{ stdout: string; stderr: string; durationMs: number } | null>(null);
  const [running, setRunning] = useState(false);

  const categories = ['All', ...Array.from(new Set(EXAMPLES_LIBRARY.map((e) => e.category)))];

  const filtered = EXAMPLES_LIBRARY.filter((ex) => {
    const matchesCat = category === 'All' || ex.category === category;
    const matchesSearch =
      ex.title.toLowerCase().includes(search.toLowerCase()) ||
      ex.titleAr.includes(search) ||
      ex.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRunExample = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const mainCode = selected.files[selected.mainFile] || '';
      const res = await api.execInline({ code: mainCode });
      setRunResult({ stdout: res.stdout, stderr: res.stderr, durationMs: res.durationMs });
    } catch (err: unknown) {
      setRunResult({ stdout: '', stderr: err instanceof Error ? err.message : String(err), durationMs: 0 });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Offline Examples Library ({EXAMPLES_LIBRARY.length} Examples)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse, run directly in Python 3.11, or clone into a full project workspace.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search examples..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-white dark:bg-[#121521] text-xs"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              category === cat
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-[#121521] border border-slate-200 dark:border-[#23283B] text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Examples List */}
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] divide-y divide-slate-100 dark:divide-[#1E2336] max-h-[650px] overflow-auto">
          {filtered.map((ex) => {
            const active = selected.id === ex.id;
            return (
              <button
                key={ex.id}
                onClick={() => {
                  setSelected(ex);
                  setRunResult(null);
                }}
                className={`w-full p-3.5 text-left transition-colors ${
                  active ? 'bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#191D2D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{ex.title}</span>
                  <span className="text-[11px] text-slate-500">{ex.category}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ex.titleAr}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Example Detail */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <span>
                  {selected.title} · {selected.titleAr}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{selected.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {Object.keys(selected.files).length === 1 && (
                <button
                  onClick={handleRunExample}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{running ? 'Running...' : 'Run Now'}</span>
                </button>
              )}
              <button
                onClick={() => onCreateFromExample(selected)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] hover:bg-slate-50 dark:hover:bg-[#191D2D] text-xs font-semibold text-slate-800 dark:text-white"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                <span>Open as Project</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Instructions: {selected.runInstructions}
            {selected.requirements.length > 0 && ` · Requires: ${selected.requirements.join(', ')}`}
          </div>

          <div className="space-y-3">
            {Object.entries(selected.files).map(([fname, code]) => (
              <div key={fname} className="rounded-lg border border-[#23283B] bg-[#090B11] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#121521] border-b border-[#23283B] text-[11px] font-mono text-slate-300">
                  {fname}
                </div>
                <pre className="p-3 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed">{code}</pre>
              </div>
            ))}
          </div>

          {runResult && (
            <div className="rounded-lg border border-[#23283B] bg-[#090B11] p-3 font-mono text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                {runResult.stderr ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Output ({runResult.durationMs} ms)</span>
              </div>
              {runResult.stdout && <pre className="text-emerald-300 whitespace-pre-wrap">{runResult.stdout}</pre>}
              {runResult.stderr && <pre className="text-red-400 whitespace-pre-wrap">{runResult.stderr}</pre>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
