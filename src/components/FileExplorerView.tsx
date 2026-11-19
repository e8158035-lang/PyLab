import React, { useState, useRef } from 'react';
import {
  FolderPlus,
  FilePlus,
  Upload,
  Download,
  Trash2,
  Copy,
  Edit3,
  Search,
  FolderArchive,
  FileCode2,
  Folder,
} from 'lucide-react';
import { api } from '../services/api';
import type { FileNode, ProjectMeta } from '../types/pylab';

interface FileExplorerViewProps {
  projects: ProjectMeta[];
  activeProject: ProjectMeta | null;
  fileTree: FileNode[];
  onSelectProject: (proj: ProjectMeta) => void;
  onRefreshProjects: () => Promise<void>;
  onRefreshTree: () => Promise<void>;
  onOpenFileInEditor: (projectId: string, path: string) => Promise<void>;
  onNewProjectModal: () => void;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  projects,
  activeProject,
  fileTree,
  onSelectProject,
  onRefreshProjects,
  onRefreshTree,
  onOpenFileInEditor,
  onNewProjectModal,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder' | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [zipInspectEntries, setZipInspectEntries] = useState<Array<{ filename: string; size: number }> | null>(null);
  const [pendingZipBase64, setPendingZipBase64] = useState<string | null>(null);
  const [importProjectName, setImportProjectName] = useState('Imported Project');

  const zipInputRef = useRef<HTMLInputElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  const flattenNodes = (nodes: FileNode[]): FileNode[] => {
    const out: FileNode[] = [];
    for (const n of nodes) {
      out.push(n);
      if (n.children) out.push(...flattenNodes(n.children));
    }
    return out;
  };

