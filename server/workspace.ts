import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const WORKSPACE_ROOT = path.resolve(process.cwd(), 'pylab_workspace');
export const PROJECTS_DIR = path.join(WORKSPACE_ROOT, 'projects');
export const PACKAGES_DIR = path.join(WORKSPACE_ROOT, 'packages');
export const TMP_DIR = path.join(WORKSPACE_ROOT, 'tmp');
export const DB_PATH = path.join(WORKSPACE_ROOT, 'db', 'pylab.db');
export const PYTHON_SCRIPTS_DIR = path.resolve(process.cwd(), 'server', 'python');

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  template: string;
  mainFile: string;
  pythonVersion: string;
  createdAt: string;
  updatedAt: string;
  path: string;
  fileCount: number;
  sizeBytes: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  extension: string;
  modifiedAt: string;
  children?: FileNode[];
}

export function ensureWorkspaceInitialized(): void {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.mkdirSync(PACKAGES_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const existing = fs.readdirSync(PROJECTS_DIR).filter((name) => {
    return fs.statSync(path.join(PROJECTS_DIR, name)).isDirectory();
  });

  if (existing.length === 0) {
    seedDefaultProject();
  }
}

function seedDefaultProject(): void {
  const projId = 'welcome-python';
  const projDir = path.join(PROJECTS_DIR, projId);
  fs.mkdirSync(projDir, { recursive: true });

  const meta = {
    id: projId,
    name: 'Welcome PyLab',
    description: 'Starter workspace demonstrating real local Python 3.11 execution, JSON, and SQLite.',
    template: 'basic',
    mainFile: 'main.py',
    pythonVersion: '3.11',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(projDir, 'pylab.project.json'), JSON.stringify(meta, null, 2), 'utf-8');

  fs.writeFileSync(
    path.join(projDir, 'main.py'),
    `import sys
import json
import sqlite3

def greet(name: str) -> str:
    return f"Welcome to PyLab Studio, {name}!"

def main():
    print(greet("Developer"))
    print("Python Executable:", sys.executable)
    print("Python Version:", sys.version.split()[0])

    # JSON test
    payload = {"ide": "PyLab Studio", "local_runtime": True, "modules": ["json", "sqlite3"]}
    print("JSON Output:", json.dumps(payload, ensure_ascii=False))

    # SQLite local test
    conn = sqlite3.connect("local_demo.db")
    conn.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT)")
    conn.execute("DELETE FROM notes")
    conn.execute("INSERT INTO notes (title) VALUES (?)", ("Local Python 3.11 + SQLite Ready",))
    conn.commit()
    rows = conn.execute("SELECT id, title FROM notes").fetchall()
    conn.close()
    print("SQLite Rows:", rows)

if __name__ == "__main__":
    main()
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(projDir, 'requirements.txt'),
    `# Add pip dependencies here, e.g.:\n# requests\n# flask\n`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(projDir, 'README.md'),
    `# Welcome PyLab\n\nThis project runs locally using Python 3.11 in PyLab Studio.\n`,
    'utf-8'
  );
}

export function sanitizeId(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `project-${Date.now()}`;
}

export function resolveProjectDir(projectId: string): string {
  const safe = path.basename(projectId);
  const resolved = path.resolve(PROJECTS_DIR, safe);
  if (!resolved.startsWith(PROJECTS_DIR + path.sep)) {
    throw new Error('Invalid project path');
  }
  return resolved;
}

export function resolveProjectFile(projectId: string, relPath: string): string {
  const projDir = resolveProjectDir(projectId);
  const cleanedRel = relPath.replace(/^[/\\]+/, '');
  const resolved = path.resolve(projDir, cleanedRel);
  if (resolved !== projDir && !resolved.startsWith(projDir + path.sep)) {
    throw new Error('Path traversal outside project directory is blocked');
  }
  return resolved;
}

function calcDirStats(dirPath: string): { fileCount: number; sizeBytes: number } {
  let fileCount = 0;
  let sizeBytes = 0;
  if (!fs.existsSync(dirPath)) return { fileCount, sizeBytes };
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '__pycache__' || entry.name === '.git') continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const sub = calcDirStats(full);
      fileCount += sub.fileCount;
      sizeBytes += sub.sizeBytes;
    } else if (entry.isFile()) {
      fileCount += 1;
      sizeBytes += fs.statSync(full).size;
    }
  }
  return { fileCount, sizeBytes };
}

