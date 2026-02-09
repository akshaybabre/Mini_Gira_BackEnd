const Sprint = require("../models/Sprint");
const Project = require("../models/Project");
const Task = require("../models/Task");

/* =====================================================
   ADMIN: CREATE SPRINT
===================================================== */
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

    // 🔹 project fetch (company + name mil jayega)
    const project = await Project.findOne({
      _id: projectId,
      company: req.user.company,
    }).populate("company", "name");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const sprint = await Sprint.create({
      company: {
        id: project.company._id,
        name: project.company.name, // ✅ FIX
      },
      project: {
        id: project._id,
        name: project.name, // ✅ already working
      },
      name: name.trim(),
      goal: goal?.trim(),
      startDate,
      endDate,
      createdBy: {
        id: req.user._id,
        name: req.user.name,
      },
    });

    res.status(201).json({
      message: "Sprint created successfully",
      sprint,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SPRINTS (PROJECT WISE)
===================================================== */
exports.getSprints = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const sprints = await Sprint.find({
      "company.id": req.user.company,
      "project.id": projectId,
    }).sort({ startDate: -1 });

    res.status(200).json({
      count: sprints.length,
      sprints,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SPRINT BY ID
===================================================== */
exports.getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findOne({
      _id: req.params.id,
      "company.id": req.user.company,
    });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    res.status(200).json(sprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ADMIN: UPDATE SPRINT
===================================================== */
exports.updateSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sprint = await Sprint.findOne({
      _id: req.params.id,
      "company.id": req.user.company,
    });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
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
        "project.id": sprint.project.id,
        status: "Active",
      });

      if (
        activeSprint &&
        activeSprint._id.toString() !== sprint._id.toString()
      ) {
        return res.status(400).json({
          message: "Complete the existing active sprint first",
        });
      }
    }

    if (name !== undefined) sprint.name = name.trim();
    if (goal !== undefined) sprint.goal = goal.trim();
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;
    if (status !== undefined) sprint.status = status;

    await sprint.save();

    res.status(200).json({
      message: "Sprint updated successfully",
      sprint,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ADMIN: COMPLETE SPRINT
===================================================== */
exports.completeSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sprint = await Sprint.findOne({
      _id: req.params.id,
      "company.id": req.user.company,
      status: "Active",
    });

    if (!sprint) {
      return res.status(404).json({ message: "Active sprint not found" });
    }

    sprint.status = "Completed";
    await sprint.save();

    res.status(200).json({
      message: "Sprint completed successfully",
      sprint,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ADMIN: DELETE SPRINT
===================================================== */
exports.deleteSprint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sprint = await Sprint.findOne({
      _id: req.params.id,
      "company.id": req.user.company,
    });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    const taskCount = await Task.countDocuments({ sprint: sprint._id });
    if (taskCount > 0) {
      return res.status(400).json({
        message: "Sprint cannot be deleted as tasks are assigned",
      });
    }

    await sprint.deleteOne();

    res.status(200).json({
      message: "Sprint deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};