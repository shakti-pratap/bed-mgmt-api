const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      required: true,
      ref: "Lit",
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    taskType: {
      type: Number,
      required: true,
      ref: "Statut",
    },
    creationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    taskCategory: {
      type: Number,
      required: false,
      ref: "Statut",
    },
    taskCompletionDateTime: {
      type: Date,
      required: false,
    },
    bedFor: {
      type: String,
      required: false,
      trim: true,
    },
    gender: {
      type: String,
      required: false,
      trim: true,
    },
    isUrgent: {
      type: Boolean,
      default: false,
      required: true,
    },
    isDone: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  }
);

// Indexes for better performance
taskSchema.index({ bedId: 1 });
taskSchema.index({ taskType: 1 });
taskSchema.index({ taskCategory: 1 });
taskSchema.index({ isUrgent: 1 });
taskSchema.index({ isDone: 1 });
taskSchema.index({ creationDate: -1 }); // Most recent first
taskSchema.index({ taskCompletionDateTime: 1 });

// Compound indexes for common queries
taskSchema.index({ bedId: 1, isDone: 1 });
taskSchema.index({ taskType: 1, isDone: 1 });
taskSchema.index({ isUrgent: 1, isDone: 1 });
taskSchema.index({ serviceName: 1, isDone: 1 });

module.exports = mongoose.model("Task", taskSchema);
