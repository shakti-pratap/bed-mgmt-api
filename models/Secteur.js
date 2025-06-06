const mongoose = require('mongoose');

const secteurSchema = new mongoose.Schema({
  ID_SECTEUR: {
    type: Number,
    required: true,
    unique: true
  },
  LIB_SECTEUR: {
    type: String,
    required: true,
    trim: true
  },
  ABR_SECTEUR: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true,
  collection: 'secteurs'
});

// Index for better performance
secteurSchema.index({ ABR_SECTEUR: 1 });

module.exports = mongoose.model('Secteur', secteurSchema); 