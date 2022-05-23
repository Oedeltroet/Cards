const data = {

  "games" : [

    {
      "name" : "Skip-Bo",
      "icon" : "img/thumbnails/skip-bo.png",
      "script" : "skip-bo.js"
    },
    
    {
      "name" : "UNO",
      "icon" : "https://upload.wikimedia.org/wikipedia/commons/f/f9/UNO_Logo.svg",
      "script" : "uno.js"
    }
  ],

  "decks" : [

    {
      "name" : "Poker",
      "styles" : [
        
        {
          "name" : "English Pattern",
          "image" : "english_pattern.svg",
          "stylesheet" : "english_pattern.css"
        }
      ],
      "suits" : [

        "clubs", "hearts", "diamonds", "spades"
      ],
      "values" : [

        "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
      ]
    },

    {
      "name" : "Skip-Bo",
      "styles" : [],
      "suits" : [],
      "values" : [

        "J", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
      ]
    }
  ]
};

var debug = true;
var server, io;
var games;

if (debug) {

  server = require("http").createServer();
  io = require("socket.io")(server, {});
}

else {
  
  const { readFileSync } = require("fs");
  const { createServer } = require("https");
  const { Server } = require("socket.io");
  var options = {};

  if (process.platform != "win32") {

    options = {

      key: readFileSync("/etc/letsencrypt/live/cards.oedel.me/privkey.pem"),
      cert: readFileSync("/etc/letsencrypt/live/cards.oedel.me/cert.pem"),
    }
  }

  server = createServer(options);
  io = new Server(server, {
    
    cors: {
        
        origin: "https://cards.oedel.me",
        methods: ["GET", "POST"]
      }
  });
}

const rooms = io.of("/").adapter.rooms;

io.on("connection", (socket) => {

  console.log("A user has connected.");

  socket.on("disconnect", () => {

    console.log("A user has disconnected.");
  });

  socket.on("REQUEST_DATA", () => {

    console.log("Sending data.");
    socket.emit("SEND_DATA", data);
  });
  
  socket.on("CREATE_GAME", (gameId) => {

    console.log("Creating new " + data.games[gameId].name + " game.");

    var roomName = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < 5; i++) {

      roomName += chars[Math.floor(Math.random() * chars.length)];
    }

    socket.join(roomName);
    socket.emit("GAME_CREATED", roomName);
    socket.emit("BECOME_LEADER");

    console.log(rooms);
  });

  socket.on("JOIN_GAME", (roomName) => {

    if (io. sockets. adapter. rooms. has(roomName)) {

      socket.join(roomName);
      socket.emit("JOIN_SUCCESSFUL", roomName);
      console.log("A user joined room " + roomName);

      if (io.sockets.adapter.rooms.get(roomName).size >= 2) {

        console.log("The game is ready.");
        io.to(roomName).emit("GAME_READY");
      }
    }

    else {

      socket.emit("JOIN_FAILED_ROOM_NOT_FOUND", roomName);
    }
  });

  socket.on("START_GAME", (gameId, roomName) => {

    let numPlayers = io.sockets.adapter.rooms.get(roomName).size;
    let playWithPokerDecks = true;

    switch (gameId) {

      case 0:

        /* SKIP-BO */

        var SkipBo = require("./scripts/games/" + data.games[gameId].script);
        var game = new SkipBo.Gamestate(numPlayers, playWithPokerDecks);

        console.log(game);

        break;

      default: break;
    }

    io.to(roomName).emit("GAME_STARTED", numPlayers, playWithPokerDecks ? data.decks[0] : data.decks[1], 0);
  });

  socket.on("LETS_PLAY", (gameId) => {

    switch (gameId) {

      case 0:

        /* SKIP-BO */

        var SkipBo = require("./scripts/games/" + data.games[gameId].script);

        break;

      default: break;
    }
  });
});

console.log("Starting server...");
server.listen(3000);