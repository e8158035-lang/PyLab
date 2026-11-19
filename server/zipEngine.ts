import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { PYTHON_SCRIPTS_DIR, TMP_DIR, resolveProjectDir, createProject } from './workspace.ts';

const execFileAsync = promisify(execFile);

export async function inspectZipBase64(base64Data: string) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const tmpPath = path.join(TMP_DIR, `inspect_${Date.now()}.zip`);
  fs.writeFileSync(tmpPath, Buffer.from(base64Data, 'base64'));
  try {
    const script = path.join(PYTHON_SCRIPTS_DIR, 'pylab_zip.py');
    const { stdout } = await execFileAsync('python3', [script, 'inspect', tmpPath]);
    return JSON.parse(stdout);
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

export async function importZipToProject(opts: {
  projectName: string;
  base64Data: string;
}) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const tmpPath = path.join(TMP_DIR, `import_${Date.now()}.zip`);
  fs.writeFileSync(tmpPath, Buffer.from(opts.base64Data, 'base64'));

  const proj = createProject({
    name: opts.projectName,
    description: 'Imported from ZIP archive',
    template: 'imported',
    files: {},
  });

  try {
    const script = path.join(PYTHON_SCRIPTS_DIR, 'pylab_zip.py');
    const { stdout } = await execFileAsync('python3', [script, 'extract', tmpPath, proj.path]);
    const res = JSON.parse(stdout);
    if (!res.ok) {
      fs.rmSync(proj.path, { recursive: true, force: true });
      return res;
    }
    return { ok: true, project: proj, extracted: res.extracted, count: res.count };
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

export async function exportProjectToZipBuffer(projectId: string, excludeTemp = true): Promise<Buffer> {
  const projDir = resolveProjectDir(projectId);
  if (!fs.existsSync(projDir)) throw new Error('Project not found');
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const outZip = path.join(TMP_DIR, `${projectId}_${Date.now()}.zip`);
  const script = path.join(PYTHON_SCRIPTS_DIR, 'pylab_zip.py');

  try {
    const { stdout } = await execFileAsync('python3', [
      script,
      'export',
      projDir,
      outZip,
      excludeTemp ? 'true' : 'false',
    ]);
    const res = JSON.parse(stdout);
    if (!res.ok) throw new Error(res.error || 'Export failed');
    return fs.readFileSync(outZip);
  } finally {
    if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  }
}
