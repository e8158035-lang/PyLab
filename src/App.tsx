import React, { useEffect, useState, useRef } from 'react';
import { api } from './services/api';
import {
  DEFAULT_LEARNING_PROGRESS,
  DEFAULT_SETTINGS,
  type AppSettings,
  type AppView,
  type ConsoleOutputState,
  type DebugState,
  type EditorTab,
  type ExampleItem,
  type ExecutionHistoryItem,
  type FileNode,
  type LearningProgress,
  type ProjectMeta,
  type RuntimeInfo,
} from './types/pylab';
import { SidebarNav } from './components/SidebarNav';
import { DashboardView } from './components/DashboardView';
import { CodeEditorView } from './components/CodeEditorView';
import { TerminalView } from './components/TerminalView';
import { PackageManagerView } from './components/PackageManagerView';
import { FileExplorerView } from './components/FileExplorerView';
import { WebServerView } from './components/WebServerView';
import { ExamplesLibraryView } from './components/ExamplesLibraryView';
import { LearningCenterView } from './components/LearningCenterView';
import { RuntimeManagerView } from './components/RuntimeManagerView';
import { SettingsView } from './components/SettingsView';
import { NewProjectModal } from './components/NewProjectModal';

function extractErrorLine(stderr: string, filename: string): number | null {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fileMatch = stderr.match(new RegExp(`${escaped}", line (\\d+)`));
  if (fileMatch) return parseInt(fileMatch[1], 10);
  const genericMatches = [...stderr.matchAll(/line (\d+)/g)];
  if (genericMatches.length > 0) {
    return parseInt(genericMatches[genericMatches.length - 1][1], 10);
  }
  return null;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>(DEFAULT_LEARNING_PROGRESS);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectMeta | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<Array<{ projectId: string; path: string; name: string }>>([]);
  const [storageBytes, setStorageBytes] = useState(0);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [breakpoints, setBreakpoints] = useState<Record<string, number[]>>({});
  const [consoleState, setConsoleState] = useState<ConsoleOutputState>({
    runId: null,
    status: 'idle',
    filePath: '',
    startedAt: null,
    endedAt: null,
    durationMs: null,
    exitCode: null,
    stdout: '',
    stderr: '',
    errorLine: null,
  });

  const [debugState, setDebugState] = useState<DebugState>({
    debugId: null,
    status: 'idle',
    currentFile: '',
    currentLine: null,
    currentFunction: '',
    locals: [],
    globals: [],
    stack: [],
    output: '',
    exceptionText: null,
  });

  const runStreamRef = useRef<EventSource | null>(null);
  const dbgStreamRef = useRef<EventSource | null>(null);
  const hydratedRef = useRef(false);

  // Sync dark/light class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const refreshRuntime = async () => {
    try {
      const info = await api.getRuntimeInfo();
      setRuntimeInfo(info);
    } catch {
      // handled gracefully
    }
  };

  const refreshProjects = async () => {
    const res = await api.listProjects();
    setProjects(res.projects);
    const stor = await api.getStorageSummary();
    setStorageBytes(stor.totalBytes);
    return res.projects;
  };

  const refreshTree = async (projId?: string) => {
    const id = projId || activeProject?.id;
    if (!id) return;
    const res = await api.getFileTree(id);
    setFileTree(res.tree);
  };

  const refreshHistory = async () => {
    try {
      const res = await api.getExecutionHistory();
      setHistory(res.items || []);
    } catch {
      // ignore
    }
  };

  const openFileInTab = async (projectId: string, relPath: string) => {
    const tabId = `${projectId}:${relPath}`;
    const existing = tabs.find((t) => t.id === tabId);
    if (existing) {
      setActiveTabId(tabId);
      setActiveView('editor');
      return;
    }
    const res = await api.readFile(projectId, relPath);
    const name = relPath.split('/').pop() || relPath;
    const newTab: EditorTab = {
      id: tabId,
      projectId,
      path: relPath,
      name,
      content: res.content,
      savedContent: res.content,
      dirty: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(tabId);
    setRecentFiles((prev) => [
      { projectId, path: relPath, name },
      ...prev.filter((x) => !(x.projectId === projectId && x.path === relPath)).slice(0, 9),
    ]);
    setActiveView('editor');
  };

  // Initial Hydration from SQLite & Workspace
  useEffect(() => {
    (async () => {
      try {
        const [stSettings, stProgress, stWorkspace, projList] = await Promise.all([
          api.getState<AppSettings>('app_settings'),
          api.getState<LearningProgress>('learning_progress'),
          api.getState<{
            activeProjectId?: string;
            openTabSpecs?: Array<{ projectId: string; path: string }>;
            activeTabId?: string;
            recentFiles?: Array<{ projectId: string; path: string; name: string }>;
          }>('workspace_session'),
          refreshProjects(),
        ]);

        if (stSettings.value) {
          setSettings({ ...DEFAULT_SETTINGS, ...stSettings.value });
        }
        if (stProgress.value) {
          setLearningProgress({ ...DEFAULT_LEARNING_PROGRESS, ...stProgress.value });
        }

        const savedProjId = stWorkspace.value?.activeProjectId;
        const targetProj = projList.find((p) => p.id === savedProjId) || projList[0] || null;
        setActiveProject(targetProj);
        if (targetProj) {
          await refreshTree(targetProj.id);
        }

        if (stWorkspace.value?.recentFiles) {
          setRecentFiles(stWorkspace.value.recentFiles);
        }

        const openSpecs = stWorkspace.value?.openTabSpecs || [];
        const restoredTabs: EditorTab[] = [];
        for (const spec of openSpecs) {
          try {
            const f = await api.readFile(spec.projectId, spec.path);
            restoredTabs.push({
              id: `${spec.projectId}:${spec.path}`,
              projectId: spec.projectId,
              path: spec.path,
              name: spec.path.split('/').pop() || spec.path,
              content: f.content,
              savedContent: f.content,
              dirty: false,
            });
          } catch {
            // file may have been removed
          }
        }
        if (restoredTabs.length === 0 && targetProj) {
          try {
            const f = await api.readFile(targetProj.id, targetProj.mainFile);
            restoredTabs.push({
              id: `${targetProj.id}:${targetProj.mainFile}`,
              projectId: targetProj.id,
              path: targetProj.mainFile,
              name: targetProj.mainFile,
              content: f.content,
              savedContent: f.content,
              dirty: false,
            });
          } catch {
            // ignore
          }
        }

        setTabs(restoredTabs);
        const preferredTab = restoredTabs.find((t) => t.id === stWorkspace.value?.activeTabId) || restoredTabs[0];
        if (preferredTab) setActiveTabId(preferredTab.id);

        await Promise.all([refreshRuntime(), refreshHistory()]);
      } finally {
        hydratedRef.current = true;
      }
    })();
  }, []);

  // Persist workspace tabs & recent files when changed
  useEffect(() => {
    if (!hydratedRef.current) return;
    api
      .setState('workspace_session', {
        activeProjectId: activeProject?.id,
        openTabSpecs: tabs.map((t) => ({ projectId: t.projectId, path: t.path })),
        activeTabId,
        recentFiles,
      })
      .catch(() => {});
  }, [activeProject?.id, tabs.length, activeTabId, recentFiles]);

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      api.setState('app_settings', next).catch(() => {});
      return next;
    });
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    api.setState('app_settings', DEFAULT_SETTINGS).catch(() => {});
  };

  const handleUpdateProgress = (next: LearningProgress) => {
    setLearningProgress(next);
    api.setState('learning_progress', next).catch(() => {});
  };

  const handleSelectProject = async (proj: ProjectMeta) => {
    setActiveProject(proj);
    await refreshTree(proj.id);
    await openFileInTab(proj.id, proj.mainFile);
  };

  const handleCreateProject = async (payload: {
    name: string;
    description: string;
    template: string;
    mainFile: string;
    pythonVersion: string;
    files: Record<string, string>;
  }) => {
    const res = await api.createProject(payload);
    await refreshProjects();
    await handleSelectProject(res.project);
  };

  const handleNewPythonFile = async () => {
    if (!activeProject) {
      setShowNewProjectModal(true);
      return;
    }
    const name = window.prompt('Enter new file name (e.g. script.py):', `script_${Date.now().toString().slice(-4)}.py`);
    if (!name || !name.trim()) return;
    await api.writeFile(activeProject.id, name.trim(), '# New Python File\n\nprint("Hello")\n');
    await refreshTree(activeProject.id);
    await refreshProjects();
    await openFileInTab(activeProject.id, name.trim());
  };

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdateTabContent = (tabId: string, content: string) => {
    const target = tabs.find((t) => t.id === tabId);
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content, dirty: content !== t.savedContent } : t))
    );
    if (settings.autoSave && target) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          await api.writeFile(target.projectId, target.path, content);
          setTabs((prev) =>
            prev.map((t) =>
              t.id === tabId && t.content === content ? { ...t, savedContent: content, dirty: false } : t
            )
          );
        } catch {
          // ignore transient write errors
        }
      }, 500);
    }
  };

  const handleSaveTab = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    await api.writeFile(tab.projectId, tab.path, tab.content);
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, savedContent: t.content, dirty: false } : t))
    );
    await refreshProjects();
  };

  const handleCloseTab = (tabId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(next[next.length - 1]?.id || null);
      }
      return next;
    });
  };

  const handleRunActive = async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    if (!activeTab) return;
    await handleSaveTab(activeTab.id);

    if (runStreamRef.current) {
      runStreamRef.current.close();
    }

    setConsoleState({
      runId: null,
      status: 'running',
      filePath: activeTab.path,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationMs: null,
      exitCode: null,
      stdout: '',
      stderr: '',
      errorLine: null,
    });

    const res = await api.startRun({
      projectId: activeTab.projectId,
      filePath: activeTab.path,
      code: activeTab.content,
    });

    setConsoleState((prev) => ({ ...prev, runId: res.runId, startedAt: res.startedAt }));

    const es = new EventSource(`/api/runtime/stream/${res.runId}`);
    runStreamRef.current = es;

    es.addEventListener('stdout', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { text: string };
      setConsoleState((prev) => ({ ...prev, stdout: prev.stdout + data.text }));
    });

    es.addEventListener('stdin', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { text: string };
      setConsoleState((prev) => ({ ...prev, stdout: prev.stdout + data.text }));
    });

    es.addEventListener('stderr', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { text: string };
      setConsoleState((prev) => ({ ...prev, stderr: prev.stderr + data.text }));
    });

    es.addEventListener('exit', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as {
        exitCode: number | null;
        status: 'success' | 'error' | 'stopped';
        endedAt: string;
        durationMs: number;
      };
      setConsoleState((prev) => ({
        ...prev,
        status: data.status,
        exitCode: data.exitCode,
        endedAt: data.endedAt,
        durationMs: data.durationMs,
        errorLine: data.status === 'error' ? extractErrorLine(prev.stderr, activeTab.name) : null,
      }));
      es.close();
      refreshHistory();
    });
  };

  const handleStopRun = async () => {
    if (consoleState.runId) {
      await api.stopRun(consoleState.runId);
    }
  };

  const handleSaveConsoleOutput = async (text: string) => {
    if (!activeProject || !text) return;
    const fname = `output_${Date.now()}.txt`;
    await api.writeFile(activeProject.id, fname, text);
    await refreshTree(activeProject.id);
  };

  const handleStartDebug = async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    if (!activeTab) return;
    await handleSaveTab(activeTab.id);

    if (dbgStreamRef.current) dbgStreamRef.current.close();
    const tabKey = `${activeTab.projectId}:${activeTab.path}`;
    const bps = breakpoints[tabKey] || [];

    setDebugState({
      debugId: null,
      status: 'running',
      currentFile: activeTab.name,
      currentLine: null,
      currentFunction: '',
      locals: [],
      globals: [],
      stack: [],
      output: '',
      exceptionText: null,
    });

    const res = await api.startDebug({
      projectId: activeTab.projectId,
      filePath: activeTab.path,
      code: activeTab.content,
      breakpoints: bps,
    });

    setDebugState((prev) => ({ ...prev, debugId: res.debugId }));
    const es = new EventSource(`/api/debug/stream/${res.debugId}`);
    dbgStreamRef.current = es;

    es.addEventListener('paused', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      setDebugState((prev) => ({
        ...prev,
        status: 'paused',
        currentFile: data.file,
        currentLine: data.line,
        currentFunction: data.function,
        locals: data.locals || [],
        globals: data.globals || [],
        stack: data.stack || [],
      }));
    });

    es.addEventListener('output', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { text: string };
      setDebugState((prev) => ({ ...prev, output: prev.output + data.text }));
    });

    es.addEventListener('exception', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as { traceback: string };
      setDebugState((prev) => ({ ...prev, exceptionText: data.traceback }));
    });

    es.addEventListener('finished', () => {
      setDebugState((prev) => ({ ...prev, status: 'finished', currentLine: null }));
      es.close();
    });
  };

  const handleDebugCommand = async (
    action: 'continue' | 'step_into' | 'step_over' | 'step_out' | 'pause' | 'stop'
  ) => {
    if (!debugState.debugId) return;
    if (action !== 'stop' && action !== 'pause') {
      setDebugState((prev) => ({ ...prev, status: 'running' }));
    }
    await api.sendDebugCommand(debugState.debugId, action);
  };

  const handleToggleBreakpoint = (tabKey: string, line: number) => {
    setBreakpoints((prev) => {
      const existing = prev[tabKey] || [];
      const nextList = existing.includes(line)
        ? existing.filter((l) => l !== line)
        : [...existing, line].sort((a, b) => a - b);
      if (debugState.debugId && (debugState.status === 'running' || debugState.status === 'paused')) {
        api.sendDebugCommand(debugState.debugId, 'set_breakpoints', nextList).catch(() => {});
      }
      return { ...prev, [tabKey]: nextList };
    });
  };

  const handleCreateFromExample = async (ex: ExampleItem) => {
    const res = await api.createProject({
      name: ex.title,
      description: ex.description,
      template: 'example',
      mainFile: ex.mainFile,
      files: ex.files,
    });
    await refreshProjects();
    await handleSelectProject(res.project);
    return res.project;
  };

  const handleOpenCodeInEditor = async (filename: string, code: string) => {
    if (!activeProject) return;
    await api.writeFile(activeProject.id, filename, code);
    await refreshTree(activeProject.id);
    await openFileInTab(activeProject.id, filename);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#0B0D14] dark:text-slate-100">
      <SidebarNav activeView={activeView} onSelectView={setActiveView} language={settings.language} />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {activeView === 'dashboard' && (
          <DashboardView
            runtimeInfo={runtimeInfo}
            projects={projects}
            activeProject={activeProject}
            openTabs={tabs}
            recentFiles={recentFiles}
            storageBytes={storageBytes}
            history={history}
            onNavigate={setActiveView}
            onNewProject={() => setShowNewProjectModal(true)}
            onNewPythonFile={handleNewPythonFile}
            onOpenProject={handleSelectProject}
            onOpenFile={openFileInTab}
          />
        )}

        {activeView === 'editor' && (
          <CodeEditorView
            project={activeProject}
            fileTree={fileTree}
            tabs={tabs}
            activeTabId={activeTabId}
            settings={settings}
            consoleState={consoleState}
            debugState={debugState}
            breakpoints={breakpoints}
            onSelectTab={setActiveTabId}
            onCloseTab={handleCloseTab}
            onUpdateTabContent={handleUpdateTabContent}
            onSaveTab={handleSaveTab}
            onOpenFile={openFileInTab}
            onNewFile={handleNewPythonFile}
            onRunActive={handleRunActive}
            onStopRun={handleStopRun}
            onClearConsole={() => setConsoleState((prev) => ({ ...prev, stdout: '', stderr: '', errorLine: null }))}
            onSendStdin={(inp) => consoleState.runId && api.sendRunInput(consoleState.runId, inp)}
            onSaveConsoleOutput={handleSaveConsoleOutput}
            onStartDebug={handleStartDebug}
            onDebugCommand={handleDebugCommand}
            onToggleBreakpoint={handleToggleBreakpoint}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeView === 'terminal' && (
          <div className="h-screen">
            <TerminalView projectId={activeProject?.id} settings={settings} />
          </div>
        )}

        {activeView === 'packages' && (
          <PackageManagerView
            activeProject={activeProject}
            onRefreshProjectTree={() => refreshTree()}
          />
        )}

        {activeView === 'explorer' && (
          <FileExplorerView
            projects={projects}
            activeProject={activeProject}
            fileTree={fileTree}
            onSelectProject={handleSelectProject}
            onRefreshProjects={async () => {
              await refreshProjects();
            }}
            onRefreshTree={() => refreshTree()}
            onOpenFileInEditor={openFileInTab}
            onNewProjectModal={() => setShowNewProjectModal(true)}
          />
        )}

        {activeView === 'servers' && (
          <WebServerView projects={projects} activeProject={activeProject} />
        )}

        {activeView === 'examples' && (
          <ExamplesLibraryView onCreateFromExample={handleCreateFromExample} />
        )}

        {activeView === 'learning' && (
          <LearningCenterView
            progress={learningProgress}
            onUpdateProgress={handleUpdateProgress}
            onOpenCodeInEditor={handleOpenCodeInEditor}
          />
        )}

        {activeView === 'runtime' && (
          <RuntimeManagerView runtimeInfo={runtimeInfo} onRefreshRuntime={refreshRuntime} />
        )}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSettings={handleResetSettings}
          />
        )}
      </main>

      <NewProjectModal
        open={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
