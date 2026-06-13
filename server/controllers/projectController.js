const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const createActivity = require("../utils/createActivity");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const createProject = async (req, res) => {
  try {
    const {
      name, description, workspace, status,
      priority, start_date, end_date, team_lead, team_members,
    } = req.body;

    const project = await Project.create({
      name, description, workspace, status, priority,
      start_date, end_date,
      team_lead: team_lead || req.user.id,
    });

    // Add creator as member
    const memberSet = new Set([req.user.id]);
    if (team_lead) memberSet.add(team_lead);
    if (Array.isArray(team_members)) team_members.forEach((e) => memberSet.add(e));

    // Resolve emails → user ids
    const resolvedIds = await Promise.all(
      [...memberSet].map(async (idOrEmail) => {
        if (idOrEmail.includes("@")) {
          const u = await User.findOne({ email: idOrEmail });
          return u ? u._id.toString() : null;
        }
        return idOrEmail;
      })
    );

    const uniqueIds = [...new Set(resolvedIds.filter(Boolean))];
    await ProjectMember.insertMany(
      uniqueIds.map((uid) => ({ user: uid, project: project._id })),
      { ordered: false }
    ).catch(() => {});

    await createActivity({
      action: "Project Created",
      entityType: "PROJECT",
      entityId: project._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    const populated = await Project.findById(project._id)
      .populate("team_lead", "name email image");

    res.status(201).json({ success: true, project: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProjectsByWorkspace = async (req, res) => {
  try {
    const projects = await Project.find({ workspace: req.params.workspaceId })
      .populate("team_lead", "name email image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team_lead", "name email image");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const members = await ProjectMember.find({ project: project._id })
      .populate("user", "name email image");

    res.status(200).json({ success: true, project: { ...project.toObject(), members } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("team_lead", "name email image");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await createActivity({
      action: "Project Updated",
      entityType: "PROJECT",
      entityId: project._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await createActivity({
      action: "Project Deleted",
      entityType: "PROJECT",
      entityId: project._id,
      user: req.user.id,
      workspace: project.workspace,
    });

    await ProjectMember.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMemberToProject = async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const existingUser = await User.findOne({ email });

    // If user already exists and is already a member, short-circuit
    if (existingUser) {
      const existingMember = await ProjectMember.findOne({ user: existingUser._id, project: project._id });
      if (existingMember) {
        return res.status(400).json({ success: false, message: "User already a project member" });
      }
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Remove any previous pending invites for this email+project
    await Invitation.deleteMany({ email, project: project._id, status: "PENDING" });

    const invitation = await Invitation.create({
      email,
      project: project._id,
      workspace: project.workspace,
      invitedBy: req.user.id,
      token,
      expiresAt,
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;

    await sendEmail({
      to: email,
      subject: `You're invited to join the project "${project.name}"`,
      html: `
        <h2>Project Invitation</h2>
        <p>You've been invited to join the project <b>${project.name}</b> on ProjectFlow.</p>
        <p>Click below to accept the invitation:</p>
        <a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none;">Join Project</a>
        <p style="color:#888;font-size:12px;margin-top:20px;">This link expires in 7 days. If you don't have an account, you'll be asked to register first.</p>
      `,
    });

    res.status(200).json({ success: true, message: "Invitation email sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// New: accept invitation
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invalid or expired invitation" });
    }

    if (invitation.status === "ACCEPTED") {
      return res.status(400).json({ success: false, message: "Invitation already used" });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "EXPIRED";
      await invitation.save();
      return res.status(400).json({ success: false, message: "Invitation has expired" });
    }

    // req.user is set by protect middleware — the logged-in user accepting the invite
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Optional: ensure the logged-in user's email matches the invited email
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project no longer exists" });
    }

    // Add to project members
    const existing = await ProjectMember.findOne({ user: user._id, project: project._id });
    if (!existing) {
      await ProjectMember.create({ user: user._id, project: project._id });
    }

    // Also add to workspace members if not already
    const Workspace = require("../models/Workspace");
    const workspace = await Workspace.findById(invitation.workspace);
    if (workspace && !workspace.members.includes(user._id)) {
      workspace.members.push(user._id);
      await workspace.save();
    }

    invitation.status = "ACCEPTED";
    await invitation.save();

    await createActivity({
      action: `${user.name} joined project "${project.name}"`,
      entityType: "PROJECT",
      entityId: project._id,
      user: user._id,
      workspace: project.workspace,
    });

    res.status(200).json({
      success: true,
      message: "You have joined the project successfully",
      project: { _id: project._id, name: project.name, workspace: project.workspace },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// New: get invitation details (for the invite page to show before login)
const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token }).populate("project", "name").populate("invitedBy", "name");

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invalid or expired invitation" });
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "This invitation is no longer valid" });
    }

    res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        projectName: invitation.project?.name,
        invitedBy: invitation.invitedBy?.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
  acceptInvitation,
  getInvitationDetails,
};