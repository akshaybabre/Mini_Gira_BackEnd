const mongoose = require("mongoose");

const sprintSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100, // e.g. Sprint 1, Sprint Q1-Week2
    },

    goal: {
      type: String,
      trim: true,
      maxlength: 500, // sprint objective
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["Planned", "Active", "Completed"],
      default: "Planned",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // admin
    },
  },
  { timestamps: true }
);

/**
 * Business constraint:
 * Only one ACTIVE sprint per project
 */
sprintSchema.index(
  { project: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Active" },
  }
);

module.exports = mongoose.model("Sprint", sprintSchema);