const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createSprint,
  getSprints,
  getSprintById,
  updateSprint,
  completeSprint,
  deleteSprint,
} = require("../controllers/sprintController");

// protect all sprint routes
router.use(authMiddleware);

/**
 * ADMIN
 */
router.post("/createsprint", createSprint);
router.put("/updatesprint/:id", updateSprint);
router.patch("/completesprint/:id/complete", completeSprint);
router.delete("/deletesprint/:id", deleteSprint);

/**
 * ADMIN + MEMBER (READ ONLY)
 */
router.get("/getsprint", getSprints);
router.get("/getsprintbyid/:id", getSprintById);

module.exports = router;