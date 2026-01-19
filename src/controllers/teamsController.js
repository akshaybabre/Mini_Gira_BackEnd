const Team = require("../models/Team");
const Project = require("../models/Project");

/* =========================
   CREATE TEAM
========================= */
exports.createTeam = async (req, res) => {
  try {
    const { name, description, teamKey, members } = req.body;

    if (!name || name.length < 3)
      return res.status(400).json({ message: "Team name must be at least 3 characters" });

    if (!description || description.length < 10)
      return res.status(400).json({ message: "Description must be at least 10 characters" });

    const existing = await Team.findOne({ teamKey });
    if (existing) return res.status(400).json({ message: "Team key already exists" });

    const team = await Team.create({
      name,
      description,
      teamKey,
      createdBy: req.user._id,
      createdByName: req.user.name,
      members,
    });

    res.status(201).json({ message: "Team created successfully", team });

  } catch (error) {
    console.error("Create Team Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   GET ALL TEAMS (USER)
========================= */
exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ createdBy: req.user._id }).populate("members", "name email");

    res.json({ count: teams.length, teams });

  } catch (error) {
    console.error("Get Teams Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   GET SINGLE TEAM
========================= */
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("members", "name email");

    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    res.json(team);

  } catch (error) {
    console.error("Get Team Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   UPDATE TEAM
========================= */
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const allowedUpdates = ["name", "description", "status", "members", "projects"];

    Object.keys(req.body).forEach((field) => {
      if (allowedUpdates.includes(field)) {
        team[field] = req.body[field];
      }
    });

    await team.save();

    res.json({ message: "Team updated successfully", team });

  } catch (error) {
    console.error("Update Team Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   DELETE TEAM
========================= */
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await team.deleteOne();

    res.json({ message: "Team deleted successfully" });

  } catch (error) {
    console.error("Delete Team Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   GET TEAM PROJECTS
========================= */
exports.getTeamProjects = async (req, res) => {
  try {
    const teamId = req.params.id;

    const projects = await Project.find({ team: teamId });

    return res.json({
      count: projects.length,
      projects,
    });

  } catch (error) {
    console.error("Get Team Projects Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
