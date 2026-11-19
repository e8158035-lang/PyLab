import { spawn, execFile, type ChildProcessWithoutNullStreams } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import {
  PACKAGES_DIR,
  TMP_DIR,
  resolveProjectDir,
  resolveProjectFile,
  sqliteCall,
} from './workspace.ts';

const execFileAsync = promisify(execFile);

export interface RuntimeInfo {
  pythonVersion: string;
  executable: string;
  platform: string;
  sysPath: string[];
  packagesDir: string;
  stdlibModules: string[];
  envVars: Record<string, string>;
}

interface RunningProcess {
  runId: string;
  projectId: string;
  filePath: string;
  child: ChildProcessWithoutNullStreams;
  startedAt: number;
  listeners: Set<Response>;
  logs: Array<{ type: string; data: unknown }>;
  finished: boolean;
  outputPreview: string;
}

const activeRuns = new Map<string, RunningProcess>();

export function buildPythonEnv(customEnv: Record<string, string> = {}): NodeJS.ProcessEnv {
  const existingPyPath = customEnv.PYTHONPATH || process.env.PYTHONPATH || '';
  const pyPath = existingPyPath ? `${PACKAGES_DIR}${path.delimiter}${existingPyPath}` : PACKAGES_DIR;
  return {
    ...process.env,
    ...customEnv,
    PYTHONPATH: pyPath,
    PYTHONUNBUFFERED: '1',
    PYTHONIOENCODING: 'utf-8',
  };
}

export async function getRuntimeInfo(customEnv: Record<string, string> = {}): Promise<RuntimeInfo> {
  const script = `
import sys, json, platform
stdlib = sorted([m for m in getattr(sys, "stdlib_module_names", []) if not m.startswith("_")])
print(json.dumps({
    "pythonVersion": sys.version.split()[0],
    "fullVersion": sys.version,
    "executable": sys.executable,
    "platform": platform.platform(),
    "sysPath": sys.path,
    "stdlibModules": stdlib[:200],
}))
`;
  const { stdout } = await execFileAsync('python3', ['-c', script], {
    env: buildPythonEnv(customEnv),
  });
  const parsed = JSON.parse(stdout);
  return {
    pythonVersion: parsed.pythonVersion,
    executable: parsed.executable,
    platform: parsed.platform,
    sysPath: parsed.sysPath,
    packagesDir: PACKAGES_DIR,
    stdlibModules: parsed.stdlibModules,
    envVars: {
      PYTHONPATH: buildPythonEnv(customEnv).PYTHONPATH || PACKAGES_DIR,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
      ...customEnv,
    },
  };
}

export async function runRuntimeDiagnostics(): Promise<{
  ok: boolean;
  pythonVersion: string;
  tests: Array<{ name: string; passed: boolean; output: string; durationMs: number }>;
}> {
  const testsSpec = [
    {
      name: 'Hello World',
      code: 'print("Hello World")',
      expected: 'Hello World',
    },
    {
      name: 'Loop Range (0..9)',
      code: 'for i in range(10):\n    print(i)',
      expected: '9',
    },
    {
      name: 'Function Calculation',
      code: 'def calculate(a, b):\n    return a + b\nprint(calculate(10, 20))',
      expected: '30',
    },
    {
      name: 'JSON Serialization',
      code: 'import json\ndata = {"name": "PyLab Studio"}\nprint(json.dumps(data))',
      expected: '"PyLab Studio"',
    },
    {
      name: 'SQLite3 Database',
      code: `import sqlite3, tempfile, os
p = os.path.join(tempfile.gettempdir(), "pylab_diag.db")
db = sqlite3.connect(p)
db.execute("CREATE TABLE IF NOT EXISTS users (name TEXT)")
db.execute("DELETE FROM users")
db.execute("INSERT INTO users VALUES (?)", ("Ahmed",))
db.commit()
print(db.execute("SELECT * FROM users").fetchall())
db.close()`,
      expected: "('Ahmed',)",
    },
  ];

  const results = [];
  let allOk = true;
  for (const t of testsSpec) {
    const start = Date.now();
    try {
      const { stdout, stderr } = await execFileAsync('python3', ['-c', t.code], {
        env: buildPythonEnv(),
        timeout: 8000,
      });
      const out = (stdout + stderr).trim();
      const passed = out.includes(t.expected);
      if (!passed) allOk = false;
      results.push({ name: t.name, passed, output: out, durationMs: Date.now() - start });
    } catch (err: unknown) {
      allOk = false;
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name: t.name, passed: false, output: msg, durationMs: Date.now() - start });
    }
  }

  const info = await getRuntimeInfo();
  return { ok: allOk, pythonVersion: info.pythonVersion, tests: results };
}

function broadcastEvent(run: RunningProcess, type: string, data: unknown): void {
  const entry = { type, data };
  run.logs.push(entry);
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of run.listeners) {
    res.write(payload);
  }
}

