import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import {
  PACKAGES_DIR,
  PROJECTS_DIR,
  PYTHON_SCRIPTS_DIR,
  resolveProjectDir,
} from './workspace.ts';
import { buildPythonEnv } from './pythonEngine.ts';
import { installPackage, uninstallPackage, listInstalledPackages, freezePackages, checkPackages, showPackage } from './pipEngine.ts';

const execFileAsync = promisify(execFile);

const terminalSessions = new Map<string, { cwd: string }>();

function getSessionCwd(sessionId: string, projectId?: string): string {
  const existing = terminalSessions.get(sessionId);
  if (existing && fs.existsSync(existing.cwd)) {
    return existing.cwd;
  }
  const initial = projectId ? resolveProjectDir(projectId) : PROJECTS_DIR;
  fs.mkdirSync(initial, { recursive: true });
  terminalSessions.set(sessionId, { cwd: initial });
  return initial;
}

function safeResolveInWorkspace(cwd: string, target: string): string {
  const resolved = path.resolve(cwd, target);
  if (resolved !== PROJECTS_DIR && !resolved.startsWith(PROJECTS_DIR + path.sep)) {
    throw new Error('Access restricted to PyLab projects workspace.');
  }
  return resolved;
}

function tokenizeCommand(cmd: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

export async function executeTerminalCommand(opts: {
  sessionId: string;
  projectId?: string;
  command: string;
}): Promise<{
  stdout: string;
  stderr: string;
  cwd: string;
  displayCwd: string;
  exitCode: number;
  clear?: boolean;
}> {
  const cwd = getSessionCwd(opts.sessionId, opts.projectId);
  const raw = opts.command.trim();
  const display = (dir: string) => {
    const rel = path.relative(PROJECTS_DIR, dir).replace(/\\/g, '/');
    return rel ? `~/projects/${rel}` : '~/projects';
  };

  if (!raw) {
    return { stdout: '', stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
  }

  const tokens = tokenizeCommand(raw);
  const cmd = tokens[0];
  const args = tokens.slice(1);

  try {
    if (cmd === 'clear' || cmd === 'cls') {
      return { stdout: '', stderr: '', cwd, displayCwd: display(cwd), exitCode: 0, clear: true };
    }

    if (cmd === 'help') {
      return {
        stdout: [
          'PyLab Studio Terminal (Connected to Python 3.11 Runtime & Workspace)',
          'Available commands:',
          '  python <file.py> / python -c "..."  Execute Python code locally',
          '  pip install|uninstall|list|show|freeze|check  Manage Python packages',
          '  ls / dir          List files and directories',
          '  cd <dir>          Change working directory',
          '  pwd               Print current working directory',
          '  cat <file>        Print file contents',
          '  mkdir <dir>       Create directory',
          '  touch <file>      Create empty file',
          '  cp <src> <dst>    Copy file or directory',
          '  mv <src> <dst>    Move or rename file/directory',
          '  rm <target>       Remove file or directory (-r)',
          '  env / which       Inspect Python environment variables',
          '  clear             Clear terminal output',
        ].join('\n'),
        stderr: '',
        cwd,
        displayCwd: display(cwd),
        exitCode: 0,
      };
    }

    if (cmd === 'pwd') {
      return { stdout: display(cwd), stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'cd') {
      const target = args[0] || PROJECTS_DIR;
      let nextDir: string;
      if (target === '~' || target === '/') {
        nextDir = PROJECTS_DIR;
      } else {
        nextDir = safeResolveInWorkspace(cwd, target);
      }
      if (!fs.existsSync(nextDir) || !fs.statSync(nextDir).isDirectory()) {
        return { stdout: '', stderr: `cd: ${target}: No such directory`, cwd, displayCwd: display(cwd), exitCode: 1 };
      }
      terminalSessions.set(opts.sessionId, { cwd: nextDir });
      return { stdout: '', stderr: '', cwd: nextDir, displayCwd: display(nextDir), exitCode: 0 };
    }

    if (cmd === 'ls' || cmd === 'dir') {
      const target = args[0] && !args[0].startsWith('-') ? safeResolveInWorkspace(cwd, args[0]) : cwd;
      if (!fs.existsSync(target)) {
        return { stdout: '', stderr: `ls: cannot access '${args[0]}': No such file or directory`, cwd, displayCwd: display(cwd), exitCode: 1 };
      }
      const entries = fs.readdirSync(target, { withFileTypes: true }).filter((e) => e.name !== '__pycache__');
      const lines = entries.map((e) => {
        const full = path.join(target, e.name);
        const st = fs.statSync(full);
        const typeChar = e.isDirectory() ? 'd' : '-';
        const sizeStr = String(st.size).padStart(8, ' ');
        return `${typeChar}  ${sizeStr} B  ${e.name}${e.isDirectory() ? '/' : ''}`;
      });
      return { stdout: lines.join('\n') || '(empty directory)', stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'mkdir') {
      if (!args[0]) return { stdout: '', stderr: 'mkdir: missing operand', cwd, displayCwd: display(cwd), exitCode: 1 };
      const target = safeResolveInWorkspace(cwd, args[0]);
      fs.mkdirSync(target, { recursive: true });
      return { stdout: `Created directory: ${args[0]}`, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'touch') {
      if (!args[0]) return { stdout: '', stderr: 'touch: missing file operand', cwd, displayCwd: display(cwd), exitCode: 1 };
      const target = safeResolveInWorkspace(cwd, args[0]);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (!fs.existsSync(target)) fs.writeFileSync(target, '', 'utf-8');
      return { stdout: '', stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'cat') {
      if (!args[0]) return { stdout: '', stderr: 'cat: missing file operand', cwd, displayCwd: display(cwd), exitCode: 1 };
      const target = safeResolveInWorkspace(cwd, args[0]);
      if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
        return { stdout: '', stderr: `cat: ${args[0]}: No such file`, cwd, displayCwd: display(cwd), exitCode: 1 };
      }
      return { stdout: fs.readFileSync(target, 'utf-8'), stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'cp') {
      if (args.length < 2) return { stdout: '', stderr: 'cp: missing destination file operand', cwd, displayCwd: display(cwd), exitCode: 1 };
      const src = safeResolveInWorkspace(cwd, args[0]);
      const dst = safeResolveInWorkspace(cwd, args[1]);
      fs.cpSync(src, dst, { recursive: true });
      return { stdout: `Copied ${args[0]} -> ${args[1]}`, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'mv') {
      if (args.length < 2) return { stdout: '', stderr: 'mv: missing destination file operand', cwd, displayCwd: display(cwd), exitCode: 1 };
      const src = safeResolveInWorkspace(cwd, args[0]);
      const dst = safeResolveInWorkspace(cwd, args[1]);
      fs.renameSync(src, dst);
      return { stdout: `Moved ${args[0]} -> ${args[1]}`, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'rm') {
      const targetArg = args.find((a) => !a.startsWith('-'));
      if (!targetArg) return { stdout: '', stderr: 'rm: missing operand', cwd, displayCwd: display(cwd), exitCode: 1 };
      const target = safeResolveInWorkspace(cwd, targetArg);
      if (target === PROJECTS_DIR) {
        return { stdout: '', stderr: 'rm: refusing to remove projects root', cwd, displayCwd: display(cwd), exitCode: 1 };
      }
      fs.rmSync(target, { recursive: true, force: true });
      return { stdout: `Removed ${targetArg}`, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'echo') {
      return { stdout: args.join(' '), stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'which') {
      if (args[0] === 'python' || args[0] === 'python3') {
        return { stdout: '/usr/bin/python3', stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
      }
      if (args[0] === 'pip' || args[0] === 'pip3') {
        return { stdout: `${PYTHON_SCRIPTS_DIR}/pylab_pip.py`, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
      }
      return { stdout: `${args[0] || ''}: built-in workspace command`, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    if (cmd === 'env') {
      const env = buildPythonEnv();
      return {
        stdout: [
          `PYTHONPATH=${env.PYTHONPATH}`,
          `PYTHONIOENCODING=${env.PYTHONIOENCODING}`,
          `PACKAGES_DIR=${PACKAGES_DIR}`,
          `PWD=${display(cwd)}`,
        ].join('\n'),
        stderr: '',
        cwd,
        displayCwd: display(cwd),
        exitCode: 0,
      };
    }

    if (cmd === 'pip' || cmd === 'pip3') {
      const sub = args[0];
      if (!sub || sub === '--help') {
        return {
          stdout: 'Usage: pip <install|uninstall|list|show|freeze|check> [package]',
          stderr: '',
          cwd,
          displayCwd: display(cwd),
          exitCode: 0,
        };
      }
      if (sub === 'list') {
        const res = await listInstalledPackages();
        const pkgs = (res.packages as Array<{ name: string; version: string }>) || [];
        const out = pkgs.length
          ? ['Package                Version', '---------------------- ----------', ...pkgs.map((p) => `${p.name.padEnd(22)} ${p.version}`)].join('\n')
          : 'No packages installed in workspace yet.';
        return { stdout: out, stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
      }
      if (sub === 'freeze') {
        const res = await freezePackages();
        return { stdout: String(res.freeze || ''), stderr: '', cwd, displayCwd: display(cwd), exitCode: 0 };
      }
      if (sub === 'check') {
        const res = await checkPackages();
        const issues = (res.issues as string[]) || [];
        return {
          stdout: issues.length ? issues.join('\n') : 'No broken requirements found.',
          stderr: '',
          cwd,
          displayCwd: display(cwd),
          exitCode: issues.length ? 1 : 0,
        };
      }
      if (sub === 'show' && args[1]) {
        const res = await showPackage(args[1]);
        if (!res.ok) return { stdout: '', stderr: String(res.error || 'Not found'), cwd, displayCwd: display(cwd), exitCode: 1 };
        const p = (res.package || res) as Record<string, unknown>;
        return {
          stdout: `Name: ${p.name}\nVersion: ${p.version}\nSummary: ${p.summary}\nAuthor: ${p.author}\nLicense: ${p.license}\nLocation: ${p.location || PACKAGES_DIR}`,
          stderr: '',
          cwd,
          displayCwd: display(cwd),
          exitCode: 0,
        };
      }
      if (sub === 'install') {
        const upgrade = args.includes('--upgrade') || args.includes('-U');
        const specs = args.slice(1).filter((a) => !a.startsWith('-'));
        if (!specs.length) return { stdout: '', stderr: 'pip install: package name required', cwd, displayCwd: display(cwd), exitCode: 1 };
        const allLogs: string[] = [];
        let okAll = true;
        for (const s of specs) {
          const res = await installPackage(s, upgrade);
          if (Array.isArray(res.logs)) allLogs.push(...(res.logs as string[]));
          if (!res.ok) okAll = false;
        }
        return {
          stdout: allLogs.join('\n'),
          stderr: okAll ? '' : 'One or more packages failed to install.',
          cwd,
          displayCwd: display(cwd),
          exitCode: okAll ? 0 : 1,
        };
      }
      if (sub === 'uninstall') {
        const specs = args.slice(1).filter((a) => !a.startsWith('-'));
        if (!specs.length) return { stdout: '', stderr: 'pip uninstall: package name required', cwd, displayCwd: display(cwd), exitCode: 1 };
        const res = await uninstallPackage(specs[0]);
        const logs = Array.isArray(res.logs) ? (res.logs as string[]).join('\n') : '';
        return { stdout: logs, stderr: res.ok ? '' : logs, cwd, displayCwd: display(cwd), exitCode: res.ok ? 0 : 1 };
      }
      return { stdout: '', stderr: `Unsupported pip subcommand: ${sub}`, cwd, displayCwd: display(cwd), exitCode: 1 };
    }

    if (cmd === 'python' || cmd === 'python3') {
      const env = buildPythonEnv();
      env.PYTHONPATH = `${cwd}${path.delimiter}${env.PYTHONPATH || PACKAGES_DIR}`;
      if (args.length === 0) {
        const { stdout } = await execFileAsync('python3', ['--version'], { env });
        return {
          stdout: `${stdout.trim()} (Use "python <file.py>" or "python -c 'code'" to execute)`,
          stderr: '',
          cwd,
          displayCwd: display(cwd),
          exitCode: 0,
        };
      }
      // Support python -m pip ...
      if (args[0] === '-m' && args[1] === 'pip') {
        return executeTerminalCommand({
          sessionId: opts.sessionId,
          projectId: opts.projectId,
          command: `pip ${args.slice(2).join(' ')}`,
        });
      }
      const { stdout, stderr } = await execFileAsync('python3', args, {
        cwd,
        env,
        timeout: 15000,
        maxBuffer: 5 * 1024 * 1024,
      });
      return { stdout, stderr, cwd, displayCwd: display(cwd), exitCode: 0 };
    }

    return {
      stdout: '',
      stderr: `pylab: command not found: ${cmd}. Type "help" for supported Python & workspace commands.`,
      cwd,
      displayCwd: display(cwd),
      exitCode: 127,
    };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string; code?: number };
    return {
      stdout: e.stdout || '',
      stderr: e.stderr || e.message || String(err),
      cwd,
      displayCwd: display(cwd),
      exitCode: typeof e.code === 'number' ? e.code : 1,
    };
  }
}
