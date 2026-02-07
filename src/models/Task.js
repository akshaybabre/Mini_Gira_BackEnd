const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    company: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },

    project: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },

    team: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["Todo", "In_Progress", "Blocked", "Completed"],
      default: "Todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    assignedTo: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
      },
    },

    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
    },

    createdBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

/* ===== INDEXES ===== */
taskSchema.index({ "company.id": 1 });
taskSchema.index({ "project.id": 1 });
taskSchema.index({ "team.id": 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });

module.exports = mongoose.model("Task", taskSchema);