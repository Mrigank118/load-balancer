"use strict";

/**
 * index.js  —  Load Balancer Entry Point
 *
 * Wires all modules together and starts:
 *   1. Health checker (background TCP probe loop)
 *   2. HTTP server    (routes to either router or proxy)
 *   3. Terminal dashboard (periodic redraw loop)
 *
 * Run:  node index.js
 */

const http          = require("http");
const config        = require("./config");
const registry      = require("./src/registry");
const healthChecker = require("./src/healthChecker");
const router        = require("./src/router");
const proxy         = require("./src/proxy");
const dashboard     = require("./src/dashboard");

// ── 1. Start health checks ────────────────────────────────────────────────────
healthChecker.start();

// ── 2. Create the HTTP server ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // Let the router handle internal endpoints first;
  // anything else goes straight to the proxy.
  if (!router.handle(req, res)) {
    proxy.handleRequest(req, res);
  }
});

server.listen(config.port, () => {
  console.log(`\nLoad Balancer running on port ${config.port}`);
  console.log(`Backends : ${registry.servers.map((s) => s.label).join("  |  ")}`);
  console.log(`Algorithm: ${config.algorithm}`);
  console.log(`Dashboard: http://localhost:${config.port}/dashboard\n`);

  // ── 3. Start terminal dashboard ───────────────────────────────────────────
  dashboard.startTerminal();
});
