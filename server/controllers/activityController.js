const Activity = require("../models/Activity");

const getWorkspaceActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const activities = await Activity.find({
      workspace: req.params.workspaceId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100)); // cap at 100

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getWorkspaceActivities,
};