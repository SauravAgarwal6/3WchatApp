const Room = require('../models/Room');

const getRooms = async (req, res, next) => {
  try {
    let rooms = await Room.find();

    if (rooms.length === 0) {
      rooms = await Room.insertMany([
        { name: "General" },
        { name: "Coding" },
        { name: "Gaming" }
      ]);
    }

    res.status(200).json(rooms);
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const existing = await Room.findOne({
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({
        message: "Room already exists"
      });
    }

    const room = await Room.create({
      name: name.trim()
    });

    // Notify all connected clients
    req.app.get("io").emit("roomCreated", room);

    res.status(201).json(room);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  createRoom
};