import React from 'react';
import {
  FolderPlus,
  FilePlus,
  Code2,
  Terminal,
  Package,
  FolderTree,
  BookOpen,
  GraduationCap,
  Play,
  HardDrive,
  Clock,
} from 'lucide-react';
import type {
  AppView,
  EditorTab,
  ExecutionHistoryItem,
  ProjectMeta,
  RuntimeInfo,
} from '../types/pylab';

interface DashboardViewProps {
  runtimeInfo: RuntimeInfo | null;
  projects: ProjectMeta[];
  activeProject: ProjectMeta | null;
  openTabs: EditorTab[];
  recentFiles: Array<{ projectId: string; path: string; name: string }>;
  storageBytes: number;
  history: ExecutionHistoryItem[];
  onNavigate: (view: AppView) => void;
  onNewProject: () => void;
  onNewPythonFile: () => void;
  onOpenProject: (project: ProjectMeta) => void;
  onOpenFile: (projectId: string, path: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  runtimeInfo,
  projects,
  activeProject,
  openTabs,
  recentFiles,
  storageBytes,
  history,
  onNavigate,
  onNewProject,
  onNewPythonFile,
  onOpenProject,
  onOpenFile,
}) => {
  const quickActions = [
    { label: 'New Project', icon: FolderPlus, onClick: onNewProject, primary: true },
    { label: 'New Python File', icon: FilePlus, onClick: onNewPythonFile },
    { label: 'Code Editor', icon: Code2, onClick: () => onNavigate('editor') },
    { label: 'Terminal', icon: Terminal, onClick: () => onNavigate('terminal') },
    { label: 'Package Manager', icon: Package, onClick: () => onNavigate('packages') },
    { label: 'File Explorer', icon: FolderTree, onClick: () => onNavigate('explorer') },
    { label: 'Examples', icon: BookOpen, onClick: () => onNavigate('examples') },
    { label: 'Learning Center', icon: GraduationCap, onClick: () => onNavigate('learning') },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-24 lg:pb-10">
      {/* Hero Summary Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23283B] pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            PyLab Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Python {runtimeInfo?.pythonVersion || '3.11'} · Local Interpreter Ready ·{' '}
            {activeProject ? `Active: ${activeProject.name}` : 'No active project'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNewProject}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => onNavigate('editor')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-white dark:bg-[#121521] hover:bg-slate-50 dark:hover:bg-[#191D2D] text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Code2 className="w-4 h-4 text-violet-500" />
            <span>Open Editor</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Python Runtime</div>
          <div className="mt-1 text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
            {runtimeInfo ? `v${runtimeInfo.pythonVersion}` : 'Checking...'}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            Local Interpreter Active
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Projects</div>
          <div className="mt-1 text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
            {projects.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Stored persistently
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521]">
          <div className="text-xs text-slate-500 dark:text-slate-400">Open Editor Tabs</div>
          <div className="mt-1 text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
            {openTabs.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Auto-restored on launch
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521]">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Workspace Storage</span>
          </div>
          <div className="mt-1 text-xl font-display font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatBytes(storageBytes)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Projects & pip packages
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-3">
          Workspace Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                onClick={act.onClick}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] hover:border-violet-500/60 hover:bg-slate-50 dark:hover:bg-[#191D2D] text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Projects & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Recent Projects
            </h2>
            <button
              onClick={() => onNavigate('explorer')}
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              Manage All
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects yet. Create one to start coding.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1E2336]">
              {projects.slice(0, 6).map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => onOpenProject(proj)}
                  className="w-full py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#191D2D] px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {proj.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {proj.mainFile} · {proj.fileCount} files · {formatBytes(proj.sizeBytes)}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400 shrink-0">
                    Open
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Files & Execution History */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-3">
              Recent Files
            </h2>
            {recentFiles.length === 0 ? (
              <p className="text-sm text-slate-500">Open a file from any project to see it here.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1E2336]">
                {recentFiles.slice(0, 5).map((rf) => (
                  <button
                    key={`${rf.projectId}:${rf.path}`}
                    onClick={() => onOpenFile(rf.projectId, rf.path)}
                    className="w-full py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#191D2D] px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-mono text-slate-800 dark:text-slate-200 truncate">
                      {rf.path}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">{rf.projectId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Recent Executions</span>
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Run a Python file to record execution metrics.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1E2336]">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-3">
                      <div className="font-mono text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.file_path}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5 tabular-nums">
                        {item.project_id} · {item.duration_ms} ms
                      </div>
                    </div>
                    <span
                      className={`font-medium shrink-0 ${
                        item.status === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.status === 'stopped'
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                    >
                      {item.status === 'success' ? 'Exit 0' : `Exit ${item.exit_code}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
