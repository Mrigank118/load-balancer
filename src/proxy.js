"use strict";



const http      = require("http");
const scheduler = require("./scheduler");

function handleRequest(clientReq, clientRes) {
  const srv = scheduler.pickServer();

 
  if (!srv) {
    clientRes.writeHead(503, { "Content-Type": "text/plain" });
    clientRes.end("503 Service Unavailable — no healthy backends\n");
    return;
  }

  
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
  
    srv.activeConns = Math.max(0, srv.activeConns - 1);
    srv.status      = "DOWN";

    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { "Content-Type": "text/plain" });
      clientRes.end(`502 Bad Gateway — backend ${srv.label} unreachable\n`);
    }
  });


  clientReq.pipe(backendReq);
}

module.exports = { handleRequest };