export function listProjects(): ProjectMeta[] {
  ensureWorkspaceInitialized();
  const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  const list: ProjectMeta[] = [];

  for (const d of dirs) {
    const projDir = path.join(PROJECTS_DIR, d.name);
    const metaPath = path.join(projDir, 'pylab.project.json');
    let meta: Record<string, string> = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch {
        meta = {};
      }
    }
    const stat = fs.statSync(projDir);
    const stats = calcDirStats(projDir);
    list.push({
      id: d.name,
      name: meta.name || d.name,
      description: meta.description || 'Local Python project',
      template: meta.template || 'basic',
      mainFile: meta.mainFile || 'main.py',
      pythonVersion: meta.pythonVersion || '3.11',
      createdAt: meta.createdAt || stat.birthtime.toISOString(),
      updatedAt: meta.updatedAt || stat.mtime.toISOString(),
      path: projDir,
      fileCount: stats.fileCount,
      sizeBytes: stats.sizeBytes,
    });
  }

  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function buildFileTree(projectId: string, relDir = ''): FileNode[] {
  const projDir = resolveProjectDir(projectId);
  const targetDir = relDir ? resolveProjectFile(projectId, relDir) : projDir;
  if (!fs.existsSync(targetDir)) return [];

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name === '__pycache__' || entry.name === 'pylab.project.json') continue;
    const full = path.join(targetDir, entry.name);
    const rel = path.relative(projDir, full).replace(/\\/g, '/');
    const st = fs.statSync(full);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: rel,
        type: 'directory',
        size: 0,
        extension: '',
        modifiedAt: st.mtime.toISOString(),
        children: buildFileTree(projectId, rel),
      });
    } else if (entry.isFile()) {
      nodes.push({
        name: entry.name,
        path: rel,
        type: 'file',
        size: st.size,
        extension: path.extname(entry.name).toLowerCase(),
        modifiedAt: st.mtime.toISOString(),
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function createProject(opts: {
  name: string;
  description?: string;
  template?: string;
  mainFile?: string;
  pythonVersion?: string;
  files?: Record<string, string>;
}): ProjectMeta {
  ensureWorkspaceInitialized();
  let id = sanitizeId(opts.name);
  let candidate = path.join(PROJECTS_DIR, id);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    id = `${sanitizeId(opts.name)}-${suffix++}`;
    candidate = path.join(PROJECTS_DIR, id);
  }
  fs.mkdirSync(candidate, { recursive: true });

  const now = new Date().toISOString();
  const mainFile = opts.mainFile || 'main.py';
  const meta = {
    id,
    name: opts.name.trim() || id,
    description: opts.description || '',
    template: opts.template || 'basic',
    mainFile,
    pythonVersion: opts.pythonVersion || '3.11',
    createdAt: now,
    updatedAt: now,
  };
  fs.writeFileSync(path.join(candidate, 'pylab.project.json'), JSON.stringify(meta, null, 2), 'utf-8');

  const filesToWrite = opts.files && Object.keys(opts.files).length > 0
    ? opts.files
    : {
        [mainFile]: `# ${meta.name}\n\ndef main():\n    print("Hello from ${meta.name}!")\n\nif __name__ == "__main__":\n    main()\n`,
        'requirements.txt': '',
      };

  for (const [relPath, content] of Object.entries(filesToWrite)) {
    const dest = resolveProjectFile(id, relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, 'utf-8');
  }

  const stats = calcDirStats(candidate);
  return {
    ...meta,
    path: candidate,
    fileCount: stats.fileCount,
    sizeBytes: stats.sizeBytes,
  };
}

export function updateProjectMeta(
  projectId: string,
  updates: Partial<{ name: string; description: string; mainFile: string; pythonVersion: string }>
): ProjectMeta {
  const projDir = resolveProjectDir(projectId);
  if (!fs.existsSync(projDir)) throw new Error('Project not found');
  const metaPath = path.join(projDir, 'pylab.project.json');
  let meta: Record<string, string> = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
  const merged: Record<string, string> = {
    ...meta,
    ...updates,
    id: projectId,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaPath, JSON.stringify(merged, null, 2), 'utf-8');
  const stats = calcDirStats(projDir);
  return {
    id: projectId,
    name: merged.name || projectId,
    description: merged.description || '',
    template: merged.template || 'basic',
    mainFile: merged.mainFile || 'main.py',
    pythonVersion: merged.pythonVersion || '3.11',
    createdAt: merged.createdAt || new Date().toISOString(),
    updatedAt: merged.updatedAt,
    path: projDir,
    fileCount: stats.fileCount,
    sizeBytes: stats.sizeBytes,
  };
}

export function duplicateProject(projectId: string, newName: string): ProjectMeta {
  const srcDir = resolveProjectDir(projectId);
  if (!fs.existsSync(srcDir)) throw new Error('Source project not found');
  let newId = sanitizeId(newName);
  let destDir = path.join(PROJECTS_DIR, newId);
  let idx = 1;
  while (fs.existsSync(destDir)) {
    newId = `${sanitizeId(newName)}-${idx++}`;
    destDir = path.join(PROJECTS_DIR, newId);
  }
  fs.cpSync(srcDir, destDir, { recursive: true });
  return updateProjectMeta(newId, { name: newName });
}

export function deleteProject(projectId: string): void {
  const projDir = resolveProjectDir(projectId);
  if (fs.existsSync(projDir)) {
    fs.rmSync(projDir, { recursive: true, force: true });
  }
}

export function getStorageSummary(): {
  projectsBytes: number;
  packagesBytes: number;
  tmpBytes: number;
  totalBytes: number;
  projectCount: number;
} {
  ensureWorkspaceInitialized();
  const projects = listProjects();
  const projectsBytes = projects.reduce((acc, p) => acc + p.sizeBytes, 0);
  const packagesBytes = calcDirStats(PACKAGES_DIR).sizeBytes;
  const tmpBytes = calcDirStats(TMP_DIR).sizeBytes;
  return {
    projectsBytes,
    packagesBytes,
    tmpBytes,
    totalBytes: projectsBytes + packagesBytes + tmpBytes,
    projectCount: projects.length,
  };
}

export async function sqliteCall<T = unknown>(op: string, arg?: string, stdinJson?: unknown): Promise<T> {
  ensureWorkspaceInitialized();
  const script = path.join(PYTHON_SCRIPTS_DIR, 'pylab_sqlite.py');
  const args = [script, DB_PATH, op];
  if (arg !== undefined) args.push(arg);

  return new Promise((resolve, reject) => {
    const child = execFile('python3', args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        resolve(JSON.parse(stdout) as T);
      } catch (e) {
        reject(new Error(`Invalid SQLite helper response: ${stdout}`));
      }
    });
    if (stdinJson !== undefined && child.stdin) {
      child.stdin.write(JSON.stringify(stdinJson));
      child.stdin.end();
    }
  });
}
