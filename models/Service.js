const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  ID_SERVICE: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  LIB_SERVICE: {
    type: String,
    required: true,
    trim: true
  },
  ID_SECTEUR: {
    type: Number,
    required: true,
    ref: 'Secteur'
  },
  CAPA_ARCHI: {
    type: Number,
    required: true,
    min: 0
  },
  CAPA_REELLE: {
    type: Number,
    required: true,
    min: 0
  },
  ROR: {
    type: Boolean,
    default: true,
    required: true
  }
}, {
  timestamps: true,
  collection: 'services'
});

// Indexes for better performance
serviceSchema.index({ ID_SECTEUR: 1 });
serviceSchema.index({ ROR: 1 });

// Virtual for available capacity
serviceSchema.virtual('CAPA_DISPONIBLE').get(function() {
  return this.CAPA_REELLE;
});

module.exports = mongoose.model('Service', serviceSchema); 