"use strict";

/**
 * src/registry.js
 * Server Registry — the single source of truth for backend state.
 *
 * Each entry holds both static config (host, port) and live runtime
 * counters (status, requests, active connections, response times).
 * All other modules read/write these objects directly by reference.
 */

const config = require("../config");

// Build the registry from config at startup
const servers = config.backends.map((b) => ({
  host:          b.host,
  port:          b.port,
  label:         `${b.host}:${b.port}`,  // display string
  status:        "UP",                    // "UP" | "DOWN"
  weight:        b.weight || 1,
  totalRequests: 0,
  activeConns:   0,
  totalRespTime: 0,                       // cumulative ms (for avg calc)
}));

/** Returns only servers currently marked UP */
function getHealthy() {
  return servers.filter((s) => s.status === "UP");
}

module.exports = { servers, getHealthy };
