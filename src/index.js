const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocation } = require("./utils/messages");
const { addUser, removeUser, getUser, getUserInRoom } = require("./utils/user");

const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

server.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("New websocket connection");
  socket.on("join", (options, callback) => {
    //{ username, room, createdAt }
    const { error, user } = addUser({
      id: socket.id,
      ...options,
    });
    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joind the discussion!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });
    callback;
  });

  socket.on("sendMessage", (msg, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowded");
    }
    console.log('user sendMessageEvent :: ', user)
    //io.to(user.room).emit("message", generateMessage(user.username, msg));
    callback("Delivered");
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "messageLocation",
      generateLocation(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const u = getUser(socket.id);
    const user = removeUser(socket.id);
    if (user)
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", ` ${user.username} has left the discussion`)
      );
    // io.to(u.room).emit("roomData", {
    //   room: u.room,
    //   users: getUserInRoom(user.room),
    // });
  });
});
