"use strict";

/**
 * src/metrics.js
 * Metrics — computes a clean snapshot of runtime state from the registry.
 *
 * Consumed by:
 *   - /metrics endpoint (JSON API)
 *   - terminal dashboard
 *   - web dashboard (via /metrics fetch)
 */

const config   = require("../config");
const registry = require("./registry");

/**
 * Returns a plain object suitable for JSON serialisation or display.
 */
function snapshot() {
  return {
    algorithm: config.algorithm,
    upCount:   registry.getHealthy().length,
    total:     registry.servers.length,
    servers:   registry.servers.map((s) => ({
      server:      s.label,
      status:      s.status,
      requests:    s.totalRequests,
      activeConns: s.activeConns,
      avgRespMs: s.status === "DOWN"
      ? "N/A"
      : (s.totalRequests > 0
          ? Math.round(s.totalRespTime / s.totalRequests)
          : 0)
    })),
  };
}

module.exports = { snapshot };
