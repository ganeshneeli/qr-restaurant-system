require("dotenv").config()
const http = require("http")
const express = require("express")
const path = require("path")
const app = require("./src/app")
const { initSocket } = require("./src/config/socket")

const PORT = process.env.PORT || 5001

const server = http.createServer(app)

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000;

initSocket(server).then(() => {
  server.listen(PORT, () => {
    console.log(`Server started and running on port ${PORT}`)
  })
}).catch(err => {
  console.error("Socket init failed", err);
});