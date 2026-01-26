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

router.use(authMiddleware);


/* =========================
   TEAM ROUTES
========================= */

// Create Team
router.post("/create", createTeam);

// Get all teams of logged in user
router.get("/myteams", getMyTeams);

// Get single team
router.get("/:id", getTeamById);

// Update team
router.put("/update/:id", updateTeam);

// Delete team
router.delete("/delete/:id", deleteTeam);

// Get all projects assigned to this team
router.get("/:id/projects", getTeamProjects);


module.exports = router;
