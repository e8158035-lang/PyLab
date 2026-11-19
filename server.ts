import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  ensureWorkspaceInitialized,
  listProjects,
  createProject,
  updateProjectMeta,
  duplicateProject,
  deleteProject,
  buildFileTree,
  resolveProjectFile,
  resolveProjectDir,
  getStorageSummary,
  sqliteCall,
  TMP_DIR,
} from './server/workspace.ts';
import {
  getRuntimeInfo,
  runRuntimeDiagnostics,
  startPythonRun,
  attachRunStream,
  sendRunInput,
  stopRun,
  runInlineSync,
} from './server/pythonEngine.ts';
import {
  startDebugSession,
  attachDebugStream,
  sendDebugCommand,
} from './server/debuggerEngine.ts';
import {
  CURATED_PYPI_CATALOG,
  listInstalledPackages,
  installPackage,
  uninstallPackage,
  showPackage,
  inspectPyPiPackage,
  freezePackages,
  checkPackages,
  parseRequirementsStatus,
  installRequirements,
} from './server/pipEngine.ts';
import { executeTerminalCommand } from './server/terminalEngine.ts';
import {
  startWebAppServer,
  listWebAppServers,
  getWebAppServer,
  stopWebAppServer,
  findAvailablePort,
} from './server/webAppRunner.ts';
import {
  inspectZipBase64,
  importZipToProject,
  exportProjectToZipBuffer,
} from './server/zipEngine.ts';
import { generateAndroidSourceZip } from './server/androidScaffold.ts';

