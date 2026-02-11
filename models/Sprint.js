const mongoose = require("mongoose");

const sprintSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    goal: {
      type: String,
      trim: true,
      maxlength: 500,
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

/* only one active sprint per project */
sprintSchema.index(
  { "project.id": 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "Active" } }
);

module.exports = mongoose.model("Sprint", sprintSchema);