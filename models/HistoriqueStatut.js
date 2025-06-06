const mongoose = require('mongoose');

const historiqueStatutSchema = new mongoose.Schema({
  ID_HIST: {
    type: Number,
    required: true,
    unique: true
  },
  ID_LIT: {
    type: String,
    required: true,
    ref: 'Lit'
  },
  ID_STATUT: {
    type: Number,
    required: true,
    ref: 'Statut'
  },
  DATE_HEURE: {
    type: Date,
    default: Date.now,
    required: true
  },
  AUTEUR: {
    type: String,
    required: true,
    ref: 'Utilisateur'
  },
  COMMENTAIRE: {
    type: String,
    trim: true,
    maxlength: 500
  },
  STATUT_PRECEDENT: {
    type: Number,
    ref: 'Statut'
  }
}, {
  timestamps: true,
  collection: 'historique_statuts'
});

// Indexes for performance optimization
historiqueStatutSchema.index({ ID_LIT: 1 });
historiqueStatutSchema.index({ DATE_HEURE: -1 }); // Most recent first
historiqueStatutSchema.index({ AUTEUR: 1 });
historiqueStatutSchema.index({ ID_STATUT: 1 });

// Compound indexes for common queries
historiqueStatutSchema.index({ ID_LIT: 1, DATE_HEURE: -1 });
historiqueStatutSchema.index({ ID_LIT: 1, ID_STATUT: 1 });
historiqueStatutSchema.index({ AUTEUR: 1, DATE_HEURE: -1 });

// Auto-increment ID_HIST
historiqueStatutSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastRecord = await this.constructor.findOne().sort({ ID_HIST: -1 });
      this.ID_HIST = lastRecord ? lastRecord.ID_HIST + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to get bed status history
historiqueStatutSchema.statics.getBedHistory = function(bedId, limit = 50) {
  return this.find({ ID_LIT: bedId })
    .populate('ID_STATUT', 'LIB_STATUT')
    .populate('STATUT_PRECEDENT', 'LIB_STATUT')
    .populate('AUTEUR', 'NOM')
    .sort({ DATE_HEURE: -1 })
    .limit(limit);
};

// Static method to get user activity history
historiqueStatutSchema.statics.getUserActivity = function(userId, limit = 100) {
  return this.find({ AUTEUR: userId })
    .populate('ID_LIT', 'ID_LIT')
    .populate('ID_STATUT', 'LIB_STATUT')
    .sort({ DATE_HEURE: -1 })
    .limit(limit);
};

module.exports = mongoose.model('HistoriqueStatut', historiqueStatutSchema); 