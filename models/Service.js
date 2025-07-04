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

// Virtuals for dynamic capacity calculation (backward compatible names only)
serviceSchema.virtual('CAPA_ARCHI').get(async function() {
  const Lit = mongoose.model('Lit');
  return await Lit.countDocuments({ ID_SERVICE: this.ID_SERVICE });
});

serviceSchema.virtual('CAPA_REELLE').get(async function() {
  const Lit = mongoose.model('Lit');
  return await Lit.countDocuments({ ID_SERVICE: this.ID_SERVICE, ID_STATUT: 1 });
});

module.exports = mongoose.model('Service', serviceSchema); 