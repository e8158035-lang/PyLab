import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { PROJECT_TEMPLATES } from '../data/projectTemplates';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string;
    template: string;
    mainFile: string;
    pythonVersion: string;
    files: Record<string, string>;
  }) => Promise<void>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('My Python App');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('basic');
  const [mainFile, setMainFile] = useState('main.py');
  const [pythonVersion, setPythonVersion] = useState('3.11');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const selectedTpl = PROJECT_TEMPLATES.find((t) => t.id === templateId) || PROJECT_TEMPLATES[1];

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === id);
    if (tpl) setMainFile(tpl.mainFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || selectedTpl.description,
        template: templateId,
        mainFile: mainFile.trim() || selectedTpl.mainFile,
        pythonVersion,
        files: selectedTpl.files,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#23283B]">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-violet-500" />
            <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-white">
              Create New Python Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#191D2D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Entry File & Python Version
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mainFile}
                  onChange={(e) => setMainFile(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
                <select
                  value={pythonVersion}
                  onChange={(e) => setPythonVersion(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-sm text-slate-900 dark:text-white"
                >
                  <option value="3.11">Python 3.11</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={selectedTpl.description}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#2A3046] bg-slate-50 dark:bg-[#0B0D14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
              Project Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PROJECT_TEMPLATES.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => handleTemplateChange(tpl.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      selected
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-slate-200 dark:border-[#23283B] bg-slate-50 dark:bg-[#0B0D14] hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{tpl.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {tpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#23283B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#191D2D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 whitespace-nowrap"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