async function startServer() {
  ensureWorkspaceInitialized();

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==================== RUNTIME & EXECUTION ====================
  app.get('/api/runtime/info', async (_req, res) => {
    try {
      const kv = await sqliteCall<{ value: Record<string, string> | null }>('kv_get', 'custom_env');
      const info = await getRuntimeInfo(kv.value || {});
      res.json({ ok: true, ...info });
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/runtime/diagnostics', async (_req, res) => {
    try {
      const result = await runRuntimeDiagnostics();
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/runtime/run', async (req, res) => {
    try {
      const { projectId, filePath, code } = req.body as {
        projectId?: string;
        filePath?: string;
        code?: string;
      };
      const kv = await sqliteCall<{ value: Record<string, string> | null }>('kv_get', 'custom_env');
      const result = startPythonRun({
        projectId: projectId || '__scratch__',
        filePath,
        code,
        customEnv: kv.value || {},
      });
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/runtime/stream/:runId', (req, res) => {
    const ok = attachRunStream(req.params.runId, res);
    if (!ok) res.status(404).json({ ok: false, error: 'Run session not found' });
  });

  app.post('/api/runtime/input', (req, res) => {
    const { runId, input } = req.body as { runId: string; input: string };
    const ok = sendRunInput(runId, input ?? '');
    res.json({ ok });
  });

  app.post('/api/runtime/stop', (req, res) => {
    const { runId } = req.body as { runId: string };
    const ok = stopRun(runId);
    res.json({ ok });
  });

  app.post('/api/runtime/exec-inline', async (req, res) => {
    try {
      const { code, stdin, projectId } = req.body as {
        code: string;
        stdin?: string;
        projectId?: string;
      };
      const result = await runInlineSync(code || '', stdin || '', projectId);
      res.json({ ok: result.exitCode === 0, ...result });
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/runtime/history', async (_req, res) => {
    try {
      const result = await sqliteCall<{ ok: boolean; items: unknown[] }>('exec_list', '30');
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ==================== DEBUGGER ====================
  app.post('/api/debug/start', (req, res) => {
    try {
      const { projectId, filePath, code, breakpoints } = req.body as {
        projectId: string;
        filePath: string;
        code?: string;
        breakpoints?: number[];
      };
      const result = startDebugSession({
        projectId,
        filePath,
        code,
        breakpoints: Array.isArray(breakpoints) ? breakpoints : [],
      });
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/debug/stream/:debugId', (req, res) => {
    const ok = attachDebugStream(req.params.debugId, res);
    if (!ok) res.status(404).json({ ok: false, error: 'Debug session not found' });
  });

  app.post('/api/debug/command', (req, res) => {
    const { debugId, action, lines } = req.body as {
      debugId: string;
      action: 'continue' | 'step_into' | 'step_over' | 'step_out' | 'pause' | 'stop' | 'set_breakpoints';
      lines?: number[];
    };
    const ok = sendDebugCommand(debugId, action, lines);
    res.json({ ok });
  });

  // ==================== PROJECTS & FILES ====================
  app.get('/api/projects', (_req, res) => {
    res.json({ ok: true, projects: listProjects() });
  });

  app.post('/api/projects', (req, res) => {
    try {
      const project = createProject(req.body);
      res.json({ ok: true, project });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.patch('/api/projects/:id', (req, res) => {
    try {
      const project = updateProjectMeta(req.params.id, req.body);
      res.json({ ok: true, project });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/:id/duplicate', (req, res) => {
    try {
      const { name } = req.body as { name: string };
      const project = duplicateProject(req.params.id, name || `${req.params.id}-copy`);
      res.json({ ok: true, project });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    try {
      deleteProject(req.params.id);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/projects/:id/tree', (req, res) => {
    try {
      const tree = buildFileTree(req.params.id);
      res.json({ ok: true, tree });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/projects/:id/file', (req, res) => {
    try {
      const relPath = String(req.query.path || '');
      const full = resolveProjectFile(req.params.id, relPath);
      if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
        return res.status(404).json({ ok: false, error: 'File not found' });
      }
      const content = fs.readFileSync(full, 'utf-8');
      res.json({ ok: true, path: relPath, content });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put('/api/projects/:id/file', (req, res) => {
    try {
      const { path: relPath, content } = req.body as { path: string; content: string };
      const full = resolveProjectFile(req.params.id, relPath);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content ?? '', 'utf-8');
      updateProjectMeta(req.params.id, {});
      res.json({ ok: true, path: relPath });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/projects/:id/file', (req, res) => {
    try {
      const relPath = String(req.query.path || '');
      const full = resolveProjectFile(req.params.id, relPath);
      if (full === resolveProjectDir(req.params.id)) {
        return res.status(400).json({ ok: false, error: 'Cannot delete project root here' });
      }
      if (fs.existsSync(full)) {
        fs.rmSync(full, { recursive: true, force: true });
      }
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/:id/folder', (req, res) => {
    try {
      const { path: relPath } = req.body as { path: string };
      const full = resolveProjectFile(req.params.id, relPath);
      fs.mkdirSync(full, { recursive: true });
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/:id/rename', (req, res) => {
    try {
      const { oldPath, newPath } = req.body as { oldPath: string; newPath: string };
      const src = resolveProjectFile(req.params.id, oldPath);
      const dst = resolveProjectFile(req.params.id, newPath);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(src, dst);
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/:id/copy', (req, res) => {
    try {
      const { sourcePath, destPath } = req.body as { sourcePath: string; destPath: string };
      const src = resolveProjectFile(req.params.id, sourcePath);
      const dst = resolveProjectFile(req.params.id, destPath);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.cpSync(src, dst, { recursive: true });
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ==================== ZIP IMPORT / EXPORT ====================
  app.post('/api/projects/inspect-zip', async (req, res) => {
    try {
      const { base64 } = req.body as { base64: string };
      const result = await inspectZipBase64(base64);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/import-zip', async (req, res) => {
    try {
      const { projectName, base64 } = req.body as { projectName: string; base64: string };
      const result = await importZipToProject({ projectName: projectName || 'Imported Project', base64Data: base64 });
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/projects/:id/export-zip', async (req, res) => {
    try {
      const excludeTemp = req.query.excludeTemp !== 'false';
      const buf = await exportProjectToZipBuffer(req.params.id, excludeTemp);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.zip"`);
      res.send(buf);
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ==================== PACKAGES (REAL PIP) ====================
  app.get('/api/packages/catalog', (_req, res) => {
    res.json({ ok: true, catalog: CURATED_PYPI_CATALOG });
  });

  app.get('/api/packages/installed', async (_req, res) => {
    try {
      const result = await listInstalledPackages();
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/packages/install', async (req, res) => {
    try {
      const { name, upgrade } = req.body as { name: string; upgrade?: boolean };
      const result = await installPackage(name, Boolean(upgrade));
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/packages/uninstall', async (req, res) => {
    try {
      const { name } = req.body as { name: string };
      const result = await uninstallPackage(name);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/packages/show', async (req, res) => {
    try {
      const name = String(req.query.name || '');
      const result = await showPackage(name);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/packages/inspect', async (req, res) => {
    try {
      const name = String(req.query.name || '');
      const result = await inspectPyPiPackage(name);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/packages/freeze', async (_req, res) => {
    try {
      res.json(await freezePackages());
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/packages/check', async (_req, res) => {
    try {
      res.json(await checkPackages());
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/packages/logs', async (_req, res) => {
    try {
      res.json(await sqliteCall('pkg_log_list'));
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/projects/:id/requirements', async (req, res) => {
    try {
      const status = await parseRequirementsStatus(req.params.id);
      res.json({ ok: true, ...status });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/projects/:id/requirements/install', async (req, res) => {
    try {
      const result = await installRequirements(req.params.id);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ==================== TERMINAL ====================
  app.post('/api/terminal/exec', async (req, res) => {
    try {
      const { sessionId, projectId, command } = req.body as {
        sessionId: string;
        projectId?: string;
        command: string;
      };
      const result = await executeTerminalCommand({
        sessionId: sessionId || 'default',
        projectId,
        command: command || '',
      });
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ==================== PYTHON WEB SERVERS (FLASK / FASTAPI / HTTP) ====================
  app.get('/api/servers', (_req, res) => {
    res.json({ ok: true, servers: listWebAppServers() });
  });

  app.get('/api/servers/free-port', async (_req, res) => {
    try {
      const port = await findAvailablePort(5200);
      res.json({ ok: true, port });
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/servers/start', async (req, res) => {
    try {
      const server = await startWebAppServer(req.body);
      res.json({ ok: true, server });
    } catch (err: unknown) {
      res.status(400).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/servers/stop', (req, res) => {
    const { serverId } = req.body as { serverId: string };
    const ok = stopWebAppServer(serverId);
    res.json({ ok });
  });

  // Proxy requests to running Python local servers
  app.use('/preview/:serverId', (req, res) => {
    const srv = getWebAppServer(req.params.serverId);
    if (!srv || srv.status !== 'running') {
      return res.status(502).send('Python server is not running.');
    }
    const targetPath = req.url || '/';
    const headers: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: `${srv.host}:${srv.port}`,
    };
    let bodyStr = '';
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      const ct = String(req.headers['content-type'] || '');
      bodyStr = ct.includes('application/x-www-form-urlencoded')
        ? new URLSearchParams(req.body as Record<string, string>).toString()
        : JSON.stringify(req.body);
      headers['content-length'] = String(Buffer.byteLength(bodyStr));
    } else {
      delete headers['content-length'];
    }

    const proxyReq = http.request(
      {
        hostname: srv.host,
        port: srv.port,
        path: targetPath,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.status(proxyRes.statusCode || 200);
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (v !== undefined) res.setHeader(k, v);
        }
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (e) => {
      res.status(502).send(`Unable to reach Python server on ${srv.host}:${srv.port}: ${e.message}`);
    });
    if (bodyStr) {
      proxyReq.write(bodyStr);
    }
    proxyReq.end();
  });

  // ==================== PERSISTENT STATE, BACKUP & ANDROID EXPORT ====================
  app.get('/api/state/:key', async (req, res) => {
    try {
      const result = await sqliteCall('kv_get', req.params.key);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put('/api/state/:key', async (req, res) => {
    try {
      const result = await sqliteCall('kv_set', req.params.key, req.body.value ?? null);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/backup/export', async (_req, res) => {
    try {
      const result = await sqliteCall('export_all');
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/backup/import', async (req, res) => {
    try {
      const result = await sqliteCall('import_all', undefined, req.body);
      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/storage/summary', (_req, res) => {
    res.json({ ok: true, ...getStorageSummary() });
  });

  app.post('/api/storage/clear-tmp', (_req, res) => {
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(TMP_DIR, { recursive: true, force: true });
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }
    res.json({ ok: true, ...getStorageSummary() });
  });

  app.get('/api/android/export-source', async (_req, res) => {
    try {
      const buf = await generateAndroidSourceZip();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="PyLabStudio_Android_Project.zip"');
      res.send(buf);
    } catch (err: unknown) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ==================== VITE DEV / STATIC SERVING ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PyLab Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PyLab Studio server:', err);
  process.exit(1);
});
