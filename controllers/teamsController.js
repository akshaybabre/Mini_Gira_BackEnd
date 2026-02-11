const Team = require("../models/Team");
const Project = require("../models/Project");
const User = require("../models/User");
const Company = require("../models/Company");

/**
 * @desc   Create Team
 * @route  POST /api/teams
 * @access Admin
 */
exports.createTeam = async (req, res) => {
  try {
    const { projectId, name, description, key, members = [], status } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!projectId || !name || !key) {
      return res.status(400).json({
        message: "projectId, name and key are required",
      });
    }

    /* ================= PROJECT ================= */
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    /* ================= COMPANY ================= */
    const company = await Company.findById(project.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company._id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    /* ================= USER (CREATOR) ================= */
    const creator = await User.findById(req.user._id);
    if (!creator) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ================= UNIQUE KEY ================= */
    const existingTeam = await Team.findOne({
      "project.id": projectId,
      key: key.toUpperCase(),
    });

    if (existingTeam) {
      return res.status(409).json({
        message: "Team key already exists in this project",
      });
    }

    /* ================= MEMBERS VALIDATION ================= */
    if (members.length > 0) {
      const invalidMembers = members.filter(
        (m) => !project.members.map(String).includes(m.toString())
      );

      if (invalidMembers.length > 0) {
        return res.status(400).json({
          message: "All team members must belong to the project",
        });
      }
    }

    /* ================= CREATE TEAM ================= */
    const team = await Team.create({
      company: {
        id: company._id,
        name: company.name,
      },
      project: {
        id: project._id,
        name: project.name,
      },
      name: name.trim(),
      description: description?.trim() || "",
      key: key.toUpperCase(),
      status: status || "Active",
      members,
      createdBy: {
        id: creator._id,
        name: creator.name,
      },
    });

    res.status(201).json({
      message: "Team created successfully",
      team,
    });

  } catch (error) {
    console.error("CREATE TEAM ERROR 👉", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


/**
 * @desc   Get My Teams
 */
exports.getMyTeams = async (req, res) => {
  try {
    let query = { "company.id": req.user.company };

    if (req.user.role === "admin") {
      query["createdBy.id"] = req.user._id;
    } else {
      query.members = req.user._id;
    }

    const teams = await Team.find(query).sort({ createdAt: -1 });

    res.status(200).json({ count: teams.length, teams });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * @desc   Get Team By ID
 */
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.company.id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (
      req.user.role === "member" &&
      !team.members.map(String).includes(req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(team);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/**
 * @desc   Update Team
 */
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, status, members } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.company.id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (team.createdBy.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only team creator can update this team",
      });
    }

    if (members) {
      const project = await Project.findById(team.project.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const invalidMembers = members.filter(
        (m) => !project.members.map(String).includes(m.toString())
      );

      if (invalidMembers.length > 0) {
        return res.status(400).json({
          message: "All team members must belong to the project",
        });
      }

      team.members = members;
    }

    if (name !== undefined) team.name = name.trim();
    if (description !== undefined) team.description = description.trim();
    if (status !== undefined) team.status = status;

    await team.save();

    res.status(200).json({
      message: "Team updated successfully",
      team,
    });

  } catch (error) {
    console.error("UPDATE TEAM ERROR 👉", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


/**
 * @desc   Delete Team
 */
exports.deleteTeam = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.company.id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (team.createdBy.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only team creator can delete this team",
      });
    }

    await team.deleteOne();

    res.status(200).json({ message: "Team deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};