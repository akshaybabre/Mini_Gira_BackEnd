const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamsController");

// protect all team routes
router.use(authMiddleware);

// Create team
router.post("/createteam", createTeam);

// Get my teams (admin/member)
router.get("/getteams", getMyTeams);

// Get team by id
router.get("/getteamsbyid/:id", getTeamById);

// Update team
router.put("/updateteam/:id", updateTeam);

// Delete team
router.delete("/deleteteam/:id", deleteTeam);

module.exports = router;