const Project = require("../models/Project");

/* ---------------- CREATE PROJECT ---------------- */
exports.createProject = async (req, res) => {
  try {
    const { name, description, key, visibility, status, startDate, endDate, members, createdByName } = req.body;

    // Validation
    if (!name || name.length < 3) {
      return res.status(400).json({ message: "Project name must be at least 3 characters" });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({ message: "Description must be at least 10 characters" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and End date are required" });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    if (key) {
      const existing = await Project.findOne({ key });
      if (existing) return res.status(400).json({ message: "Project key already exists" });
    }

    const project = await Project.create({
      name,
      description,
      key,
      visibility,
      status,
      startDate,
      endDate,
      createdBy: req.user._id,
      createdByName: createdByName || req.user.name,
      members,
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });

  } catch (error) {
    console.error("Create Project Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- GET USER PROJECTS ---------------- */
exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ createdBy: userId });

    return res.status(200).json({
      count: projects.length,
      projects,
    });

  } catch (error) {
    console.error("Get User Projects Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



/* ---------------- UPDATE PROJECT ---------------- */
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only creator can update
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const allowedUpdates = [
      "name",
      "description",
      "key",
      "visibility",
      "status",
      "startDate",
      "endDate",
      "members",
      "createdByName",
      "team",
    ];

    Object.keys(req.body).forEach((field) => {
      if (allowedUpdates.includes(field)) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    return res.json({ message: "Project updated", project });

  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ---------------- DELETE PROJECT ---------------- */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await project.deleteOne();

    return res.json({ message: "Project deleted successfully" });

  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
