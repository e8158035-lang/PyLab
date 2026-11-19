import React, { useEffect, useState } from 'react';
import { Globe, Play, Square, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { ProjectMeta, WebServerInstance } from '../types/pylab';

interface WebServerViewProps {
  projects: ProjectMeta[];
  activeProject: ProjectMeta | null;
}

export const WebServerView: React.FC<WebServerViewProps> = ({ projects, activeProject }) => {
  const [servers, setServers] = useState<WebServerInstance[]>([]);
  const [projectId, setProjectId] = useState(activeProject?.id || projects[0]?.id || '');
  const [entryFile, setEntryFile] = useState(activeProject?.mainFile || 'app.py');
  const [framework, setFramework] = useState<'flask' | 'fastapi' | 'http'>('flask');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(5200);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [previewServer, setPreviewServer] = useState<WebServerInstance | null>(null);

  const loadServers = async () => {
    const res = await api.listServers();
    setServers(res.servers || []);
  };

  useEffect(() => {
    loadServers();
    api.getFreePort().then((r) => setPort(r.port)).catch(() => {});
    const timer = setInterval(loadServers, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeProject) {
      setProjectId(activeProject.id);
      setEntryFile(activeProject.mainFile);
    }
  }, [activeProject?.id]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    setStarting(true);
    setError(null);
    try {
      const res = await api.startServer({
        projectId: proj.id,
        projectName: proj.name,
        entryFile,
        framework,
        port,
        host,
      });
      await loadServers();
      setPreviewServer(res.server);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async (serverId: string) => {
    await api.stopServer(serverId);
    await loadServers();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-10">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Python Web Servers (Flask · FastAPI · HTTP)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Launch local Python web frameworks with port conflict detection, live server logs, and built-in preview.
          </p>
        </div>
        <button
          onClick={loadServers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Launch Form */}
      <form
        onSubmit={handleStart}
        className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4"
      >
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Launch Local Python Server</div>
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                const p = projects.find((x) => x.id === e.target.value);
                if (p) setEntryFile(p.mainFile);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Entry File</label>
            <input
              type="text"
              value={entryFile}
              onChange={(e) => setEntryFile(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value as 'flask' | 'fastapi' | 'http')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs"
            >
              <option value="flask">Flask (WSGI)</option>
              <option value="fastapi">FastAPI (Uvicorn)</option>
              <option value="http">Python HTTP Server</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Host</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={starting || !projectId}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{starting ? 'Starting...' : 'Start Server'}</span>
          </button>
        </div>
      </form>

      {/* Active & Past Servers */}
      <div className="space-y-4">
        {servers.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] text-sm text-slate-500">
            No web servers launched yet. Make sure Flask or FastAPI is installed in Package Manager before launching a framework app.
          </div>
        ) : (
          servers.map((srv) => (
            <div
              key={srv.serverId}
              className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {srv.projectName} · {srv.framework.toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      http://{srv.host}:{srv.port} · {srv.entryFile} ·{' '}
                      <span
                        className={
                          srv.status === 'running'
                            ? 'text-emerald-500 font-semibold'
                            : srv.status === 'error'
                            ? 'text-red-500'
                            : 'text-slate-400'
                        }
                      >
                        {srv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {srv.status === 'running' && (
                    <>
                      <button
                        onClick={() => setPreviewServer(srv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Preview</span>
                      </button>
                      <button
                        onClick={() => handleStop(srv.serverId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Stop</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <pre className="p-3 rounded-lg bg-[#090B11] text-slate-300 font-mono text-[11px] max-h-40 overflow-auto whitespace-pre-wrap">
                {srv.logs.join('\n')}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Embedded Live Preview */}
      {previewServer && previewServer.status === 'running' && (
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-[#23283B] text-xs">
            <span className="font-mono text-slate-700 dark:text-slate-200">
              Preview: http://{previewServer.host}:{previewServer.port}
            </span>
            <button onClick={() => setPreviewServer(null)} className="text-slate-400 hover:text-white">
              Close Preview
            </button>
          </div>
          <iframe
            src={previewServer.previewUrl}
            title="Python Web App Preview"
            className="w-full h-80 bg-white"
          />
        </div>
      )}
    </div>
  );
};
