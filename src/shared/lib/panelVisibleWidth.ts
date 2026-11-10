/**
 * Real visible width of a docked panel on Windows.
 *
 * The host never sizes a CEP view below the minimum window width (about 136
 * CSS px): a narrower panel frame just clips the view, and the page keeps
 * reporting the minimum. While the page sits at that minimum, a small
 * PowerShell helper reads the frame width from the window tree and the panel
 * lays itself out to it.
 *
 * Usage: const width = useVisibleWidth()   // CSS px, or null when not clipped
 */
import { useEffect, useState } from 'react'
import { nchild, nprocess } from './nodeEnv'

/** The page can only be clipped while it is this narrow (CSS px) */
const HOST_MIN_VIEW_WIDTH = 140

/**
 * Prints "<view width> <visible width>" (device px) whenever either changes,
 * and exits once the view's window is gone.
 */
const PROBE_SOURCE = `
$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Text;
using System.Threading;
using System.Runtime.InteropServices;
public static class FlexioPanelProbe {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr h, uint flags);
  [DllImport("user32.dll")] static extern IntPtr GetDesktopWindow();
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

  static IntPtr found;

  static bool Check(IntPtr h, uint[] pids) {
    var cls = new StringBuilder(64);
    GetClassName(h, cls, 64);
    if (cls.ToString() != "CefBrowserWindow") return true;
    uint pid;
    GetWindowThreadProcessId(h, out pid);
    if (Array.IndexOf(pids, pid) < 0) return true;
    found = h;
    return false;
  }

  static IntPtr Find(uint[] pids) {
    found = IntPtr.Zero;
    EnumWindows((top, l) => {
      if (!Check(top, pids)) return false;
      EnumChildWindows(top, (child, l2) => Check(child, pids), IntPtr.Zero);
      return found == IntPtr.Zero;
    }, IntPtr.Zero);
    return found;
  }

  // The view keeps its minimum width; the frames above it are what shrink
  static string Measure(IntPtr view) {
    RECT v;
    GetWindowRect(view, out v);
    int left = v.L, right = v.R;
    IntPtr desktop = GetDesktopWindow();
    for (IntPtr p = GetAncestor(view, 1); p != IntPtr.Zero && p != desktop; p = GetAncestor(p, 1)) {
      RECT a;
      GetWindowRect(p, out a);
      if (a.L > left) left = a.L;
      if (a.R < right) right = a.R;
    }
    return (v.R - v.L) + " " + Math.Max(0, right - left);
  }

  public static void Run(uint[] pids) {
    SetProcessDPIAware();
    IntPtr view = IntPtr.Zero;
    for (int i = 0; i < 25 && view == IntPtr.Zero; i++) {
      view = Find(pids);
      if (view == IntPtr.Zero) Thread.Sleep(200);
    }
    string last = null;
    while (view != IntPtr.Zero && IsWindow(view)) {
      string now = Measure(view);
      if (now != last) { Console.Out.WriteLine(now); Console.Out.Flush(); last = now; }
      Thread.Sleep(100);
    }
  }
}
'@
`

/**
 * Report the visible share of the view (0–1) as the panel frame is resized.
 * Returns a function that stops the helper.
 */
function watchVisibleShare(onChange: (share: number) => void): () => void {
  if (!nchild || !nprocess || nprocess.platform !== 'win32') return () => {}

  // The view's window belongs to this process or, for a renderer, its parent
  const pids = [nprocess.pid, nprocess.ppid].filter((n) => Number.isInteger(n))
  const script = `${PROBE_SOURCE}\n[FlexioPanelProbe]::Run([uint32[]]@(${pids.join(',')}))\n`

  let child: import('child_process').ChildProcess
  try {
    child = nchild.spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-NoLogo', '-Command', '& ([scriptblock]::Create([Console]::In.ReadToEnd()))'],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] },
    )
  } catch {
    return () => {}
  }

  let pending = ''
  child.stdout?.on('data', (chunk: unknown) => {
    pending += String(chunk)
    const lines = pending.split(/\r?\n/)
    pending = lines.pop() ?? ''
    for (const line of lines) {
      const [view, visible] = line.trim().split(' ').map(Number)
      if (view > 0 && visible >= 0) onChange(Math.min(1, visible / view))
    }
  })
  child.on('error', () => { /* no PowerShell: the panel keeps the width the host reports */ })
  child.stdin?.on('error', () => {})
  child.stdin?.end(script)

  const stop = () => { try { child.kill() } catch { /* already gone */ } }
  window.addEventListener('unload', stop)
  return () => {
    window.removeEventListener('unload', stop)
    stop()
  }
}

/**
 * Width the panel really shows, in CSS px — null while the whole view is
 * visible (the usual case) or when it can't be measured.
 */
export function useVisibleWidth(): number | null {
  const [viewWidth, setViewWidth] = useState(() => window.innerWidth)
  const [share, setShare] = useState(1)

  useEffect(() => {
    const onResize = () => setViewWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const atMinimum = viewWidth <= HOST_MIN_VIEW_WIDTH
  useEffect(() => {
    if (!atMinimum) return
    const stop = watchVisibleShare(setShare)
    return () => {
      stop()
      setShare(1)
    }
  }, [atMinimum])

  return share < 1 ? Math.floor(viewWidth * share) : null
}
