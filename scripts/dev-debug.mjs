import { spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ENDPOINT =
  "http://127.0.0.1:7765/ingest/c9b029cb-be37-4595-8cb3-2168cbe1da2e";
const SESSION = "f7751a";

function agentLog(location, message, data, hypothesisId) {
  // #region agent log
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION,
    },
    body: JSON.stringify({
      sessionId: SESSION,
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: process.env.DEBUG_RUN_ID || "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
}

const t0 = Date.now();
const useTurbo = process.env.USE_TURBO === "1";
const nextArgs = useTurbo
  ? ["dev", "--turbo", "--hostname", "127.0.0.1"]
  : ["dev", "--hostname", "127.0.0.1"];

agentLog(
  "scripts/dev-debug.mjs:entry",
  "dev-debug wrapper entered",
  { pid: process.pid, useTurbo, nextArgs },
  "H3"
);

const nextBin = path.join(root, "node_modules", ".bin", "next");
/** inherit keeps a TTY/pipe behavior closer to `npm run dev` so Next flushes banners. */
const child = spawn(nextBin, nextArgs, {
  cwd: root,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});

agentLog(
  "scripts/dev-debug.mjs:after-spawn",
  "next child spawned",
  { nextPid: child.pid, msSinceT0: Date.now() - t0 },
  "H1"
);

let httpLogged = false;
let stall30Logged = false;

const stallTimer = setTimeout(() => {
  if (!httpLogged && !stall30Logged) {
    stall30Logged = true;
    agentLog(
      "scripts/dev-debug.mjs:stall-30s",
      "still no HTTP response on 3000 after 30s",
      { msSinceT0: Date.now() - t0 },
      "H5"
    );
  }
}, 30_000);

function probeOnce(msSinceT0, cb) {
  const req = http.get(
    "http://127.0.0.1:3000/",
    { timeout: 400 },
    (res) => {
      if (!httpLogged) {
        httpLogged = true;
        clearTimeout(stallTimer);
        agentLog(
          "scripts/dev-debug.mjs:http-ready",
          "HTTP 3000 responded (first)",
          { statusCode: res.statusCode, msSinceT0 },
          "H2"
        );
      }
      res.resume();
      cb(true);
    }
  );
  req.on("error", () => cb(false));
  req.on("timeout", () => {
    req.destroy();
    cb(false);
  });
}

const probeInterval = setInterval(() => {
  if (httpLogged) {
    clearInterval(probeInterval);
    return;
  }
  probeOnce(Date.now() - t0, () => {});
}, 800);

const stopProbes = () => {
  clearInterval(probeInterval);
  clearTimeout(stallTimer);
};

child.on("error", (err) => {
  stopProbes();
  agentLog(
    "scripts/dev-debug.mjs:spawn-error",
    "spawn error",
    { message: err.message },
    "H4"
  );
});

child.on("exit", (code, signal) => {
  stopProbes();
  agentLog(
    "scripts/dev-debug.mjs:exit",
    "next child exited",
    { code, signal, msSinceT0: Date.now() - t0 },
    "H4"
  );
});
