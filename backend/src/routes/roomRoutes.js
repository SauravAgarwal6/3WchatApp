const express = require("express");
const {
  getRooms,
  createRoom
} = require("../controllers/roomController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getRooms);

router.post("/", protect, createRoom);

module.exports = router;