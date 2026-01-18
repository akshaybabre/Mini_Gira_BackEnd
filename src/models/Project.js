const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      trim: true,
    },
    key: {
      type: String,
      uppercase: true,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Archived"],
      default: "Active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
