require("dotenv").config()
const http = require("http")
const express = require("express")
const path = require("path")
const app = require("./src/app")
const { initSocket } = require("./src/config/socket")

const server = http.createServer(app)
initSocket(server)

const PORT = process.env.PORT || 5001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})