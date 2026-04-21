"use strict";

/**
 * config.js
 * Central configuration for the load balancer.
 * Edit this file to change ports, backends, or algorithm defaults.
 */

module.exports = {
  // Port the load balancer listens on
  port: 8080,

  // How often to TCP-probe each backend (ms)
  healthCheckInterval: 5000,

  // How often the terminal dashboard redraws (ms)
  dashboardRefresh: 2500,

  // Starting algorithm: "round-robin" | "least-connections"
  algorithm: "round-robin",

  // Backend servers to distribute traffic across
  backends: [
    { host: "localhost", port: 3001 },
    { host: "localhost", port: 3002 },
    { host: "localhost", port: 3003 },
  ],
};
