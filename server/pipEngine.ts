import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { PACKAGES_DIR, PYTHON_SCRIPTS_DIR, resolveProjectFile, sqliteCall } from './workspace.ts';

const execFileAsync = promisify(execFile);

export interface PackageCatalogEntry {
  name: string;
  description: string;
  category: string;
  compatibility: 'compatible' | 'partial' | 'requires_setup' | 'incompatible';
  compatibilityNote: string;
}

export const CURATED_PYPI_CATALOG: PackageCatalogEntry[] = [
  {
    name: 'requests',
    description: 'Elegant and simple HTTP library for Python.',
    category: 'Networking',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel (py3-none-any). Works offline once installed.',
  },
  {
    name: 'flask',
    description: 'Lightweight WSGI web application framework.',
    category: 'Web Frameworks',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheels (Flask, Werkzeug, Jinja2, Click, Blinker, MarkupSafe).',
  },
  {
    name: 'fastapi',
    description: 'Modern, fast web framework for building APIs with Python type hints.',
    category: 'Web Frameworks',
    compatibility: 'partial',
    compatibilityNote: 'Starlette is pure Python; Pydantic v2 requires compiled pydantic-core wheel on target CPU.',
  },
  {
    name: 'starlette',
    description: 'Lightweight ASGI framework/toolkit used by FastAPI.',
    category: 'Web Frameworks',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel (py3-none-any).',
  },
  {
    name: 'uvicorn',
    description: 'Lightning-fast ASGI server implementation.',
    category: 'Web Frameworks',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel (h11 + click).',
  },
  {
    name: 'beautifulsoup4',
    description: 'Screen-scraping and HTML/XML parsing library.',
    category: 'Web Scraping',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel (uses stdlib html.parser).',
  },
  {
    name: 'sympy',
    description: 'Computer algebra system (CAS) for symbolic mathematics.',
    category: 'Scientific',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel (sympy + mpmath).',
  },
  {
    name: 'python-dateutil',
    description: 'Powerful extensions to the standard datetime module.',
    category: 'Utilities',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel.',
  },
  {
    name: 'pyyaml',
    description: 'YAML parser and emitter for Python.',
    category: 'Data',
    compatibility: 'partial',
    compatibilityNote: 'Includes pure-Python fallback or native C wheel depending on platform.',
  },
  {
    name: 'openpyxl',
    description: 'Read/write Excel 2010 xlsx/xlsm files.',
    category: 'Data',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel.',
  },
  {
    name: 'pytest',
    description: 'Full-featured Python testing tool.',
    category: 'Testing',
    compatibility: 'compatible',
    compatibilityNote: 'Pure Python wheel.',
  },
  {
    name: 'numpy',
    description: 'Fundamental package for scientific computing with arrays.',
    category: 'Scientific',
    compatibility: 'requires_setup',
    compatibilityNote: 'Contains C/Fortran extensions; requires Chaquopy/manylinux native wheel.',
  },
  {
    name: 'pandas',
    description: 'Powerful data structures for data analysis and time series.',
    category: 'Scientific',
    compatibility: 'requires_setup',
    compatibilityNote: 'Depends on NumPy/Cython native C extensions; requires prebuilt native wheels.',
  },
  {
    name: 'pillow',
    description: 'Python Imaging Library (fork) for image processing.',
    category: 'Media',
    compatibility: 'requires_setup',
    compatibilityNote: 'Requires native C libraries (libjpeg/zlib) on Android Chaquopy.',
  },
  {
    name: 'matplotlib',
    description: 'Comprehensive library for creating static and interactive visualizations.',
    category: 'Scientific',
    compatibility: 'requires_setup',
    compatibilityNote: 'Requires native C++ extensions and GUI/Agg backend.',
  },
];

async function runPipScript(args: string[]): Promise<Record<string, unknown>> {
  fs.mkdirSync(PACKAGES_DIR, { recursive: true });
  const script = path.join(PYTHON_SCRIPTS_DIR, 'pylab_pip.py');
  const { stdout, stderr } = await execFileAsync('python3', [script, PACKAGES_DIR, ...args], {
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
  });
  try {
    return JSON.parse(stdout);
  } catch {
    return { ok: false, error: stderr || stdout || 'Unknown pip output' };
  }
}

export async function listInstalledPackages() {
  return runPipScript(['list']);
}

export async function freezePackages() {
  return runPipScript(['freeze']);
}

export async function checkPackages() {
  return runPipScript(['check']);
}

export async function showPackage(name: string) {
  return runPipScript(['show', name]);
}

export async function inspectPyPiPackage(name: string) {
  return runPipScript(['inspect', name]);
}

export async function installPackage(spec: string, upgrade = false) {
  const args = ['install'];
  if (upgrade) args.push('--upgrade');
  args.push(spec);
  const result = await runPipScript(args);
  const logs = Array.isArray(result.logs) ? (result.logs as string[]).join('\n') : String(result.error || '');

  sqliteCall('pkg_log_add', undefined, {
    id: `pkg_${Date.now()}`,
    action: upgrade ? 'upgrade' : 'install',
    packageName: spec,
    status: result.ok ? 'success' : 'error',
    logText: logs,
  }).catch(() => {});

  return result;
}

export async function uninstallPackage(name: string) {
  const result = await runPipScript(['uninstall', name]);
  const logs = Array.isArray(result.logs) ? (result.logs as string[]).join('\n') : String(result.error || '');

  sqliteCall('pkg_log_add', undefined, {
    id: `pkg_${Date.now()}`,
    action: 'uninstall',
    packageName: name,
    status: result.ok ? 'success' : 'error',
    logText: logs,
  }).catch(() => {});

  return result;
}

export async function parseRequirementsStatus(projectId: string) {
  const reqPath = resolveProjectFile(projectId, 'requirements.txt');
  const content = fs.existsSync(reqPath) ? fs.readFileSync(reqPath, 'utf-8') : '';
  const installedRes = await listInstalledPackages();
  const installedList = (installedRes.packages as Array<{ name: string; normalized: string; version: string }>) || [];
  const installedMap = new Map(installedList.map((p) => [p.normalized, p]));

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const dependencies = lines.map((line) => {
    const m = line.match(/^([A-Za-z0-9._-]+)(?:([=<>!~]+)(.+))?/);
    const name = m ? m[1] : line;
    const norm = name.toLowerCase().replace(/[-_.]+/g, '-');
    const inst = installedMap.get(norm);
    return {
      spec: line,
      name,
      requiredVersion: m && m[3] ? `${m[2]}${m[3]}` : 'any',
      installed: Boolean(inst),
      installedVersion: inst ? inst.version : null,
    };
  });

  return { content, dependencies };
}

export async function installRequirements(projectId: string) {
  const { dependencies } = await parseRequirementsStatus(projectId);
  const logs: string[] = [];
  let allOk = true;
  for (const dep of dependencies) {
    if (!dep.installed) {
      const res = await installPackage(dep.spec, false);
      if (Array.isArray(res.logs)) logs.push(...(res.logs as string[]));
      if (!res.ok) allOk = false;
    } else {
      logs.push(`Already satisfied: ${dep.name}==${dep.installedVersion}`);
    }
  }
  if (dependencies.length === 0) {
    logs.push('No packages listed in requirements.txt.');
  }
  return { ok: allOk, logs };
}
