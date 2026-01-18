const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createProject,
  updateProject,
  deleteProject,
  getUserProjects, 
} = require("../controllers/projectController");

router.post("/create", authMiddleware, createProject);
router.get("/getallprojects", authMiddleware, getUserProjects);
router.put("/update/:id", authMiddleware, updateProject);
router.delete("/delete/:id", authMiddleware, deleteProject);

module.exports = router;
