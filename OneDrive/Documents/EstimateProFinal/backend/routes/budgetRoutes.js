const express = require("express");
const Task = require("../models/Task");
const Activity = require("../models/Activity");
const router = express.Router();

// Get total budget for a project
router.get("/:projectId", async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId });
    const taskIds = tasks.map(task => task._id);

    const result = await Activity.aggregate([
      { $match: { taskId: { $in: taskIds } } },
      { $group: { _id: null, total: { $sum: "$estimatedCost" } } }
    ]);

    res.json(result[0] || { total: 0 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
