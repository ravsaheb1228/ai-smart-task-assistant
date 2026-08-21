const express = require("express");
const Task = require("../models/Task");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET all user's tasks
router.get("/", protect, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

// CREATE task
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      userId: req.user.id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
    });
  }
});

// UPDATE task
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      status,
    } = req.body;

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.priority = priority ?? task.priority;
    task.dueDate = dueDate ?? task.dueDate;
    task.status = status ?? task.status;

    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
    });
  }
});

// DELETE task
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
    });
  }
});

// MARK COMPLETE / PENDING
router.patch("/:id/complete", protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.status =
      task.status === "completed"
        ? "pending"
        : "completed";

    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task status",
    });
  }
});

module.exports = router;