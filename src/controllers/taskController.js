const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");
const Company = require("../models/Company");

/* =========================
   CREATE TASK (ADMIN)
========================= */
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

    /* ===== PROJECT ===== */
    const project = await Project.findById(projectId);
    if (!project)
      return res.status(404).json({ message: "Project not found" });

    /* ===== COMPANY ===== */
    const company = await Company.findById(project.company);
    if (!company)
      return res.status(404).json({ message: "Company not found" });

    if (company._id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    /* ===== TEAM ===== */
    const team = await Team.findById(teamId);
    if (!team)
      return res.status(404).json({ message: "Team not found" });

    if (team.project.id.toString() !== projectId) {
      return res
        .status(400)
        .json({ message: "Team does not belong to this project" });
    }

    /* ===== ASSIGNED USER ===== */
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser)
      return res.status(404).json({ message: "User not found" });

    if (assignedUser.company.toString() !== company._id.toString()) {
      return res.status(400).json({
        message: "User does not belong to this company",
      });
    }

    if (
      !project.members.map(String).includes(assignedTo.toString()) ||
      !team.members.map(String).includes(assignedTo.toString())
    ) {
      return res.status(400).json({
        message: "Assigned user must belong to project and team",
      });
    }

    /* ===== CREATOR ===== */
    const creator = await User.findById(req.user._id);

    /* ===== CREATE TASK ===== */
    const task = await Task.create({
      company: {
        id: company._id,
        name: company.name,
      },
      project: {
        id: project._id,
        name: project.name,
      },
      team: {
        id: team._id,
        name: team.name,
      },
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "Medium",
      assignedTo: {
        id: assignedUser._id,
        name: assignedUser.name,
      },
      sprint: sprint || null,
      createdBy: {
        id: creator._id,
        name: creator.name,
      },
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });

  } catch (error) {
    console.error("CREATE TASK ERROR 👉", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* =========================
   GET TASKS
========================= */
exports.getTasks = async (req, res) => {
  try {
    const { project, team, status } = req.query;

    let query = { "company.id": req.user.company };

    if (req.user.role === "admin") {
      if (project) query["project.id"] = project;
      if (team) query["team.id"] = team;
      if (status) query.status = status;
    } else {
      query["assignedTo.id"] = req.user._id;
      if (status) query.status = status;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    res.status(200).json({ count: tasks.length, tasks });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* =========================
   GET TASK BY ID
========================= */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.company.id.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (
      req.user.role === "member" &&
      task.assignedTo.id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(task);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* =========================
   UPDATE TASK (ADMIN)
========================= */
exports.updateTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only creator admin can update this task",
      });
    }

    const { title, description, priority, assignedTo, sprint } = req.body;

    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user)
        return res.status(404).json({ message: "User not found" });

      task.assignedTo = {
        id: user._id,
        name: user.name,
      };
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined)
      task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (sprint !== undefined) task.sprint = sprint;

    await task.save();

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });

  } catch (error) {
    console.error("UPDATE TASK ERROR 👉", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* =========================
   UPDATE TASK STATUS (MEMBER)
========================= */
exports.updateTaskStatus = async (req, res) => {
  try {
    if (req.user.role !== "member") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.assignedTo.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your task" });
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


/* =========================
   DELETE TASK (ADMIN)
========================= */
exports.deleteTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only creator admin can delete this task",
      });
    }

    await task.deleteOne();

    res.status(200).json({ message: "Task deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getCompanyMembers = async (req, res) => {
  try {
    // sirf admin allowed
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const members = await User.find({
      company: req.user.company,
      role: "member",
      isActive: true,
    }).select("_id name email");

    res.status(200).json({
      count: members.length,
      members,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};