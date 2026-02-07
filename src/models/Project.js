const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true, // fast lookup (MG-101)
    },

    status: {
      type: String,
      enum: ["Active", "Completed", "Archived"],
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
      required: true, // admin who created project
    },
  },
  { timestamps: true }
);

// unique project key per company
projectSchema.index({ company: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Project", projectSchema);