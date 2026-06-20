import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { ImageAddon } from "@xterm/addon-image";
import { TerminalChannel } from "./channel.js";

const INSTANCE_ID = crypto.randomUUID();

document.body.style.cssText =
  "margin:0;padding:0;background:#000;height:100vh;overflow:hidden";

// --- Busy overlay ---
const overlay = document.createElement("div");
overlay.id = "busy-overlay";
overlay.innerHTML = `
  <div class="busy-card">
    <div class="busy-title">Сессия занята</div>
    <button id="busy-force">Запустить в любом случае</button>
  </div>
`;
document.body.appendChild(overlay);

const sty = document.createElement("style");
sty.textContent = `
  #busy-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .busy-card {
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 36px 48px;
    text-align: center;
    max-width: 420px;
  }
  .busy-title {
    font-size: 22px;
    font-weight: 700;
    color: #ff6b6b;
    margin-bottom: 24px;
  }
  #busy-force {
    background: #2d2d5e; color: #ccc; border: 1px solid #444;
    border-radius: 8px; padding: 10px 24px; font-size: 14px;
    cursor: pointer; transition: background .15s;
  }
  #busy-force:hover { background: #3d3d7e; color: #fff; }
`;
document.head.appendChild(sty);

// --- Status tracking via Event API ---
let lastStatus = null;
let terminalStarted = false;

if (window.webxdc.setUpdateListener) {
  window.webxdc.setUpdateListener((update) => {
    if (update.payload?.status) lastStatus = update.payload;
  }, 0);
}

document.getElementById("busy-force").addEventListener("click", claimAndStart);

setTimeout(() => {
  if (lastStatus?.status === "busy" && lastStatus.instance_id !== INSTANCE_ID) {
    overlay.style.display = "flex";
  } else {
    claimAndStart();
  }
}, 500);

function claimAndStart() {
  if (terminalStarted) return;
  terminalStarted = true;
  overlay.style.display = "none";
  document.getElementById("terminal").style.cssText = "height:100vh";

  try {
    window.webxdc.sendUpdate({
      payload: { status: "busy", instance_id: INSTANCE_ID, ts: Date.now() },
    }, "");
  } catch (_) {}

  const term = new Terminal({ cursorBlink: true, fontSize: 12, fontFamily: '"JB", monospace' });
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new ImageAddon({ sixelSupport: true }));

  term.open(document.getElementById("terminal"));
  fitAddon.fit();

  const channel = new TerminalChannel();
  channel.onUpdate = (data) => {
    if (data === null) term.dispose(); else term.write(data);
  };

  channel.startHeartbeat();
  channel.sendResize(term.cols, term.rows);

  window.addEventListener("resize", () => fitAddon.fit());
  term.onResize(() => channel.sendResize(term.cols, term.rows));
  term.onData((data) => channel.sendInput(data));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) channel.stopHeartbeat(); else channel.startHeartbeat();
  });

  window.addEventListener("pagehide", () => {
    channel.stopHeartbeat();
    try {
      window.webxdc.sendUpdate({
        payload: { status: "free", instance_id: INSTANCE_ID, ts: Date.now() },
      }, "");
    } catch (_) {}
  });

  window.addEventListener("pageshow", () => channel.startHeartbeat());
}
