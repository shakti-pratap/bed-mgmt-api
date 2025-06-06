const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  batch: {
    type: Number,
    required: true
  }
}, {
  collection: 'migrations'
});

// Indexes for better performance
migrationSchema.index({ batch: 1 });
migrationSchema.index({ appliedAt: -1 });

module.exports = mongoose.model('Migration', migrationSchema); 