"use strict";


const net      = require("net");
const config   = require("../config");
const registry = require("./registry");

const PROBE_TIMEOUT_MS = 2000;

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


function start() {
  runHealthChecks(); 
  setInterval(runHealthChecks, config.healthCheckInterval);
}

module.exports = { start };
