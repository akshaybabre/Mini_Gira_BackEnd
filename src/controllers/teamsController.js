const Team = require("../models/Team");
const Project = require("../models/Project");
const User = require("../models/User");

/**
 * @desc   Create Team
 * @route  POST /api/teams
 * @access Admin
 */
exports.createTeam = async (req, res) => {
  try {
    const { projectId, name, description, key, members } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!projectId || !name || !key) {
      return res
        .status(400)
        .json({ message: "projectId, name and key are required" });
    }

    // validate project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    // unique team key per project
    const existingTeam = await Team.findOne({
      project: projectId,
      key: key.toUpperCase(),
    });

    if (existingTeam) {
      return res
        .status(409)
        .json({ message: "Team key already exists in this project" });
    }

    // validate members (if provided)
    if (members && members.length > 0) {
      // project members check
      const invalidMembers = members.filter(
        (m) => !project.members.map(String).includes(m.toString())
      );

      if (invalidMembers.length > 0) {
        return res.status(400).json({
          message: "All team members must belong to the project",
        });
      }
    }

    const team = await Team.create({
      company: req.user.company,
      project: projectId,
      name,
      description,
      key: key.toUpperCase(),
      members: members || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc   Get My Teams
 * @route  GET /api/teams
 * @access Admin / Member
 */
exports.getMyTeams = async (req, res) => {
  try {
    let query = { company: req.user.company };

    if (req.user.role === "admin") {
      query.createdBy = req.user._id;
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
 * @route  GET /api/teams/:id
 * @access Admin / Member (if part of team)
 */
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.company.toString() !== req.user.company.toString()) {
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
 * @route  PUT /api/teams/:id
 * @access Admin (Creator only)
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

    if (team.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (team.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only team creator can update this team" });
    }

    // validate members
    if (members) {
      const project = await Project.findById(team.project);
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

    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;
    if (status !== undefined) team.status = status;

    await team.save();

    res.status(200).json({
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc   Delete Team
 * @route  DELETE /api/teams/:id
 * @access Admin (Creator only)
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

    if (team.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (team.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only team creator can delete this team" });
    }

    await team.deleteOne();

    res.status(200).json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};