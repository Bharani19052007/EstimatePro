const express = require("express");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

// Simple test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
