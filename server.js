const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};

io.on("connection", socket => {
  players[socket.id] = {
    id: socket.id,
    name: "Angler",
    x: 0,
    z: 0,
    coins: 100
  };

  socket.emit("init", {
    id: socket.id,
    players
  });

  socket.broadcast.emit("playerJoined", players[socket.id]);

  socket.on("move", data => {
    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].z = data.z;

    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("setName", name => {
    if (!players[socket.id]) return;
    players[socket.id].name = String(name).slice(0, 16);
    io.emit("playerMoved", players[socket.id]);
  });

  socket.on("catchFish", () => {
    if (!players[socket.id]) return;

    const fish = [
      { name: "Small Fish", price: 10, chance: 60 },
      { name: "Golden Fish", price: 50, chance: 25 },
      { name: "Rare Shark", price: 150, chance: 12 },
      { name: "SECRET DRAGON FISH", price: 1000, chance: 3 }
    ];

    const roll = Math.random() * 100;
    let total = 0;
    let caught = fish[0];

    for (const item of fish) {
      total += item.chance;
      if (roll <= total) {
        caught = item;
        break;
      }
    }

    players[socket.id].coins += caught.price;

    socket.emit("caught", {
      fish: caught,
      coins: players[socket.id].coins
    });

    io.emit("playerMoved", players[socket.id]);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Fishing World berjalan di port 3000");
});