export function startPythonRun(opts: {
  projectId: string;
  filePath?: string;
  code?: string;
  customEnv?: Record<string, string>;
}): { runId: string; startedAt: string } {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const projDir = opts.projectId === '__scratch__' ? TMP_DIR : resolveProjectDir(opts.projectId);
  fs.mkdirSync(projDir, { recursive: true });

  let targetFile: string;
  let tempScratch = false;
  if (opts.filePath && opts.projectId !== '__scratch__') {
    targetFile = resolveProjectFile(opts.projectId, opts.filePath);
    if (opts.code !== undefined) {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, opts.code, 'utf-8');
    }
  } else {
    tempScratch = true;
    targetFile = path.join(TMP_DIR, `${runId}.py`);
    fs.writeFileSync(targetFile, opts.code || '', 'utf-8');
  }

  const env = buildPythonEnv(opts.customEnv);
  env.PYTHONPATH = `${projDir}${path.delimiter}${env.PYTHONPATH || PACKAGES_DIR}`;

  const child = spawn('python3', ['-u', targetFile], {
    cwd: projDir,
    env,
  });

  const startedAtMs = Date.now();
  const startedAtIso = new Date(startedAtMs).toISOString();

  const run: RunningProcess = {
    runId,
    projectId: opts.projectId,
    filePath: opts.filePath || 'playground.py',
    child,
    startedAt: startedAtMs,
    listeners: new Set(),
    logs: [],
    finished: false,
    outputPreview: '',
  };
  activeRuns.set(runId, run);

  broadcastEvent(run, 'started', {
    runId,
    filePath: run.filePath,
    startedAt: startedAtIso,
  });

  child.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString('utf-8');
    run.outputPreview = (run.outputPreview + text).slice(0, 500);
    broadcastEvent(run, 'stdout', { text });
  });

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString('utf-8');
    run.outputPreview = (run.outputPreview + text).slice(0, 500);
    broadcastEvent(run, 'stderr', { text });
  });

  child.on('close', (code, signal) => {
    run.finished = true;
    const endedAtMs = Date.now();
    const durationMs = endedAtMs - startedAtMs;
    const status = signal ? 'stopped' : code === 0 ? 'success' : 'error';

    if (tempScratch && fs.existsSync(targetFile)) {
      try {
        fs.unlinkSync(targetFile);
      } catch {
        // ignore cleanup error
      }
    }

    broadcastEvent(run, 'exit', {
      exitCode: code,
      signal,
      status,
      endedAt: new Date(endedAtMs).toISOString(),
      durationMs,
    });

    sqliteCall('exec_add', undefined, {
      id: runId,
      projectId: run.projectId,
      filePath: run.filePath,
      status,
      exitCode: code ?? -1,
      durationMs,
      startedAt: startedAtIso,
      outputPreview: run.outputPreview,
    }).catch(() => {});

    for (const res of run.listeners) {
      res.end();
    }
    run.listeners.clear();

    setTimeout(() => {
      activeRuns.delete(runId);
    }, 60_000);
  });

  return { runId, startedAt: startedAtIso };
}

export function attachRunStream(runId: string, res: Response): boolean {
  const run = activeRuns.get(runId);
  if (!run) return false;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  for (const item of run.logs) {
    res.write(`event: ${item.type}\ndata: ${JSON.stringify(item.data)}\n\n`);
  }

  if (run.finished) {
    res.end();
    return true;
  }

  run.listeners.add(res);
  res.on('close', () => {
    run.listeners.delete(res);
  });
  return true;
}

export function sendRunInput(runId: string, input: string): boolean {
  const run = activeRuns.get(runId);
  if (!run || run.finished) return false;
  run.child.stdin.write(input + '\n');
  broadcastEvent(run, 'stdin', { text: input + '\n' });
  return true;
}

export function stopRun(runId: string): boolean {
  const run = activeRuns.get(runId);
  if (!run || run.finished) return false;
  run.child.kill('SIGTERM');
  setTimeout(() => {
    if (!run.finished) {
      run.child.kill('SIGKILL');
    }
  }, 1500);
  return true;
}

export async function runInlineSync(
  code: string,
  stdinText = '',
  projectId?: string
): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
  const start = Date.now();
  const cwd = projectId ? resolveProjectDir(projectId) : TMP_DIR;
  return new Promise((resolve) => {
    const env = buildPythonEnv();
    env.PYTHONPATH = `${cwd}${path.delimiter}${env.PYTHONPATH || PACKAGES_DIR}`;
    const child = spawn('python3', ['-c', code], { cwd, env });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      stderr += '\nExecution timed out after 10s.';
    }, 10000);

    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString('utf-8');
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString('utf-8');
    });
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? 1,
        durationMs: Date.now() - start,
      });
    });

    if (stdinText) {
      child.stdin.write(stdinText);
    }
    child.stdin.end();
  });
}
