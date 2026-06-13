const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
  acceptInvitation,
  getInvitationDetails,
} = require("../controllers/projectController");

router.post("/", protect, createProject);
router.get("/workspace/:workspaceId", protect, getProjectsByWorkspace);
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/members", protect, addMemberToProject);

// Invitation routes
router.get("/invite/:token", getInvitationDetails);       // public — show invite info
router.post("/invite/:token/accept", protect, acceptInvitation); // requires login

module.exports = router;