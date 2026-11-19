import React, { useEffect, useState, useRef } from 'react';
import { Settings, HardDrive, Download, Upload, Smartphone, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_SETTINGS, type AppSettings } from '../types/pylab';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onResetSettings: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [storage, setStorage] = useState<{
    projectsBytes: number;
    packagesBytes: number;
    tmpBytes: number;
    totalBytes: number;
    projectCount: number;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const loadStorage = async () => {
    const res = await api.getStorageSummary();
    setStorage(res);
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const handleClearTmp = async () => {
    await api.clearTmp();
    await loadStorage();
    setNotice('Temporary files cleared.');
  };

  const handleExportBackup = async () => {
    const data = await api.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pylab_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      await api.importBackup(parsed);
      setNotice('Backup restored. Reloading preferences...');
      window.location.reload();
    } catch {
      setNotice('Invalid backup JSON file.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24 lg:pb-10">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-violet-500" />
            <span>PyLab Studio Settings & About</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure editor, terminal, appearance, persistent backups, and Android Studio project export.
          </p>
        </div>
        <button
          onClick={onResetSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {notice && (
        <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-500">
          {notice}
        </div>
      )}

      {/* Editor & Terminal Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">Editor Settings</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Font Size ({settings.editorFontSize}px)</span>
              <input
                type="range"
                min={11}
                max={22}
                value={settings.editorFontSize}
                onChange={(e) => onUpdateSettings({ editorFontSize: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Tab Size</span>
              <select
                value={settings.tabSize}
                onChange={(e) => onUpdateSettings({ tabSize: Number(e.target.value) })}
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14]"
              >
                <option value={2}>2 Spaces</option>
                <option value={4}>4 Spaces</option>
              </select>
            </div>

            {(
              [
                ['autoIndent', 'Auto Indentation'],
                ['autoComplete', 'Auto Completion'],
                ['lineNumbers', 'Line Numbers'],
                ['wordWrap', 'Word Wrap'],
                ['autoSave', 'Auto Save Changes'],
                ['syntaxHighlighting', 'Syntax Highlighting'],
              ] as Array<[keyof AppSettings, string]>
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-600 dark:text-slate-300">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(e) => onUpdateSettings({ [key]: e.target.checked })}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Appearance & Terminal */}
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-4">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
            Appearance & Terminal
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Theme Mode</span>
              <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0D14]">
                {(['dark', 'light'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdateSettings({ theme: m })}
                    className={`px-3 py-1 rounded font-medium capitalize ${
                      settings.theme === m ? 'bg-violet-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Interface Language</span>
              <select
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value as 'ar' | 'en' })}
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14]"
              >
                <option value="en">English (IDE) + العربية (Learning)</option>
                <option value="ar">العربية (Navigation)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">
                Terminal Font Size ({settings.terminalFontSize}px)
              </span>
              <input
                type="range"
                min={11}
                max={20}
                value={settings.terminalFontSize}
                onChange={(e) => onUpdateSettings({ terminalFontSize: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Terminal Theme</span>
              <select
                value={settings.terminalTheme}
                onChange={(e) =>
                  onUpdateSettings({ terminalTheme: e.target.value as AppSettings['terminalTheme'] })
                }
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14]"
              >
                <option value="midnight">Midnight Slate</option>
                <option value="slate">Classic Slate</option>
                <option value="matrix">High Contrast Green</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Storage, Backup & Android Studio Source Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-3">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span>Storage & SQLite Backup</span>
          </h2>
          {storage && (
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 tabular-nums">
              <div>Projects ({storage.projectCount}): {formatBytes(storage.projectsBytes)}</div>
              <div>Installed pip Packages: {formatBytes(storage.packagesBytes)}</div>
              <div>Temporary Files: {formatBytes(storage.tmpBytes)}</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Total Workspace: {formatBytes(storage.totalBytes)}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleClearTmp}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
            >
              Clear Temp Files
            </button>
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Settings & Progress</span>
            </button>
            <button
              onClick={() => backupRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
            </button>
            <input ref={backupRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-5 space-y-3">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>About PyLab Studio & Android Source</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            PyLab Studio v1.0.0 — Pure local Python 3.11 IDE with zero AI/LLM dependencies, SQLite persistence, real bdb debugger, PyPI wheel pip manager, and Arabic Python Learning Center.
          </p>
          <a
            href="/api/android/export-source"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Download Android Studio (Kotlin + Chaquopy) Source ZIP</span>
          </a>
        </div>
      </div>
    </div>
  );
};
