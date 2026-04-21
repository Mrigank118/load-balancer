"use strict";

/**
 * src/dashboard.js
 * Dashboard — terminal redraw loop + static HTML for /dashboard.
 *
 * Terminal dashboard:
 *   Clears the screen and redraws a formatted table every N ms.
 *   Uses only process.stdout / console — no external deps.
 *
 * Web dashboard:
 *   Returns a single self-contained HTML page. The page fetches /metrics
 *   every 2 s via JS and updates the table in place.
 *   Design rules: black bg, monospace font, no frameworks, no animations.
 */

const config  = require("../config");
const metrics = require("./metrics");

// ── helpers ──────────────────────────────────────────────────────────────────

const p = (v, n) => String(v).padEnd(n);   // left-align in fixed-width column

// ── Terminal Dashboard ────────────────────────────────────────────────────────

function draw() {
  const m   = metrics.snapshot();
  const now = new Date().toLocaleTimeString();

  console.clear();
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║           HTTP LOAD BALANCER  —  TERMINAL DASHBOARD      ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  Algorithm : ${m.algorithm}`);
  console.log(`  Healthy   : ${m.upCount} / ${m.total}  backends up`);
  console.log(`  Updated   : ${now}`);
  console.log("  ─────────────────────────────────────────────────────────");
  console.log(
    "  " + p("SERVER", 18) + p("STATUS", 8) +
    p("REQUESTS", 12) + p("ACTIVE CONNS", 15) + "AVG RESP (ms)"
  );
  console.log("  " + "─".repeat(63));

  m.servers.forEach((s) => {
    console.log(
      "  " + p(s.server, 18) + p(s.status, 8) +
      p(s.requests, 12) + p(s.activeConns, 15) + s.avgRespMs
    );
  });

  console.log("  " + "─".repeat(63));
  console.log("\n  Ctrl+C to stop\n");
}

function startTerminal() {
  draw();
  setInterval(draw, config.dashboardRefresh);
}

// ── Web Dashboard HTML ────────────────────────────────────────────────────────

// Intentionally minimal: ~55 lines, no framework, looks like a terminal screen.
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Load Balancer Dashboard</title>
<style>
  body { background:#000; color:#c8ffc8; font-family:"Courier New",Courier,monospace;
         padding:20px; margin:0 }
  h1   { color:#fff; font-size:1rem; letter-spacing:.1em; margin-bottom:4px }
  p    { color:#555; font-size:.75rem; margin:0 0 16px }
  table{ width:100%; border-collapse:collapse; font-size:.82rem }
  th   { text-align:left; border-bottom:1px solid #333; padding:4px 12px 4px 0;
         color:#888; text-transform:uppercase; letter-spacing:.05em }
  td   { padding:5px 12px 5px 0; border-bottom:1px solid #111 }
  .up  { color:#4eff91 } .dn { color:#ff4e4e }
  #info{ color:#ffdd57; font-size:.8rem; margin-bottom:12px }
  #ts  { color:#444; font-size:.7rem; margin-top:16px }
</style>
</head>
<body>
<h1>LOAD BALANCER DASHBOARD</h1>
<p>Listening on port ${config.port} &nbsp;|&nbsp; auto-refresh: 2 s</p>
<div id="info">algorithm: —</div>
<table>
  <thead><tr>
    <th>Server</th><th>Status</th><th>Requests</th>
    <th>Active Conns</th><th>Avg Resp (ms)</th>
  </tr></thead>
  <tbody id="rows"><tr><td colspan="5">loading...</td></tr></tbody>
</table>
<div id="ts"></div>
<script>
async function refresh() {
  try {
    const d = await (await fetch("/metrics")).json();
    document.getElementById("info").textContent =
      "algorithm: " + d.algorithm + "  |  up: " + d.upCount + "/" + d.total;
    document.getElementById("rows").innerHTML = d.servers.map(s =>
      \`<tr>
        <td>\${s.server}</td>
        <td class="\${s.status === "UP" ? "up" : "dn"}">\${s.status}</td>
        <td>\${s.requests}</td>
        <td>\${s.activeConns}</td>
        <td>\${s.avgRespMs}</td>
      </tr>\`
    ).join("");
    document.getElementById("ts").textContent =
      "last updated: " + new Date().toLocaleTimeString();
  } catch (e) {
    document.getElementById("rows").innerHTML =
      "<tr><td colspan='5'>fetch error — is the LB running?</td></tr>";
  }
}
refresh();
setInterval(refresh, 2000);
</script>
</body></html>`;

module.exports = { startTerminal, HTML };
