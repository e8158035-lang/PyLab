#!/usr/bin/env python3
"""
PyLab Studio Real Python Debugger Harness powered by Python's built-in bdb.Bdb.
Communicates with the Node server via line-delimited JSON messages.
"""
import bdb
import sys
import os
import json
import queue
import traceback
import threading
import io


def safe_repr(val, max_len=160):
    try:
        r = repr(val)
        if len(r) > max_len:
            return r[:max_len] + "..."
        return r
    except Exception:
        return "<unrepresentable>"


def serialize_vars(mapping: dict) -> list[dict]:
    items = []
    for k, v in mapping.items():
        if k.startswith("__") and k.endswith("__"):
            continue
        if callable(v) and getattr(v, "__module__", None) in ("builtins", "bdb"):
            continue
        if type(v).__name__ == "module":
            continue
        items.append({
            "name": str(k),
            "type": type(v).__name__,
            "value": safe_repr(v),
        })
    return items[:120]


class PyLabDebugger(bdb.Bdb):
    def __init__(self, target_file: str, breakpoints: list[int]):
        super().__init__()
        self.target_file = os.path.realpath(target_file)
        self.cmd_queue: queue.Queue[str] = queue.Queue()
        self.stop_requested = False
        self.first_pause_done = False
        for bp_line in breakpoints:
            self.set_break(self.target_file, int(bp_line))

    def emit(self, event_type: str, payload: dict):
        msg = json.dumps({"event": event_type, **payload}, ensure_ascii=False)
        sys.__stdout__.write(f"__PYLAB_DBG__:{msg}\n")
        sys.__stdout__.flush()

    def build_stack(self, frame) -> list[dict]:
        stack, _ = self.get_stack(frame, None)
        frames = []
        for f, lineno in stack:
            fname = os.path.realpath(f.f_code.co_filename)
            if fname == os.path.realpath(__file__) or "bdb.py" in fname:
                continue
            frames.append({
                "file": os.path.basename(fname),
                "fullPath": fname,
                "line": lineno,
                "function": f.f_code.co_name,
            })
        return frames

    def wait_for_command(self, frame):
        stack = self.build_stack(frame)
        self.emit("paused", {
            "file": os.path.basename(frame.f_code.co_filename),
            "line": frame.f_lineno,
            "function": frame.f_code.co_name,
            "locals": serialize_vars(frame.f_locals),
            "globals": serialize_vars(frame.f_globals),
            "stack": stack,
        })

        while not self.stop_requested:
            try:
                action = self.cmd_queue.get(timeout=0.1)
            except queue.Empty:
                continue

            if action == "stop":
                self.stop_requested = True
                self.set_quit()
                return
            elif action == "step_into":
                self.set_step()
                return
            elif action == "step_over":
                self.set_next(frame)
                return
            elif action == "step_out":
                self.set_return(frame)
                return
            elif action == "continue":
                self.set_continue()
                return

        self.set_quit()

    def user_line(self, frame):
        if self.stop_requested:
            self.set_quit()
            return
        fname = os.path.realpath(frame.f_code.co_filename)
        if fname != self.target_file and not fname.startswith(os.path.dirname(self.target_file) + os.sep):
            self.set_continue()
            return
        if self.break_here(frame) or (self.first_pause_done and self.stop_here(frame)):
            self.first_pause_done = True
            self.wait_for_command(frame)

    def user_exception(self, frame, exc_info):
        exc_type, exc_val, exc_tb = exc_info
        self.emit("exception", {
            "type": exc_type.__name__,
            "message": str(exc_val),
            "line": frame.f_lineno,
            "traceback": "".join(traceback.format_exception(exc_type, exc_val, exc_tb)),
        })


class StreamForwarder(io.TextIOBase):
    def __init__(self, dbg: PyLabDebugger, stream_name: str):
        self.dbg = dbg
        self.stream_name = stream_name

    def write(self, s: str):
        if s:
            self.dbg.emit("output", {"stream": self.stream_name, "text": s})
        return len(s)

    def flush(self):
        pass


def command_listener(dbg: PyLabDebugger):
    for line in sys.__stdin__:
        line = line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
        except Exception:
            continue
        action = cmd.get("action")
        if action == "stop":
            dbg.stop_requested = True
            dbg.cmd_queue.put("stop")
            break
        elif action == "pause":
            dbg.first_pause_done = True
            dbg.set_step()
        elif action in ("continue", "step_into", "step_over", "step_out"):
            dbg.cmd_queue.put(action)
        elif action == "set_breakpoints":
            dbg.clear_all_breaks()
            for bp in cmd.get("lines", []):
                dbg.set_break(dbg.target_file, int(bp))


def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    target_file = os.path.realpath(sys.argv[1])
    bp_arg = sys.argv[2] if len(sys.argv) > 2 else "[]"
    breakpoints = json.loads(bp_arg)

    dbg = PyLabDebugger(target_file, breakpoints)
    listener = threading.Thread(target=command_listener, args=(dbg,), daemon=True)
    listener.start()

    sys.stdout = StreamForwarder(dbg, "stdout")
    sys.stderr = StreamForwarder(dbg, "stderr")

    project_dir = os.path.dirname(target_file)
    if project_dir not in sys.path:
        sys.path.insert(0, project_dir)

    dbg.emit("started", {"file": os.path.basename(target_file), "breakpoints": breakpoints})

    try:
        with open(target_file, "r", encoding="utf-8") as f:
            code_src = f.read()
        compiled = compile(code_src, target_file, "exec")
        env_globals = {"__name__": "__main__", "__file__": target_file}
        dbg.reset()
        dbg.set_continue()
        sys.settrace(dbg.trace_dispatch)
        try:
            exec(compiled, env_globals)
        finally:
            sys.settrace(None)
        dbg.emit("finished", {"exitCode": 0})
    except bdb.BdbQuit:
        dbg.emit("finished", {"exitCode": 0, "stopped": True})
    except Exception as e:
        dbg.emit("exception", {
            "type": type(e).__name__,
            "message": str(e),
            "traceback": traceback.format_exc(),
        })
        dbg.emit("finished", {"exitCode": 1})


if __name__ == "__main__":
    main()
