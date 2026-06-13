const express = require("express");
const router = express.Router();

const {
  getWorkspaceActivities,
} = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");

router.get(
  "/workspace/:workspaceId",
  protect,
  getWorkspaceActivities
);

module.exports = router;