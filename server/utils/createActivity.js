const Activity = require("../models/Activity");

const createActivity = async ({
  action,
  entityType,
  entityId,
  user,
  workspace,
}) => {
  console.log("createActivity called");

  try {
    const activity = await Activity.create({
      action,
      entityType,
      entityId,
      user,
      workspace,
    });

    console.log("Activity Created:", activity._id);
  } catch (error) {
    console.error("Activity Log Error:", error.message);
  }
};

module.exports = createActivity;