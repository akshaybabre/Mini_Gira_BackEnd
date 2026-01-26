const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createProject,
  updateProject,
  deleteProject,
  getUserProjects, 
} = require("../controllers/projectController");
router.use(authMiddleware);

router.post("/create", createProject);
router.get("/getallprojects", getUserProjects);
router.put("/update/:id", updateProject);
router.delete("/delete/:id", deleteProject);

module.exports = router;
