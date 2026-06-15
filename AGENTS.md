# xdcterm

Terminal emulator delivered as a Delta Chat WebXDC app.

## Structure

```
frontend/   — vanilla JS + xterm.js, built with Vite
backend/    — Python 3.14 Delta Chat bot using deltabot-cli
```

## Commands

| Directory | Command | Purpose |
|-----------|---------|---------|
| `frontend/` | `npm run build` | Build → `dist-release/xdcterm.xdc` |
| `backend/` | `uv run bot.py` | Start the bot (requires built .xdc) |

**Build order matters.** Run `npm run build` in `frontend/` first — `bot.py` imports `frontend/dist-release/xdcterm.xdc` at line 21.

## Setup

- **Frontend:** `npm install` (npm, not pnpm/yarn)
- **Backend:** `uv sync` in `backend/` (Python 3.14, managed by uv, not pip)
- No `tsconfig.json` — frontend is plain JS, not TypeScript
- No lint, no typecheck, no test configs exist
- No CI, no pre-commit hooks

## Backend

- **Entrypoint:** `backend/bot.py` → `cli.start()` (deltabot-cli CLI)
- **Database:** SQLite at `backend/data/xdcterm.db` (WAL mode, thread-safe via lock)
- **PTY lifecycle:** One PTY per WebXDC message id, 60s idle timeout, auto-closed on instance delete
- **Bot commands:** `/start` (send webxdc), `/list` (active sessions)
- **First user** is auto-assigned as admin (receives PTY open/close notifications)
- **Onboarding:** New users join via securejoin inviter progress at 1000
- **Environment:** `$SHELL` used for PTY child (defaults to `bash`)

## Frontend

- **xterm.js** with FitAddon + ImageAddon (sixel support)
- Custom font: JetBrains Mono Nerd Font (`jetbrains-mono-nf.woff2`)
- Uses Delta Chat WebXDC realtime API (`window.webxdc.joinRealtimeChannel()`)
- `webxdc.js` is **not an npm package** — loaded at runtime by the WebXDC host
- Build produces `.xdc` file via `vite-plugin-zip-pack`

## Protocol (binary over WebXDC realtime)

| Byte | Command | Payload |
|------|---------|---------|
| `0x49` | INPUT | UTF-8 encoded terminal input |
| `0x4f` | OUTPUT | PTY stdout bytes to terminal |
| `0x45` | EXIT | (no payload) — PTY exited |
| `0x52` | RESIZE | 4 bytes: cols hi/lo, rows hi/lo |
| `0x43` | LIFECYCLE | 1 byte: `0x01`=open, `0x00`=close |

Heartbeat sends LIFECYCLE_OPEN every 1s while visible; LIFECYCLE_CLOSE on hide/pagehide.

## Git

- 0BSD license
- History shows periodic `deno fmt` / lint passes — no automated enforcement
