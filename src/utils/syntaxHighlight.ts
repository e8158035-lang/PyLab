const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'match', 'case',
]);

const PYTHON_BUILTINS = new Set([
  'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable', 'chr',
  'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod',
  'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset',
  'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int',
  'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max',
  'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print',
  'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice',
  'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
  'self', 'cls',
]);

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'export', 'from', 'class', 'extends', 'new', 'async', 'await',
  'try', 'catch', 'finally', 'throw', 'true', 'false', 'null', 'undefined',
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCodeLine(line: string, fileName: string, enabled = true): string {
  if (!enabled) return escapeHtml(line);
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '.py';

  if (ext === '.py' || ext === '.pyw' || ext === '.sh') {
    return highlightPythonLine(line);
  }
  if (ext === '.json') {
    return highlightJsonLine(line);
  }
  if (ext === '.js') {
    return highlightJsLine(line);
  }
  if (ext === '.html' || ext === '.xml') {
    return highlightMarkupLine(line);
  }
  if (ext === '.yaml' || ext === '.yml' || ext === '.toml' || ext === '.ini') {
    return highlightConfigLine(line);
  }
  if (ext === '.md') {
    if (/^\s*#{1,6}\s/.test(line)) {
      return `<span class="text-violet-400 font-semibold">${escapeHtml(line)}</span>`;
    }
    return escapeHtml(line);
  }
  return escapeHtml(line);
}

function highlightPythonLine(line: string): string {
  const tokenRegex = /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[A-Za-z_][A-Za-z0-9_.]*)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)|([()[\]{}])|([+\-*/%=<>!&|^~]+)/g;
  let out = '';
  let lastIndex = 0;
  let prevKeyword = '';

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      out += escapeHtml(line.slice(lastIndex, match.index));
    }
    const [full, comment, str, decorator, num, ident, bracket, op] = match;
    if (comment) {
      out += `<span class="text-slate-500 italic">${escapeHtml(comment)}</span>`;
    } else if (str) {
      out += `<span class="text-emerald-400">${escapeHtml(str)}</span>`;
    } else if (decorator) {
      out += `<span class="text-amber-400">${escapeHtml(decorator)}</span>`;
    } else if (num) {
      out += `<span class="text-amber-300">${escapeHtml(num)}</span>`;
    } else if (ident) {
      if (PYTHON_KEYWORDS.has(ident)) {
        const cls = ident === 'import' || ident === 'from' || ident === 'as'
          ? 'text-blue-400 font-medium'
          : 'text-violet-400 font-medium';
        out += `<span class="${cls}">${escapeHtml(ident)}</span>`;
        prevKeyword = ident;
      } else if (prevKeyword === 'def') {
        out += `<span class="text-sky-300 font-medium">${escapeHtml(ident)}</span>`;
        prevKeyword = '';
      } else if (prevKeyword === 'class') {
        out += `<span class="text-amber-300 font-medium">${escapeHtml(ident)}</span>`;
        prevKeyword = '';
      } else if (PYTHON_BUILTINS.has(ident)) {
        out += `<span class="text-cyan-400">${escapeHtml(ident)}</span>`;
      } else if (line[match.index + ident.length] === '(') {
        out += `<span class="text-sky-300">${escapeHtml(ident)}</span>`;
      } else {
        out += `<span class="text-slate-100">${escapeHtml(ident)}</span>`;
      }
    } else if (bracket) {
      out += `<span class="text-amber-200">${escapeHtml(bracket)}</span>`;
    } else if (op) {
      out += `<span class="text-rose-300">${escapeHtml(op)}</span>`;
    } else {
      out += escapeHtml(full);
    }
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < line.length) {
    out += escapeHtml(line.slice(lastIndex));
  }
  return out || '&nbsp;';
}

function highlightJsonLine(line: string): string {
  const regex = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?\b)/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out += escapeHtml(line.slice(last, m.index));
    if (m[1]) {
      out += `<span class="text-sky-300">${escapeHtml(m[1])}</span>:`;
    } else if (m[2]) {
      out += `<span class="text-emerald-400">${escapeHtml(m[2])}</span>`;
    } else if (m[3]) {
      out += `<span class="text-violet-400">${escapeHtml(m[3])}</span>`;
    } else if (m[4]) {
      out += `<span class="text-amber-300">${escapeHtml(m[4])}</span>`;
    }
    last = regex.lastIndex;
  }
  if (last < line.length) out += escapeHtml(line.slice(last));
  return out || '&nbsp;';
}

function highlightJsLine(line: string): string {
  const regex = /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out += escapeHtml(line.slice(last, m.index));
    if (m[1]) out += `<span class="text-slate-500 italic">${escapeHtml(m[1])}</span>`;
    else if (m[2]) out += `<span class="text-emerald-400">${escapeHtml(m[2])}</span>`;
    else if (m[3]) out += `<span class="text-amber-300">${escapeHtml(m[3])}</span>`;
    else if (m[4]) {
      out += JS_KEYWORDS.has(m[4])
        ? `<span class="text-violet-400 font-medium">${escapeHtml(m[4])}</span>`
        : escapeHtml(m[4]);
    }
    last = regex.lastIndex;
  }
  if (last < line.length) out += escapeHtml(line.slice(last));
  return out || '&nbsp;';
}

function highlightMarkupLine(line: string): string {
  const regex = /(&lt;!--[\s\S]*?--&gt;)|(<\/?[A-Za-z0-9-]+)|("[^"]*")/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) out += escapeHtml(line.slice(last, m.index));
    if (m[2]) out += `<span class="text-violet-400">${escapeHtml(m[2])}</span>`;
    else if (m[3]) out += `<span class="text-emerald-400">${escapeHtml(m[3])}</span>`;
    else out += escapeHtml(m[0]);
    last = regex.lastIndex;
  }
  if (last < line.length) out += escapeHtml(line.slice(last));
  return out || '&nbsp;';
}

function highlightConfigLine(line: string): string {
  if (/^\s*[#;]/.test(line)) return `<span class="text-slate-500 italic">${escapeHtml(line)}</span>`;
  if (/^\s*\[.*\]\s*$/.test(line)) return `<span class="text-violet-400 font-medium">${escapeHtml(line)}</span>`;
  const idx = line.search(/[:=]/);
  if (idx !== -1) {
    return `<span class="text-sky-300">${escapeHtml(line.slice(0, idx))}</span>${escapeHtml(line[idx])}<span class="text-emerald-400">${escapeHtml(line.slice(idx + 1))}</span>`;
  }
  return escapeHtml(line) || '&nbsp;';
}

export const PYTHON_AUTOCOMPLETE_WORDS = [
  ...Array.from(PYTHON_KEYWORDS),
  ...Array.from(PYTHON_BUILTINS),
  'import json',
  'import sqlite3',
  'import os',
  'import sys',
  'from pathlib import Path',
  'if __name__ == "__main__":',
  'def main():',
  'try:',
  'except Exception as e:',
];
