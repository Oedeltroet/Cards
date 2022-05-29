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

var debug = false;
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

  var currentRoomName = "";
  var numPlayers = 0;

  socket.on("disconnect", () => {

    console.log("A user has disconnected.");
  });

  socket.on("REQUEST_DATA", () => {

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

    currentRoomName = roomName;
    numPlayers = io.sockets.adapter.rooms.get(roomName).size;
    
    socket.emit("GAME_CREATED", roomName);
    socket.emit("BECOME_LEADER");

    console.log(rooms);
  });

  socket.on("JOIN_GAME", (roomName) => {

    if (io.sockets.adapter.rooms.has(roomName)) {

      currentRoomName = roomName;

      socket.join(roomName);
      socket.emit("JOIN_SUCCESSFUL", roomName);
      console.log("A user joined room " + roomName);

      numPlayers = io.sockets.adapter.rooms.get(roomName).size;

      if (numPlayers >= 2 && numPlayers <= 6) {

        console.log("The game is ready (" + numPlayers + " players)");
        io.to(roomName).emit("GAME_READY", numPlayers);
      }

      else if (numPlayers > 6) {

        console.log("Too many players!");
        io.to(roomName).emit("TOO_MANY_PLAYERS", numPlayers);
      }
    }

    else {

      socket.emit("JOIN_FAILED_ROOM_NOT_FOUND", roomName);
    }
  });

  socket.on("disconnect", () => {

    if (io. sockets. adapter. rooms. has(currentRoomName)) {

      numPlayers = io.sockets.adapter.rooms.get(currentRoomName).size;

      if (numPlayers >= 2 && numPlayers <= 6) {

        console.log("The game is ready (" + numPlayers + " players)");
        io.to(currentRoomName).emit("GAME_READY", numPlayers);
      }

      else if (numPlayers > 6) {

        console.log("Too many players!");
        io.to(currentRoomName).emit("TOO_MANY_PLAYERS", numPlayers);
      }

      else if (numPlayers < 2) {

        console.log("Not enough players!");
        io.to(currentRoomName).emit("NOT_ENOUGH_PLAYERS", numPlayers);
      }
    }
  });

  let games = new Map();

  socket.on("START_GAME", (gameId, roomName) => {

    let players = io.sockets.adapter.rooms.get(roomName);
    let numPlayers = players.size;
    let playWithPokerDecks = true;
    let game;
    let gameLogic;

    switch (gameId) {

      case 0:

        /* SKIP-BO */

        gameLogic = require("./scripts/games/" + data.games[gameId].script);
        
        games.set(roomName, new gameLogic.Gamestate(numPlayers, playWithPokerDecks));

        game = games.get(roomName);
        console.log(game);

        io.to(roomName).emit("GAME_STARTED", numPlayers, playWithPokerDecks ? data.decks[0] : data.decks[1], 0);

        for (let i = 0; i < numPlayers; i++) {

          io.to(players).emit("ASSIGN_PLAYER_ID", i);

          let stockPile = game.playerCards[i][0];
          io.to(roomName).emit("UPDATE_STOCK_PILE", i, stockPile.size, stockPile.topCard.suit, stockPile.topCard.value);
        }

        break;

      default: break;
    }
  });

  socket.on("LETS_PLAY", (gameId, roomName) => {

    switch (gameId) {

      case 0:

        /* SKIP-BO */

        let game = games.get(roomName);



        break;

      default: break;
    }
  });
});

console.log("Starting server...");
server.listen(3000);