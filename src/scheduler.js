"use strict";

/**
 * src/scheduler.js
 * Scheduler — picks which backend should handle the next request.
 *
 * Supported algorithms:
 *   round-robin       — cycles through servers in order, skips DOWN ones
 *   least-connections — always picks the server with fewest active conns
 *
 * The active algorithm is read from config so it can be changed at runtime
 * by any code that holds a reference to the config object.
 */

const config = require("../config");
const registry = require("./registry");

// Round-robin cursor — persists across calls
let rrIndex = 0;

/**
 * Returns the next backend server to use, or null if none are healthy.
 */
function pickServer() {
  const alive = registry.getHealthy();
  if (alive.length === 0) return null;

  if (config.algorithm === "round-robin") {
    const alive = registry.getHealthy();

    // build weighted list
    const pool = [];
    alive.forEach(s => {
      for (let i = 0; i < s.weight; i++) {
        pool.push(s);
      }
    });

    if (pool.length === 0) return null;

    const server = pool[rrIndex % pool.length];
    rrIndex++;

    return server;
  }

  if (config.algorithm === "least-connections") {
    // Pick the healthy server with the lowest active connection count.
    // Ties are broken in favour of the first in the list (stable).
    return alive.reduce((a, b) => (a.activeConns <= b.activeConns ? a : b));
  }

  return alive[0]; // fallback — should never be reached with validated input
}

/** Reset the round-robin cursor (call when algorithm is switched) */
function resetCursor() {
  rrIndex = 0;
}

module.exports = { pickServer, resetCursor };