  const allNodes = flattenNodes(fileTree).filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()) || n.path.toLowerCase().includes(search.toLowerCase())
  );

  const sortedNodes = [...allNodes].sort((a, b) => {
    if (sortBy === 'size') return b.size - a.size;
    if (sortBy === 'date') return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
    return a.path.localeCompare(b.path);
  });

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newItemName.trim() || !newItemType) return;
    if (newItemType === 'file') {
      await api.writeFile(activeProject.id, newItemName.trim(), '# New Python File\n');
    } else {
      await api.createFolder(activeProject.id, newItemName.trim());
    }
    setNewItemName('');
    setNewItemType(null);
    await onRefreshTree();
    await onRefreshProjects();
  };

  const handleDeleteSelected = async () => {
    if (!activeProject || selectedPaths.length === 0) return;
    for (const p of selectedPaths) {
      await api.deleteFile(activeProject.id, p);
    }
    setSelectedPaths([]);
    await onRefreshTree();
    await onRefreshProjects();
  };

  const handleRenameFile = async (oldPath: string) => {
    if (!activeProject) return;
    const next = window.prompt('Enter new relative path:', oldPath);
    if (!next || next === oldPath) return;
    await api.renamePath(activeProject.id, oldPath, next);
    await onRefreshTree();
  };

  const handleCopyFile = async (srcPath: string) => {
    if (!activeProject) return;
    const dst = window.prompt('Copy to relative path:', `${srcPath}.bak`);
    if (!dst) return;
    await api.copyPath(activeProject.id, srcPath, dst);
    await onRefreshTree();
  };

  const handleZipSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = String(reader.result || '').split(',')[1] || '';
      const res = await api.inspectZip(b64);
      if (res.ok && res.entries) {
        setPendingZipBase64(b64);
        setImportProjectName(file.name.replace(/\.zip$/i, ''));
        setZipInspectEntries(res.entries.filter((en) => !en.is_dir));
      } else {
        setStatusMsg(res.error || 'Invalid ZIP archive.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmZipImport = async () => {
    if (!pendingZipBase64) return;
    const res = await api.importZip(importProjectName, pendingZipBase64);
    if (res.ok && res.project) {
      setStatusMsg(`Imported ${res.count} files into "${res.project.name}".`);
      setZipInspectEntries(null);
      setPendingZipBase64(null);
      await onRefreshProjects();
      onSelectProject(res.project);
    } else {
      setStatusMsg(res.error || 'ZIP import blocked.');
    }
  };

  const handleImportSingleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;
    const text = await file.text();
    await api.writeFile(activeProject.id, file.name, text);
    await onRefreshTree();
    setStatusMsg(`Imported ${file.name} into ${activeProject.name}.`);
  };

  const handleDuplicateProject = async () => {
    if (!activeProject) return;
    const nextName = window.prompt('Duplicate project name:', `${activeProject.name} Copy`);
    if (!nextName) return;
    const res = await api.duplicateProject(activeProject.id, nextName);
    await onRefreshProjects();
    onSelectProject(res.project);
  };

  const handleDeleteProject = async (proj: ProjectMeta) => {
    if (projects.length <= 1) {
      setStatusMsg('Keep at least one project in the workspace.');
      return;
    }
    await api.deleteProject(proj.id);
    await onRefreshProjects();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24 lg:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23283B] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Projects & File Explorer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage multi-file Python projects, import/export ZIP archives, and organize files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNewProjectModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => zipInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-white dark:bg-[#121521] text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-blue-500" />
            <span>Import ZIP</span>
          </button>
          <input ref={zipInputRef} type="file" accept=".zip" onChange={handleZipSelect} className="hidden" />

          {activeProject && (
            <a
              href={`/api/projects/${activeProject.id}/export-zip`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-white dark:bg-[#121521] text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Export ZIP</span>
            </a>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="px-4 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-400 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)}>Dismiss</button>
        </div>
      )}

      {/* ZIP Preview Modal */}
      {zipInspectEntries && (
        <div className="rounded-xl border border-violet-500/40 bg-white dark:bg-[#121521] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
              <FolderArchive className="w-4 h-4 text-violet-500" />
              <span>ZIP Contents Preview ({zipInspectEntries.length} files)</span>
            </div>
            <button onClick={() => setZipInspectEntries(null)} className="text-xs text-slate-400">
              Cancel
            </button>
          </div>
          <input
            type="text"
            value={importProjectName}
            onChange={(e) => setImportProjectName(e.target.value)}
            className="w-full sm:w-80 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs"
            placeholder="Target project name"
          />
          <div className="max-h-40 overflow-auto text-xs font-mono space-y-1 text-slate-500">
            {zipInspectEntries.map((en) => (
              <div key={en.filename}>
                {en.filename} ({en.size} B)
              </div>
            ))}
          </div>
          <button
            onClick={handleConfirmZipImport}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold"
          >
            Extract & Create Project
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
              Projects ({projects.length})
            </h2>
            {activeProject && (
              <button onClick={handleDuplicateProject} className="text-xs text-blue-500 hover:underline">
                Duplicate Active
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {projects.map((p) => {
              const active = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-slate-200 dark:border-[#23283B] hover:bg-slate-50 dark:hover:bg-[#191D2D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">{p.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(p);
                      }}
                      className="text-slate-400 hover:text-red-500"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.mainFile} · {p.fileCount} files
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Tree & Actions */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewItemType('file')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
              >
                <FilePlus className="w-3.5 h-3.5 text-violet-500" />
                <span>New File</span>
              </button>
              <button
                onClick={() => setNewItemType('folder')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => fileImportRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-[#2A3046] text-xs font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import File</span>
              </button>
              <input ref={fileImportRef} type="file" onChange={handleImportSingleFile} className="hidden" />
              {selectedPaths.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedPaths.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter files..."
                  className="pl-8 pr-2.5 py-1 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-xs"
              >
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
                <option value="date">Sort: Modified</option>
              </select>
            </div>
          </div>

          {newItemType && (
            <form onSubmit={handleCreateItem} className="flex items-center gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={newItemType === 'file' ? 'e.g. utils/helper.py' : 'e.g. modules'}
                className="flex-1 px-3 py-1.5 rounded-lg border border-violet-500 bg-slate-50 dark:bg-[#0B0D14] text-xs font-mono"
                autoFocus
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold">
                Create
              </button>
              <button type="button" onClick={() => setNewItemType(null)} className="text-xs text-slate-400">
                Cancel
              </button>
            </form>
          )}

          <div className="divide-y divide-slate-100 dark:divide-[#1E2336]">
            {sortedNodes.map((node) => {
              const checked = selectedPaths.includes(node.path);
              return (
                <div
                  key={node.path}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-[#191D2D] px-2 rounded-lg"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedPaths((prev) =>
                          checked ? prev.filter((x) => x !== node.path) : [...prev, node.path]
                        )
                      }
                    />
                    {node.type === 'directory' ? (
                      <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <FileCode2 className="w-4 h-4 text-violet-400 shrink-0" />
                    )}
                    <button
                      onClick={() =>
                        node.type === 'file' && activeProject && onOpenFileInEditor(activeProject.id, node.path)
                      }
                      className="font-mono text-slate-900 dark:text-slate-100 truncate hover:text-violet-500 text-left"
                    >
                      {node.path}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-slate-500">
                    <span className="tabular-nums hidden sm:inline">
                      {node.type === 'file' ? `${node.size} B` : 'Folder'}
                    </span>
                    <button onClick={() => handleRenameFile(node.path)} title="Rename" className="hover:text-white">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleCopyFile(node.path)} title="Copy" className="hover:text-white">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
