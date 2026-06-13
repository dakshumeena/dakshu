const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
  getTaskComments,
  addComment,
} = require("../controllers/taskController");

router.post("/", protect, createTask);
router.get("/project/:projectId", protect, getTasksByProject);
router.get("/stats/:projectId", protect, getTaskStats);
router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

// Comment routes
router.get("/:taskId/comments", protect, getTaskComments);
router.post("/:taskId/comments", protect, addComment);

module.exports = router;