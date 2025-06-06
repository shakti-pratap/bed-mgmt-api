const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  permission: {
    type: [String], // Array of roles allowed to access this menu
    required: true,
    enum: ['Admin', 'User', 'Viewer', 'Manager']
  },
  sortOrder: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'menus'
});

module.exports = mongoose.model('Menu', menuSchema); 