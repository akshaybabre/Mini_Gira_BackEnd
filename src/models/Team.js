const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
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
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true, // ex: FE-TEAM, API-TEAM
    },

    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active",
      index: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // admin
    },
  },
  { timestamps: true }
);

// unique team key per project
teamSchema.index({ project: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Team", teamSchema);