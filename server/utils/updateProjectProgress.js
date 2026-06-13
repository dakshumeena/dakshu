const Task = require("../models/Task");
const Project = require("../models/Project");

const updateProjectProgress = async (projectId) => {
  try {
    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = await Task.countDocuments({ project: projectId, status: "DONE" });

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (error) {
    console.error("updateProjectProgress error:", error.message);
  }
};

module.exports = updateProjectProgress;