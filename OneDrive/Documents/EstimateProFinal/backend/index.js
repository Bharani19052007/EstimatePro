const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { connectDatabase } = require('./config/database');

const app = express();

// Handle preflight requests
app.options('*', cors({
  origin: ['http://localhost:8080', 'http://localhost:8082'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8082'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());

// Connect to MongoDB with enhanced configuration (using Compass connection)
connectDatabase('compass');

// API Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/budget", require("./routes/budgetRoutes"));
app.use("/api/activity-log", require("./routes/activityLogRoutes"));
app.use("/api/estimations", require("./routes/estimationRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/team-members", require("./routes/teamMemberRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/test", require("./routes/testRoutes"));

app.get("/", (req, res) => {
  res.send("Project Estimation Manager Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
