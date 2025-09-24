const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Type field for singleton pattern
  type: {
    type: String,
    required: true,
    default: 'app_settings',
    unique: true
  },
  // Cleaning time settings
  cleaningStartTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    default: 8 // 8 AM
  },
  cleaningEndTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    default: 18 // 6 PM
  },
  cleaningTimeInterval: {
    type: Number,
    required: true,
    enum: [15, 30, 45, 60],
    default: 30 // 30 minutes
  },
  
  // Maintenance time settings
  maintenanceStartTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    default: 9 // 9 AM
  },
  maintenanceEndTime: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
    default: 17 // 5 PM
  },
  maintenanceTimeInterval: {
    type: Number,
    required: true,
    enum: [15, 30, 45, 60],
    default: 30 // 30 minutes
  }
}, {
  timestamps: true,
  collection: 'settings'
});

// Ensure only one settings document exists
settingsSchema.index({ type: 1 }, { unique: true });

// Validation to ensure start time is before end time
settingsSchema.pre('save', function(next) {
  if (this.cleaningStartTime >= this.cleaningEndTime) {
    return next(new Error('Cleaning start time must be before cleaning end time'));
  }
  if (this.maintenanceStartTime >= this.maintenanceEndTime) {
    return next(new Error('Maintenance start time must be before maintenance end time'));
  }
  next();
});

// Static method to get current settings (creates default if none exist)
settingsSchema.statics.getCurrentSettings = async function() {
  let settings = await this.findOne({ type: 'app_settings' });
  if (!settings) {
    settings = new this({ type: 'app_settings' });
    await settings.save();
  }
  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updateData) {
  let settings = await this.findOne({ type: 'app_settings' });
  if (!settings) {
    settings = new this({ type: 'app_settings', ...updateData });
  } else {
    Object.assign(settings, updateData);
  }
  return await settings.save();
};

module.exports = mongoose.model('Settings', settingsSchema);
