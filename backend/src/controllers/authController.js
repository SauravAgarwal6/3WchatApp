const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, password: hashedPassword });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: { id: user._id, username: user.username }, token });
  } catch (error) {
    next(error); 
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log("Request Body:", req.body);

    const user = await User.findOne({ username }).select("+password");

    console.log("User:", user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Password from DB:", user.password);
    console.log("Password from request:", password);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = { register, login };