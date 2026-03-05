require("dotenv").config()
const http = require("http")
const express = require("express")
const path = require("path")
const app = require("./src/app")
const { initSocket } = require("./src/config/socket")

const server = http.createServer(app)
initSocket(server)

server.listen(process.env.PORT, () => {
  console.log("Server running")
})