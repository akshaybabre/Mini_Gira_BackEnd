const Sprint = require("../models/Sprint");
const Project = require("../models/Project");
const Task = require("../models/Task");

/**
 * =========================
 * ADMIN: CREATE SPRINT
 * =========================
 */
exports.createSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { projectId, name, goal, startDate, endDate } = req.body;

    if (!projectId || !name || !startDate || !endDate) {
      return res.status(400).json({
        message: "projectId, name, startDate and endDate are required",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "endDate must be after startDate" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    const sprint = await Sprint.create({
      company: req.user.company,
      project: projectId,
      name,
      goal,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Sprint created successfully",
      sprint,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Only one active sprint allowed per project" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * GET SPRINTS (PROJECT-WISE)
 * =========================
 */
exports.getSprints = async (req, res) => {
  try {
    const { projectId } = req.query;

    let query = { company: req.user.company };

    if (req.user.role === "admin") {
      if (!projectId) {
        return res
          .status(400)
          .json({ message: "projectId is required" });
      }
      query.project = projectId;
    } else {
      // member: only projects where member exists
      query.project = { $in: req.user.projects || [] };
    }

    const sprints = await Sprint.find(query).sort({ startDate: -1 });

    res.status(200).json({ count: sprints.length, sprints });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * GET SPRINT BY ID
 * =========================
 */
exports.getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    if (sprint.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    // member access: must belong to project
    if (req.user.role === "member") {
      const project = await Project.findById(sprint.project);
      if (
        !project.members.map(String).includes(req.user._id.toString())
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.status(200).json(sprint);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * ADMIN: UPDATE SPRINT
 * =========================
 */
exports.updateSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    if (sprint.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only creator admin can update this sprint" });
    }

    if (sprint.status === "Completed") {
      return res
        .status(400)
        .json({ message: "Completed sprint cannot be updated" });
    }

    const { name, goal, startDate, endDate, status } = req.body;

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "endDate must be after startDate" });
    }

    if (status === "Active") {
      const activeSprint = await Sprint.findOne({
        project: sprint.project,
        status: "Active",
      });

      if (activeSprint && activeSprint._id.toString() !== sprint._id.toString()) {
        return res.status(400).json({
          message: "Complete the existing active sprint first",
        });
      }
    }

    if (name !== undefined) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;
    if (status !== undefined) sprint.status = status;

    await sprint.save();

    res.status(200).json({
      message: "Sprint updated successfully",
      sprint,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Only one active sprint allowed per project" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * ADMIN: COMPLETE SPRINT
 * =========================
 */
exports.completeSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    if (sprint.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only creator admin can complete this sprint" });
    }

    if (sprint.status !== "Active") {
      return res
        .status(400)
        .json({ message: "Only active sprint can be completed" });
    }

    sprint.status = "Completed";
    await sprint.save();

    res.status(200).json({
      message: "Sprint completed successfully",
      sprint,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * ADMIN: DELETE SPRINT
 * =========================
 */
exports.deleteSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    if (sprint.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only creator admin can delete this sprint" });
    }

    const tasksCount = await Task.countDocuments({ sprint: sprint._id });
    if (tasksCount > 0) {
      return res.status(400).json({
        message: "Sprint cannot be deleted as tasks are assigned",
      });
    }

    await sprint.deleteOne();

    res.status(200).json({ message: "Sprint deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};