
# HTTP Load Balancer (Node.js)

## Overview

A simple HTTP load balancer built using Node.js core modules. It distributes incoming requests across multiple backend servers and demonstrates core Computer Networks concepts like load distribution, fault tolerance, and concurrency.



## Features

* Reverse proxy (no external frameworks)
* Round Robin and Least Connections algorithms
* Runtime algorithm switching (`/algorithm`)
* Health checks with automatic failover
* Real-time metrics (`/metrics`)
* Terminal and web dashboard



## Architecture

```
Client → Load Balancer → Backend Servers
```



## Run

Start backend servers:

```bash
node mockServer.js 3001
node mockServer.js 3002
node mockServer.js 3003
```

Start load balancer:

```bash
node index.js
```



## Usage

Send requests:

```bash
curl http://localhost:8080
```

Switch algorithm:

```bash
curl "http://localhost:8080/algorithm?set=least-connections"
```

View metrics:

```bash
curl http://localhost:8080/metrics
```

Dashboard:

```
http://localhost:8080/dashboard
```





