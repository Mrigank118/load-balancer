"use strict";

/**
 * mockServer.js
 * Lightweight mock backend — simulates a real app server for testing.
 * Usage: node mockServer.js <port>
 */

const http = require("http");
const port = parseInt(process.argv[2]) || 3001;

let requestCount = 0;

http.createServer((req, res) => {
  requestCount++;
  const count = requestCount;

  // Simulate variable response latency (50–200 ms)
  let delay;

  if (req.url === "/slow") {
    delay = 10000; // 2 seconds
  } else {
    delay = 50 + Math.floor(Math.random() * 150);
  }

  setTimeout(() => {
    const body = JSON.stringify({
      server:  `backend:${port}`,
      request: count,
      path:    req.url,
      method:  req.method,
      time:    new Date().toISOString(),
    });

    res.writeHead(200, {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(body),
      "X-Served-By":    `mock-${port}`,
    });
    res.end(body);
  }, delay);

}).listen(port, () => {
  console.log(`Mock backend listening on port ${port}`);
});
