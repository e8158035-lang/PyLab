import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import type { CatalogPackage, InstalledPackage, ProjectMeta } from '../types/pylab';

interface PackageManagerViewProps {
  activeProject: ProjectMeta | null;
  onRefreshProjectTree: () => void;
}

export const PackageManagerView: React.FC<PackageManagerViewProps> = ({
  activeProject,
  onRefreshProjectTree,
}) => {
  const [tab, setTab] = useState<'browse' | 'installed' | 'requirements' | 'logs'>('browse');
  const [catalog, setCatalog] = useState<CatalogPackage[]>([]);
  const [installed, setInstalled] = useState<InstalledPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [busyPkg, setBusyPkg] = useState<string | null>(null);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [inspectResult, setInspectResult] = useState<Record<string, unknown> | null>(null);
  const [pkgLogs, setPkgLogs] = useState<
    Array<{ id: string; action: string; package_name: string; status: string; log_text: string; created_at: string }>
  >([]);
  const [reqContent, setReqContent] = useState('');
  const [reqDeps, setReqDeps] = useState<
    Array<{ spec: string; name: string; requiredVersion: string; installed: boolean; installedVersion: string | null }>
  >([]);
  const [checkIssues, setCheckIssues] = useState<string[] | null>(null);

  const loadData = async () => {
    try {
      const [catRes, instRes, logsRes] = await Promise.all([
        api.getPackageCatalog(),
        api.listInstalledPackages(),
        api.getPackageLogs(),
      ]);
      setCatalog(catRes.catalog || []);
      setInstalled(instRes.packages || []);
      setPkgLogs(logsRes.items || []);
      if (activeProject) {
        const reqRes = await api.getRequirements(activeProject.id);
        setReqContent(reqRes.content);
        setReqDeps(reqRes.dependencies);
      }
    } catch {
      // handled in UI
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id]);

  const installedMap = new Map(installed.map((p) => [p.normalized, p]));

  const handleInstall = async (pkgName: string, upgrade = false) => {
    setBusyPkg(pkgName);
    setOutputLog([`Running pip ${upgrade ? 'install --upgrade' : 'install'} ${pkgName}...`]);
    try {
      const res = await api.installPackage(pkgName, upgrade);
      setOutputLog(res.logs || [res.error || 'Completed.']);
      await loadData();
    } catch (err: unknown) {
      setOutputLog([`ERROR: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setBusyPkg(null);
    }
  };

  const handleUninstall = async (pkgName: string) => {
    setBusyPkg(pkgName);
    setOutputLog([`Running pip uninstall ${pkgName}...`]);
    try {
      const res = await api.uninstallPackage(pkgName);
      setOutputLog(res.logs || [res.error || 'Uninstalled.']);
      await loadData();
    } catch (err: unknown) {
      setOutputLog([`ERROR: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setBusyPkg(null);
    }
  };

  const handleInspectCustom = async () => {
    if (!searchQuery.trim()) return;
    setBusyPkg(searchQuery.trim());
    try {
      const info = await api.inspectPackage(searchQuery.trim());
      setInspectResult(info);
    } catch (err: unknown) {
      setInspectResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusyPkg(null);
    }
  };

  const handleSaveRequirements = async () => {
    if (!activeProject) return;
    await api.writeFile(activeProject.id, 'requirements.txt', reqContent);
    onRefreshProjectTree();
    await loadData();
    setOutputLog(['Saved requirements.txt and re-analyzed dependencies.']);
  };

  const handleGenerateFreeze = async () => {
    if (!activeProject) return;
    const res = await api.freezePackages();
    setReqContent(res.freeze || '');
    setOutputLog(['Generated requirements.txt from currently installed packages (pip freeze).']);
  };

  const handleInstallAllRequirements = async () => {
    if (!activeProject) return;
    setBusyPkg('requirements.txt');
    setOutputLog(['Installing dependencies from requirements.txt...']);
    try {
      const res = await api.installRequirements(activeProject.id);
      setOutputLog(res.logs || []);
      await loadData();
    } finally {
      setBusyPkg(null);
    }
  };

  const handlePipCheck = async () => {
    const res = await api.checkPackages();
    setCheckIssues(res.issues || []);
  };

  const filteredCatalog = catalog.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Package Manager (pip)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real PyPI wheel installer · {installed.length} packages installed in isolated workspace
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#121521] border border-slate-200 dark:border-[#23283B] overflow-x-auto">
          {[
            { id: 'browse', label: 'Browse PyPI' },
            { id: 'installed', label: `Installed (${installed.length})` },
            { id: 'requirements', label: 'requirements.txt' },
            { id: 'logs', label: 'Logs & Check' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Pip Output Box */}
      {outputLog.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-[#090B11] text-slate-200 p-4 font-mono text-xs max-h-48 overflow-auto">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>pip output</span>
            <button onClick={() => setOutputLog([])} className="hover:text-white">
              Dismiss
            </button>
          </div>
          {outputLog.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('ERROR')
                  ? 'text-red-400'
                  : line.startsWith('Successfully')
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {tab === 'browse' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search curated packages or enter any PyPI package name (e.g. requests, flask, httpx)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-white dark:bg-[#121521] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              onClick={handleInspectCustom}
              disabled={!searchQuery.trim() || busyPkg !== null}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-white dark:bg-[#121521] hover:bg-slate-50 dark:hover:bg-[#191D2D] text-sm font-medium text-slate-800 dark:text-white whitespace-nowrap"
            >
              Inspect on PyPI
            </button>
            <button
              onClick={() => searchQuery.trim() && handleInstall(searchQuery.trim())}
              disabled={!searchQuery.trim() || busyPkg !== null}
              className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
            >
              {busyPkg === searchQuery.trim() ? 'Installing...' : 'pip install'}
            </button>
          </div>

          {inspectResult && (
            <div className="rounded-xl border border-violet-500/40 bg-white dark:bg-[#121521] p-4 text-sm space-y-2">
              {inspectResult.ok ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {String(inspectResult.name)} · v{String(inspectResult.version)}
                    </div>
                    <button
                      onClick={() => handleInstall(String(inspectResult.name))}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                    >
                      Install
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">{String(inspectResult.summary || '')}</p>
                  <p className="text-xs text-blue-500">{String(inspectResult.compatibility_note || '')}</p>
                </>
              ) : (
                <div className="text-red-400 text-xs">{String(inspectResult.error)}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((pkg) => {
              const norm = pkg.name.toLowerCase().replace(/[-_.]+/g, '-');
              const inst = installedMap.get(norm);
              const isBusy = busyPkg === pkg.name;
              return (
                <div
                  key={pkg.name}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-base text-slate-900 dark:text-white">
                        {pkg.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {pkg.category} {inst ? `· v${inst.version}` : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{pkg.description}</p>
                    <div className="mt-2 flex items-start gap-1.5 text-xs">
                      {pkg.compatibility === 'compatible' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : pkg.compatibility === 'partial' ? (
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <span className="text-slate-500 dark:text-slate-400">{pkg.compatibilityNote}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2336]">
                    {inst ? (
                      <>
                        <button
                          onClick={() => handleInstall(pkg.name, true)}
                          disabled={busyPkg !== null}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#191D2D]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Upgrade</span>
                        </button>
                        <button
                          onClick={() => handleUninstall(pkg.name)}
                          disabled={busyPkg !== null}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/40 text-xs font-medium text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isBusy ? 'Working...' : 'Uninstall'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInstall(pkg.name)}
                        disabled={busyPkg !== null}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'Installing...' : 'Install'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'installed' && (
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] overflow-hidden">
          {installed.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No third-party packages installed yet. Use Browse PyPI to install packages like requests or flask.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-[#23283B] bg-slate-50 dark:bg-[#161A29] text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Package</th>
                  <th className="py-3 px-4 font-semibold">Version</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Summary</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2336]">
                {installed.map((pkg) => (
                  <tr key={pkg.normalized} className="hover:bg-slate-50 dark:hover:bg-[#191D2D]">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {pkg.name}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-emerald-500">{pkg.version}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell truncate max-w-md">
                      {pkg.summary}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleInstall(pkg.name, true)}
                        disabled={busyPkg !== null}
                        className="text-blue-500 hover:underline font-medium"
                      >
                        Upgrade
                      </button>
                      <button
                        onClick={() => handleUninstall(pkg.name)}
                        disabled={busyPkg !== null}
                        className="text-red-500 hover:underline font-medium"
                      >
                        Uninstall
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'requirements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-violet-500" />
                <span>requirements.txt ({activeProject?.name || 'No project'})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateFreeze}
                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
                >
                  pip freeze
                </button>
                <button
                  onClick={handleSaveRequirements}
                  disabled={!activeProject}
                  className="px-3 py-1 rounded bg-violet-600 text-white text-xs font-semibold disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
            <textarea
              value={reqContent}
              onChange={(e) => setReqContent(e.target.value)}
              rows={10}
              placeholder="requests==2.32.3&#10;flask"
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Dependency Analysis
              </span>
              <button
                onClick={handleInstallAllRequirements}
                disabled={!activeProject || busyPkg !== null}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-40"
              >
                {busyPkg === 'requirements.txt' ? 'Installing...' : 'Install Missing'}
              </button>
            </div>
            {reqDeps.length === 0 ? (
              <p className="text-xs text-slate-500">No dependencies declared in requirements.txt.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1E2336]">
                {reqDeps.map((d) => (
                  <div key={d.spec} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{d.spec}</span>
                      <div className="text-slate-500">
                        {d.installed ? `Installed: v${d.installedVersion}` : 'Missing in workspace'}
                      </div>
                    </div>
                    <span className={d.installed ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                      {d.installed ? 'Satisfied' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521]">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Verify Package Consistency (pip check)
              </div>
              <div className="text-xs text-slate-500">
                Checks installed packages for missing or broken dependencies.
              </div>
            </div>
            <button
              onClick={handlePipCheck}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Run pip check
            </button>
          </div>

          {checkIssues !== null && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] text-xs">
              {checkIssues.length === 0 ? (
                <div className="text-emerald-500 font-medium">No broken requirements found.</div>
              ) : (
                <ul className="list-disc pl-5 text-red-400 space-y-1">
                  {checkIssues.map((iss, idx) => (
                    <li key={idx}>{iss}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-500" />
              <span>Installation History</span>
            </div>
            {pkgLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No package actions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {pkgLogs.map((l) => (
                  <div key={l.id} className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B0D14] border border-slate-200 dark:border-[#23283B] text-xs">
                    <div className="flex items-center justify-between font-mono mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {l.action} {l.package_name}
                      </span>
                      <span className={l.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>
                        {l.status}
                      </span>
                    </div>
                    <pre className="text-[11px] text-slate-500 whitespace-pre-wrap">{l.log_text}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
