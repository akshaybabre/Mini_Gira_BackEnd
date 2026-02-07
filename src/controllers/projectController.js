const Project = require("../models/Project");

/**
 * @desc   Create Project
 * @route  POST /api/projects
 * @access Admin
 */
exports.createProject = async (req, res) => {
  try {
    const { name, description, key, members } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!name || !key) {
      return res.status(400).json({ message: "Name and key are required" });
    }

    // check unique key per company
    const existingProject = await Project.findOne({
      company: req.user.company,
      key: key.toUpperCase(),
    });

    if (existingProject) {
      return res
        .status(409)
        .json({ message: "Project key already exists in this company" });
    }

    const project = await Project.create({
      company: req.user.company,
      name,
      description,
      key: key.toUpperCase(),
      members: members || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc   Get All Projects (Company scoped)
 * @route  GET /api/projects
 * @access Admin
 */
exports.getAllProjects = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const projects = await Project.find({
      company: req.user.company,
    }).sort({ createdAt: -1 });

    res.status(200).json({ count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc   Get Projects Created By Logged-in Admin
 * @route  GET /api/projects/my
 * @access Admin
 */
exports.getMyProjects = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const projects = await Project.find({
      company: req.user.company,
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc   Update Project
 * @route  PUT /api/projects/:id
 * @access Admin (Creator only)
 */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // company validation
    if (project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    // creator validation
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only project creator can update this project" });
    }

    const allowedUpdates = ["name", "description", "status", "members"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc   Delete Project
 * @route  DELETE /api/projects/:id
 * @access Admin (Creator only)
 */
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: "Invalid company access" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only project creator can delete this project" });
    }

    await project.deleteOne();

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};