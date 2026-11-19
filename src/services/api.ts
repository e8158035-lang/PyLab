import type {
  CatalogPackage,
  ExecutionHistoryItem,
  FileNode,
  InstalledPackage,
  ProjectMeta,
  RuntimeInfo,
  WebServerInstance,
} from '../types/pylab';

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok && data?.error) {
    throw new Error(data.error);
  }
  return data as T;
}

export const api = {
  // Runtime
  getRuntimeInfo: () => jsonFetch<{ ok: boolean } & RuntimeInfo>('/api/runtime/info'),
  runDiagnostics: () =>
    jsonFetch<{
      ok: boolean;
      pythonVersion: string;
      tests: Array<{ name: string; passed: boolean; output: string; durationMs: number }>;
    }>('/api/runtime/diagnostics', { method: 'POST' }),
  startRun: (payload: { projectId: string; filePath?: string; code?: string }) =>
    jsonFetch<{ ok: boolean; runId: string; startedAt: string }>('/api/runtime/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendRunInput: (runId: string, input: string) =>
    jsonFetch<{ ok: boolean }>('/api/runtime/input', {
      method: 'POST',
      body: JSON.stringify({ runId, input }),
    }),
  stopRun: (runId: string) =>
    jsonFetch<{ ok: boolean }>('/api/runtime/stop', {
      method: 'POST',
      body: JSON.stringify({ runId }),
    }),
  execInline: (payload: { code: string; stdin?: string; projectId?: string }) =>
    jsonFetch<{ ok: boolean; stdout: string; stderr: string; exitCode: number; durationMs: number }>(
      '/api/runtime/exec-inline',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  getExecutionHistory: () => jsonFetch<{ ok: boolean; items: ExecutionHistoryItem[] }>('/api/runtime/history'),

  // Debugger
  startDebug: (payload: { projectId: string; filePath: string; code?: string; breakpoints: number[] }) =>
    jsonFetch<{ ok: boolean; debugId: string }>('/api/debug/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendDebugCommand: (
    debugId: string,
    action: 'continue' | 'step_into' | 'step_over' | 'step_out' | 'pause' | 'stop' | 'set_breakpoints',
    lines?: number[]
  ) =>
    jsonFetch<{ ok: boolean }>('/api/debug/command', {
      method: 'POST',
      body: JSON.stringify({ debugId, action, lines }),
    }),

  // Projects & Files
  listProjects: () => jsonFetch<{ ok: boolean; projects: ProjectMeta[] }>('/api/projects'),
  createProject: (payload: {
    name: string;
    description?: string;
    template?: string;
    mainFile?: string;
    pythonVersion?: string;
    files?: Record<string, string>;
  }) =>
    jsonFetch<{ ok: boolean; project: ProjectMeta }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProject: (
    id: string,
    updates: Partial<{ name: string; description: string; mainFile: string; pythonVersion: string }>
  ) =>
    jsonFetch<{ ok: boolean; project: ProjectMeta }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  duplicateProject: (id: string, name: string) =>
    jsonFetch<{ ok: boolean; project: ProjectMeta }>(`/api/projects/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteProject: (id: string) => jsonFetch<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  getFileTree: (projectId: string) => jsonFetch<{ ok: boolean; tree: FileNode[] }>(`/api/projects/${projectId}/tree`),
  readFile: (projectId: string, relPath: string) =>
    jsonFetch<{ ok: boolean; path: string; content: string }>(
      `/api/projects/${projectId}/file?path=${encodeURIComponent(relPath)}`
    ),
  writeFile: (projectId: string, relPath: string, content: string) =>
    jsonFetch<{ ok: boolean; path: string }>(`/api/projects/${projectId}/file`, {
      method: 'PUT',
      body: JSON.stringify({ path: relPath, content }),
    }),
  deleteFile: (projectId: string, relPath: string) =>
    jsonFetch<{ ok: boolean }>(`/api/projects/${projectId}/file?path=${encodeURIComponent(relPath)}`, {
      method: 'DELETE',
    }),
  createFolder: (projectId: string, relPath: string) =>
    jsonFetch<{ ok: boolean }>(`/api/projects/${projectId}/folder`, {
      method: 'POST',
      body: JSON.stringify({ path: relPath }),
    }),
  renamePath: (projectId: string, oldPath: string, newPath: string) =>
    jsonFetch<{ ok: boolean }>(`/api/projects/${projectId}/rename`, {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath }),
    }),
  copyPath: (projectId: string, sourcePath: string, destPath: string) =>
    jsonFetch<{ ok: boolean }>(`/api/projects/${projectId}/copy`, {
      method: 'POST',
      body: JSON.stringify({ sourcePath, destPath }),
    }),

  // ZIP
  inspectZip: (base64: string) =>
    jsonFetch<{ ok: boolean; entries?: Array<{ filename: string; size: number; is_dir: boolean }>; error?: string }>(
      '/api/projects/inspect-zip',
      { method: 'POST', body: JSON.stringify({ base64 }) }
    ),
  importZip: (projectName: string, base64: string) =>
    jsonFetch<{ ok: boolean; project?: ProjectMeta; count?: number; error?: string }>('/api/projects/import-zip', {
      method: 'POST',
      body: JSON.stringify({ projectName, base64 }),
    }),

  // Packages
  getPackageCatalog: () => jsonFetch<{ ok: boolean; catalog: CatalogPackage[] }>('/api/packages/catalog'),
  listInstalledPackages: () =>
    jsonFetch<{ ok: boolean; packages: InstalledPackage[] }>('/api/packages/installed'),
  installPackage: (name: string, upgrade = false) =>
    jsonFetch<{ ok: boolean; logs?: string[]; error?: string }>('/api/packages/install', {
      method: 'POST',
      body: JSON.stringify({ name, upgrade }),
    }),
  uninstallPackage: (name: string) =>
    jsonFetch<{ ok: boolean; logs?: string[]; error?: string }>('/api/packages/uninstall', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  inspectPackage: (name: string) =>
    jsonFetch<Record<string, unknown>>(`/api/packages/inspect?name=${encodeURIComponent(name)}`),
  freezePackages: () => jsonFetch<{ ok: boolean; freeze: string }>('/api/packages/freeze'),
  checkPackages: () => jsonFetch<{ ok: boolean; issues: string[] }>('/api/packages/check'),
  getPackageLogs: () =>
    jsonFetch<{
      ok: boolean;
      items: Array<{ id: string; action: string; package_name: string; status: string; log_text: string; created_at: string }>;
    }>('/api/packages/logs'),
  getRequirements: (projectId: string) =>
    jsonFetch<{
      ok: boolean;
      content: string;
      dependencies: Array<{
        spec: string;
        name: string;
        requiredVersion: string;
        installed: boolean;
        installedVersion: string | null;
      }>;
    }>(`/api/projects/${projectId}/requirements`),
  installRequirements: (projectId: string) =>
    jsonFetch<{ ok: boolean; logs: string[] }>(`/api/projects/${projectId}/requirements/install`, {
      method: 'POST',
    }),

  // Terminal
  execTerminal: (sessionId: string, command: string, projectId?: string) =>
    jsonFetch<{
      ok: boolean;
      stdout: string;
      stderr: string;
      cwd: string;
      displayCwd: string;
      exitCode: number;
      clear?: boolean;
    }>('/api/terminal/exec', {
      method: 'POST',
      body: JSON.stringify({ sessionId, command, projectId }),
    }),

  // Web Servers
  listServers: () => jsonFetch<{ ok: boolean; servers: WebServerInstance[] }>('/api/servers'),
  getFreePort: () => jsonFetch<{ ok: boolean; port: number }>('/api/servers/free-port'),
  startServer: (payload: {
    projectId: string;
    projectName: string;
    entryFile: string;
    framework: 'flask' | 'fastapi' | 'http';
    port: number;
    host: string;
  }) =>
    jsonFetch<{ ok: boolean; server: WebServerInstance }>('/api/servers/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  stopServer: (serverId: string) =>
    jsonFetch<{ ok: boolean }>('/api/servers/stop', {
      method: 'POST',
      body: JSON.stringify({ serverId }),
    }),

  // State & Storage
  getState: <T>(key: string) => jsonFetch<{ ok: boolean; value: T | null }>(`/api/state/${key}`),
  setState: (key: string, value: unknown) =>
    jsonFetch<{ ok: boolean }>(`/api/state/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  getStorageSummary: () =>
    jsonFetch<{
      ok: boolean;
      projectsBytes: number;
      packagesBytes: number;
      tmpBytes: number;
      totalBytes: number;
      projectCount: number;
    }>('/api/storage/summary'),
  clearTmp: () => jsonFetch<{ ok: boolean }>('/api/storage/clear-tmp', { method: 'POST' }),
  exportBackup: () => jsonFetch<{ ok: boolean; kv: Record<string, unknown> }>('/api/backup/export'),
  importBackup: (data: { kv: Record<string, unknown> }) =>
    jsonFetch<{ ok: boolean }>('/api/backup/import', { method: 'POST', body: JSON.stringify(data) }),
};
