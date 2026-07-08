const Message = require("../models/Message");

const activeUsers = new Map();

const getUsersInRoom = (roomName) => {
  return Array.from(activeUsers.values())
    .filter((user) => user.room === roomName)
    .map((user) => user.username);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // ==========================
    // JOIN ROOM
    // ==========================
    socket.on("joinRoom", async ({ username, room }) => {
      const previousRoom = activeUsers.get(socket.id)?.room;

      if (previousRoom) {
        socket.leave(previousRoom);
        io.to(previousRoom).emit(
          "onlineUsers",
          getUsersInRoom(previousRoom)
        );
      }

      socket.join(room);
      activeUsers.set(socket.id, { username, room });

      try {
        console.log(`Loading history for room: ${room}`);

        const history = await Message.find({ room })
          .sort({ timestamp: 1 })
          .limit(50);

        console.log(`Found ${history.length} messages`);

        socket.emit("chatHistory", history);
      } catch (err) {
        console.error("History Error:", err);
      }

      io.to(room).emit("onlineUsers", getUsersInRoom(room));
    });

    // ==========================
    // CHAT MESSAGE
    // ==========================
    socket.on("chatMessage", async ({ room, username, text }) => {
      console.log("\n===============================");
      console.log("NEW MESSAGE RECEIVED");
      console.log("===============================");
      console.log("Room :", room);
      console.log("User :", username);
      console.log("Text :", text);

      if (!text || !text.trim()) {
        console.log("Empty message ignored.");
        return;
      }

      try {
        const newMessage = await Message.create({
          room,
          username,
          text,
        });

        console.log("Saved Successfully:");
        console.log(newMessage);

        io.to(room).emit("chatMessage", newMessage);
      } catch (err) {
        console.error("Message Save Error:");
        console.error(err);
      }
    });

    // ==========================
    // TYPING
    // ==========================
    socket.on("typing", ({ room, username, isTyping }) => {
      socket.to(room).emit("typing", {
        username,
        isTyping,
      });
    });

    // ==========================
    // DISCONNECT
    // ==========================
    socket.on("disconnect", () => {
      console.log(`Client Disconnected : ${socket.id}`);

      const userData = activeUsers.get(socket.id);

      if (userData) {
        activeUsers.delete(socket.id);

        io.to(userData.room).emit(
          "onlineUsers",
          getUsersInRoom(userData.room)
        );
      }
    });
  });
};