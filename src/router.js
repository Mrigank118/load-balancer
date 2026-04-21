"use strict";

/**
 * src/router.js
 * Router — handles all internal LB control/admin endpoints.
 *
 * Routes:
 *   GET /metrics          → JSON stats snapshot
 *   GET /dashboard        → web UI (HTML page)
 *   GET /algorithm?set=X  → switch scheduling algorithm at runtime
 *
 * Returns false for any path it doesn't own, so the caller knows
 * to pass the request to the proxy instead.
 */

const url       = require("url");
const config    = require("../config");
const metrics   = require("./metrics");
const scheduler = require("./scheduler");
const dashboard = require("./dashboard");

const VALID_ALGORITHMS = new Set(["round-robin", "least-connections"]);

/**
 * Try to handle req as an internal route.
 * @returns {boolean} true if handled, false if the caller should proxy it
 */
function handle(req, res) {
  const { pathname, query } = url.parse(req.url, true);

  // ── GET /metrics ─────────────────────────────────────────────────────────
  if (pathname === "/metrics" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(metrics.snapshot(), null, 2));
    return true;
  }

  // ── GET /dashboard ───────────────────────────────────────────────────────
  if (pathname === "/dashboard" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(dashboard.HTML);
    return true;
  }

  // ── GET /algorithm?set=<name> ────────────────────────────────────────────
  if (pathname === "/algorithm" && req.method === "GET") {
    const algo = query.set;
    if (VALID_ALGORITHMS.has(algo)) {
      config.algorithm = algo;
      scheduler.resetCursor();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(`Algorithm set to: ${algo}\n`);
    } else {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end(`Invalid algorithm. Valid options: ${[...VALID_ALGORITHMS].join(", ")}\n`);
    }
    return true;
  }

  return false; // not an internal route — proxy it
}

module.exports = { handle };
