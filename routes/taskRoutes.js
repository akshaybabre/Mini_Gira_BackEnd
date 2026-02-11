const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getCompanyMembers
} = require("../controllers/taskController");

// protect all task routes
router.use(authMiddleware);

/**
 * ADMIN ROUTES
 */
router.post("/createtask", createTask);
router.put("/updatetask/:id", updateTask);
router.delete("/deletetask/:id", deleteTask);

/**
 * COMMON ROUTES (ADMIN + MEMBER)
 */
router.get("/gettask", getTasks);
router.get("/gettaskbyid/:id", getTaskById);

/**
 * MEMBER ROUTES
 */
router.patch("/updatetaskstatus/:id/status", updateTaskStatus);

router.get("/company-members", getCompanyMembers);

module.exports = router;