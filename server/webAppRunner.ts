import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { PACKAGES_DIR, resolveProjectDir, resolveProjectFile } from './workspace.ts';
import { buildPythonEnv } from './pythonEngine.ts';

export interface WebServerInstance {
  serverId: string;
  projectId: string;
  projectName: string;
  framework: 'flask' | 'fastapi' | 'http';
  entryFile: string;
  host: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startedAt: string;
  logs: string[];
  previewUrl: string;
}

interface InternalServer extends WebServerInstance {
  child: ChildProcessWithoutNullStreams;
}

const activeServers = new Map<string, InternalServer>();

function isPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, host);
  });
}

export async function findAvailablePort(preferred = 5200): Promise<number> {
  for (let p = preferred; p < 5299; p++) {
    const usedByUs = Array.from(activeServers.values()).some((s) => s.status === 'running' && s.port === p);
    if (!usedByUs && (await isPortAvailable(p))) {
      return p;
    }
  }
  throw new Error('No available local ports between 5200 and 5299');
}

export async function startWebAppServer(opts: {
  projectId: string;
  projectName: string;
  entryFile: string;
  framework: 'flask' | 'fastapi' | 'http';
  port?: number;
  host?: string;
}): Promise<WebServerInstance> {
  const projDir = resolveProjectDir(opts.projectId);
  const fullEntry = resolveProjectFile(opts.projectId, opts.entryFile);
  if (!fs.existsSync(fullEntry)) {
    throw new Error(`Entry file ${opts.entryFile} not found in project`);
  }

  const host = opts.host || '127.0.0.1';
  let port = opts.port || 5200;
  const free = await isPortAvailable(port, host);
  if (!free) {
    throw new Error(`Port conflict: port ${port} is already in use.`);
  }

  const serverId = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const env = buildPythonEnv({
    FLASK_RUN_PORT: String(port),
    FLASK_RUN_HOST: host,
    PORT: String(port),
    HOST: host,
    PYLAB_SERVER_PORT: String(port),
  });
  env.PYTHONPATH = `${projDir}${path.delimiter}${env.PYTHONPATH || PACKAGES_DIR}`;

  let spawnArgs: string[];
  if (opts.framework === 'fastapi') {
    const modName = opts.entryFile.replace(/\.py$/, '').replace(/[/\\]/g, '.');
    spawnArgs = ['-m', 'uvicorn', `${modName}:app`, '--host', host, '--port', String(port)];
  } else {
    spawnArgs = ['-u', fullEntry];
  }

  const child = spawn('python3', spawnArgs, {
    cwd: projDir,
    env,
  });

  const instance: InternalServer = {
    serverId,
    projectId: opts.projectId,
    projectName: opts.projectName,
    framework: opts.framework,
    entryFile: opts.entryFile,
    host,
    port,
    status: 'running',
    startedAt: new Date().toISOString(),
    logs: [`[${new Date().toLocaleTimeString()}] Starting ${opts.framework} server on http://${host}:${port} ...`],
    previewUrl: `/preview/${serverId}/`,
    child,
  };

  activeServers.set(serverId, instance);

  const appendLog = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    instance.logs.push(...lines);
    if (instance.logs.length > 300) {
      instance.logs.splice(0, instance.logs.length - 300);
    }
  };

  child.stdout.on('data', (d: Buffer) => appendLog(d.toString('utf-8')));
  child.stderr.on('data', (d: Buffer) => appendLog(d.toString('utf-8')));
  child.on('close', (code) => {
    if (instance.status !== 'stopped') {
      instance.status = code === 0 ? 'stopped' : 'error';
      appendLog(`[Server exited with code ${code}]`);
    }
  });

  // Wait briefly to see if startup crashed immediately
  await new Promise((r) => setTimeout(r, 700));
  return sanitizeServer(instance);
}

function sanitizeServer(s: InternalServer): WebServerInstance {
  return {
    serverId: s.serverId,
    projectId: s.projectId,
    projectName: s.projectName,
    framework: s.framework,
    entryFile: s.entryFile,
    host: s.host,
    port: s.port,
    status: s.status,
    startedAt: s.startedAt,
    logs: s.logs,
    previewUrl: s.previewUrl,
  };
}

export function listWebAppServers(): WebServerInstance[] {
  return Array.from(activeServers.values()).map(sanitizeServer);
}

export function getWebAppServer(serverId: string): WebServerInstance | undefined {
  const srv = activeServers.get(serverId);
  return srv ? sanitizeServer(srv) : undefined;
}

export function stopWebAppServer(serverId: string): boolean {
  const srv = activeServers.get(serverId);
  if (!srv) return false;
  srv.status = 'stopped';
  srv.logs.push(`[${new Date().toLocaleTimeString()}] Server stopped by user.`);
  srv.child.kill('SIGTERM');
  setTimeout(() => {
    if (!srv.child.killed) srv.child.kill('SIGKILL');
  }, 1000);
  return true;
}
