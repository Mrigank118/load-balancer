"use strict";


const config   = require("../config");
const registry = require("./registry");


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
