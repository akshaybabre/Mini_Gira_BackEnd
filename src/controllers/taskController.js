const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");

/**
 * =========================
 * ADMIN: CREATE TASK
 * =========================
 */
exports.createTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      projectId,
      teamId,
      title,
      description,
      priority,
      assignedTo,
      sprint,
    } = req.body;

    if (!projectId || !teamId || !title || !assignedTo) {
      return res.status(400).json({
        message: "projectId, teamId, title and assignedTo are required",
      });
    }

    // validate project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    // validate team
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.project.toString() !== projectId) {
      return res
        .status(400)
        .json({ message: "Team does not belong to this project" });
    }

    // validate assigned user
    const user = await User.findById(assignedTo);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.company.toString() !== req.user.company.toString()) {
      return res
        .status(400)
        .json({ message: "User does not belong to this company" });
    }

    if (
      !project.members.map(String).includes(assignedTo.toString()) ||
      !team.members.map(String).includes(assignedTo.toString())
    ) {
      return res.status(400).json({
        message: "Assigned user must belong to project and team",
      });
    }

    const task = await Task.create({
      company: req.user.company,
      project: projectId,
      team: teamId,
      title,
      description,
      priority,
      assignedTo,
      sprint: sprint || null,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * GET TASKS (ADMIN / MEMBER)
 * =========================
 */
exports.getTasks = async (req, res) => {
  try {
    const { project, team, status } = req.query;

    let query = { company: req.user.company };

    if (req.user.role === "admin") {
      if (project) query.project = project;
      if (team) query.team = team;
      if (status) query.status = status;
    } else {
      query.assignedTo = req.user._id;
      if (status) query.status = status;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * GET TASK BY ID
 * =========================
 */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (
      req.user.role === "member" &&
      task.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * ADMIN: UPDATE TASK
 * =========================
 */
exports.updateTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only creator admin can update this task" });
    }

    const { title, description, priority, assignedTo, sprint } = req.body;

    if (assignedTo) {
      const team = await Team.findById(task.team);

      if (!team.members.map(String).includes(assignedTo.toString())) {
        return res.status(400).json({
          message: "Reassigned user must belong to the team",
        });
      }

      task.assignedTo = assignedTo;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (sprint !== undefined) task.sprint = sprint;

    await task.save();

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * MEMBER: UPDATE TASK STATUS
 * =========================
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    if (req.user.role !== "member") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your task" });
    }

    const validTransitions = {
      Todo: ["In_Progress"],
      In_Progress: ["Blocked", "Completed"],
      Blocked: ["In_Progress"],
    };

    if (
      !validTransitions[task.status] ||
      !validTransitions[task.status].includes(status)
    ) {
      return res.status(400).json({
        message: `Invalid status transition from ${task.status} to ${status}`,
      });
    }

    task.status = status;
    await task.save();

    res.status(200).json({
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * =========================
 * ADMIN: DELETE TASK
 * =========================
 */
exports.deleteTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only creator admin can delete this task" });
    }

    await task.deleteOne();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};