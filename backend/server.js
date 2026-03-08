require("dotenv").config()
const http = require("http")
const express = require("express")
const path = require("path")
const app = require("./src/app")
const cluster = require("cluster")
const os = require("os")
const { initSocket } = require("./src/config/socket")

const PORT = process.env.PORT || 5001

if (cluster.isPrimary) {
  // Render sets WEB_CONCURRENCY based on available memory
  const numCPUs = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : os.cpus().length;
  console.log(`Primary ${process.pid} is running with ${numCPUs} workers`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork(); // Replace the dead worker
  });
} else {
  const server = http.createServer(app)
  initSocket(server)

  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000;

  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started and running on port ${PORT}`)
  })
}