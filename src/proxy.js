"use strict";

/**
 * src/proxy.js
 * Proxy Handler — forwards client requests to a chosen backend and
 * streams the response back.
 *
 * Key behaviours:
 *   - Full request forwarding: method, path, headers, body (streamed)
 *   - Appends X-Forwarded-For so backends know the real client IP
 *   - Updates activeConns + totalRespTime on the registry entry
 *   - On backend error: marks server DOWN, returns 502
 *   - If no healthy servers exist: returns 503 immediately
 */

const http      = require("http");
const scheduler = require("./scheduler");

function handleRequest(clientReq, clientRes) {
  const srv = scheduler.pickServer();

  // No healthy backends at all
  if (!srv) {
    clientRes.writeHead(503, { "Content-Type": "text/plain" });
    clientRes.end("503 Service Unavailable — no healthy backends\n");
    return;
  }

  // Track this request on the chosen server
  srv.activeConns++;
  srv.totalRequests++;
  const startTime = Date.now();

  const options = {
    hostname: srv.host,
    port:     srv.port,
    path:     clientReq.url,
    method:   clientReq.method,
    headers:  {
      ...clientReq.headers,
      "x-forwarded-for":   clientReq.socket.remoteAddress,
      "x-forwarded-proto": "http",
    },
  };

  const backendReq = http.request(options, (backendRes) => {
    // Forward status + headers, then pipe the body stream
    clientRes.writeHead(backendRes.statusCode, backendRes.headers);
    backendRes.pipe(clientRes);

    clientRes.on("finish", () => {
    srv.activeConns    = Math.max(0, srv.activeConns - 1);
    srv.totalRespTime += Date.now() - startTime;
    });

    clientRes.on("close", () => {
    srv.activeConns = Math.max(0, srv.activeConns - 1);
    });
    
  });

  backendReq.on("error", () => {
    // Backend failed mid-request — mark it DOWN immediately
    srv.activeConns = Math.max(0, srv.activeConns - 1);
    srv.status      = "DOWN";

    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { "Content-Type": "text/plain" });
      clientRes.end(`502 Bad Gateway — backend ${srv.label} unreachable\n`);
    }
  });

  // Pipe the incoming request body (POST/PUT/PATCH) to the backend
  clientReq.pipe(backendReq);
}

module.exports = { handleRequest };
