"use strict";

/**
 * src/healthChecker.js
 * Health Checker — periodically TCP-probes every backend.
 *
 * A TCP connect is the lightest possible probe: it confirms the server
 * process is alive and accepting connections without sending any HTTP.
 * On connect  → mark UP   (restore to rotation if it was DOWN)
 * On timeout  → mark DOWN (remove from rotation)
 * On error    → mark DOWN
 *
 * The interval is set in config.healthCheckInterval (default 5 s).
 */

const net      = require("net");
const config   = require("../config");
const registry = require("./registry");

const PROBE_TIMEOUT_MS = 2000; // max wait for a TCP handshake

function probeServer(srv) {
  const socket = net.createConnection({ host: srv.host, port: srv.port });
  socket.setTimeout(PROBE_TIMEOUT_MS);

  socket.on("connect", () => {
    srv.status = "UP";
    socket.destroy();
  });

  const markDown = () => {
    srv.status = "DOWN";
    socket.destroy();
  };

  socket.on("timeout", markDown);
  socket.on("error",   markDown);
}

function runHealthChecks() {
  registry.servers.forEach(probeServer);
}

/** Start the periodic health check loop and run one probe immediately. */
function start() {
  runHealthChecks(); // don't wait for the first interval
  setInterval(runHealthChecks, config.healthCheckInterval);
}

module.exports = { start };
