const io = require("socket.io-client");
const socket = io("http://localhost:5001", {
  auth: { token: "fake-admin" },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected", socket.id);
  socket.emit("joinAdmin");
});
socket.on("joinAdminSuccess", () => console.log("Joined admin"));
socket.on("orderCreated", (d) => console.log("orderCreated", d));
socket.on("tableStatusChanged", (d) => console.log("tableStatusChanged", d));
