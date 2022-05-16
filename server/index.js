import { readFileSync } from "fs";
import { createServer } from "https";
import { Server } from "socket.io";

const httpServer = createServer({
  key: readFileSync("/etc/letsencrypt/live/cards.oedel.me/privkey.pem"),
  cert: readFileSync("/etc/letsencrypt/live/cards.oedel.me/cert.pem"),
});

const io = new Server(httpServer, { /* options */ });

io.on("connection", (socket) => {
  console.log("A user has connected.");
  // ...
});

httpServer.listen(3000);