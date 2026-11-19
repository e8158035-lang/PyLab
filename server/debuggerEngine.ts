import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import { PACKAGES_DIR, PYTHON_SCRIPTS_DIR, resolveProjectDir, resolveProjectFile } from './workspace.ts';
import { buildPythonEnv } from './pythonEngine.ts';

interface DebugSession {
  debugId: string;
  projectId: string;
  filePath: string;
  child: ChildProcessWithoutNullStreams;
  listeners: Set<Response>;
  events: Array<{ type: string; data: unknown }>;
  finished: boolean;
}

const debugSessions = new Map<string, DebugSession>();

function emitDebug(session: DebugSession, type: string, data: unknown): void {
  session.events.push({ type, data });
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of session.listeners) {
    res.write(payload);
  }
}

export function startDebugSession(opts: {
  projectId: string;
  filePath: string;
  code?: string;
  breakpoints: number[];
}): { debugId: string } {
  const debugId = `dbg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const projDir = resolveProjectDir(opts.projectId);
  const targetFile = resolveProjectFile(opts.projectId, opts.filePath);

  if (opts.code !== undefined) {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, opts.code, 'utf-8');
  }

  const dbgScript = path.join(PYTHON_SCRIPTS_DIR, 'pylab_debugger.py');
  const env = buildPythonEnv();
  env.PYTHONPATH = `${projDir}${path.delimiter}${env.PYTHONPATH || PACKAGES_DIR}`;

  const bps = opts.breakpoints.length > 0 ? opts.breakpoints : [1];
  const child = spawn('python3', ['-u', dbgScript, targetFile, JSON.stringify(bps)], {
    cwd: projDir,
    env,
  });

  const session: DebugSession = {
    debugId,
    projectId: opts.projectId,
    filePath: opts.filePath,
    child,
    listeners: new Set(),
    events: [],
    finished: false,
  };
  debugSessions.set(debugId, session);

  let buffer = '';
  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf-8');
    let nl = buffer.indexOf('\n');
    while (nl !== -1) {
      const line = buffer.slice(0, nl).trimEnd();
      buffer = buffer.slice(nl + 1);
      if (line.startsWith('__PYLAB_DBG__:')) {
        try {
          const parsed = JSON.parse(line.slice('__PYLAB_DBG__:'.length));
          const evType = parsed.event || 'info';
          emitDebug(session, evType, parsed);
        } catch {
          emitDebug(session, 'output', { stream: 'stdout', text: line + '\n' });
        }
      } else if (line.length > 0) {
        emitDebug(session, 'output', { stream: 'stdout', text: line + '\n' });
      }
      nl = buffer.indexOf('\n');
    }
  });

  child.stderr.on('data', (chunk: Buffer) => {
    emitDebug(session, 'output', { stream: 'stderr', text: chunk.toString('utf-8') });
  });

  child.on('close', (code) => {
    session.finished = true;
    emitDebug(session, 'closed', { exitCode: code ?? 0 });
    for (const res of session.listeners) {
      res.end();
    }
    session.listeners.clear();
    setTimeout(() => debugSessions.delete(debugId), 60_000);
  });

  return { debugId };
}

export function attachDebugStream(debugId: string, res: Response): boolean {
  const session = debugSessions.get(debugId);
  if (!session) return false;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  for (const ev of session.events) {
    res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev.data)}\n\n`);
  }

  if (session.finished) {
    res.end();
    return true;
  }

  session.listeners.add(res);
  res.on('close', () => {
    session.listeners.delete(res);
  });
  return true;
}

export function sendDebugCommand(
  debugId: string,
  action: 'continue' | 'step_into' | 'step_over' | 'step_out' | 'pause' | 'stop' | 'set_breakpoints',
  lines?: number[]
): boolean {
  const session = debugSessions.get(debugId);
  if (!session || session.finished) return false;
  if (action === 'stop') {
    session.child.stdin.write(JSON.stringify({ action: 'stop' }) + '\n');
    setTimeout(() => {
      if (!session.finished) session.child.kill('SIGTERM');
    }, 500);
    return true;
  }
  session.child.stdin.write(JSON.stringify({ action, lines }) + '\n');
  return true;
}
