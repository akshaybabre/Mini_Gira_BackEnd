const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamProjects,
} = require("../controllers/TeamsController");


/* =========================
   TEAM ROUTES
========================= */

// Create Team
router.post("/create", authMiddleware, createTeam);

// Get all teams of logged in user
router.get("/myteams", authMiddleware, getMyTeams);

// Get single team
router.get("/:id", authMiddleware, getTeamById);

// Update team
router.put("/update/:id", authMiddleware, updateTeam);

// Delete team
router.delete("/delete/:id", authMiddleware, deleteTeam);

// Get all projects assigned to this team
router.get("/:id/projects", authMiddleware, getTeamProjects);


module.exports = router;
