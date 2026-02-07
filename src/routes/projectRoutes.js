const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createProject,
  getAllProjects,
  getMyProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// protect all project routes
router.use(authMiddleware);

// Create project
router.post("/createproject", createProject);

// Get all company projects (admin only)
router.get("/getallprojects", getAllProjects);

// Get projects created by logged-in admin
router.get("/getadminprojects/my", getMyProjects);

// Update project
router.put("/updateproject/:id", updateProject);

// Delete project
router.delete("/deleteproject/:id", deleteProject);

module.exports = router;