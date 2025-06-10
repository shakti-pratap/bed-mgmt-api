const mongoose = require('mongoose');

const historiqueStatutSchema = new mongoose.Schema({
  ID_HIST: {
    type: Number,
    required: true,
    unique: true
  },
  ID_LIT: {
    type: String,
    required: true
  },
  ID_SERVICE: {
    type: String,
    required: true
  },
  ID_STATUT: {
    type: Number,
    required: true
  },
  DATE_HEURE: {
    type: Date,
    default: Date.now,
    required: true
  },
  AUTEUR: {
    type: String
  },
  STATUT_PRECEDENT: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'historique_statuts'
});

// Indexes for performance optimization
historiqueStatutSchema.index({ ID_LIT: 1 });
historiqueStatutSchema.index({ ID_SERVICE: 1 });
historiqueStatutSchema.index({ DATE_HEURE: -1 });
historiqueStatutSchema.index({ AUTEUR: 1 });
historiqueStatutSchema.index({ ID_STATUT: 1 });

// Compound indexes for common queries
historiqueStatutSchema.index({ ID_LIT: 1, DATE_HEURE: -1 });
historiqueStatutSchema.index({ ID_LIT: 1, ID_STATUT: 1 });
historiqueStatutSchema.index({ ID_SERVICE: 1, DATE_HEURE: -1 });
historiqueStatutSchema.index({ AUTEUR: 1, DATE_HEURE: -1 });

// Static method to create a new history record
historiqueStatutSchema.statics.createHistory = async function(data) {
  try {
    // Get the next ID_HIST
    const counter = await mongoose.connection.db.collection('counters').findOneAndUpdate(
      { _id: 'historique_statut_id' },
      { $inc: { seq: 1 } },
      { 
        upsert: true,
        returnDocument: 'after',
        new: true
      }
    );

    if (!counter || !counter.seq) {
      throw new Error('Failed to generate ID_HIST');
    }

    // Create the history record with the generated ID
    const historyRecord = new this({
      ID_HIST: counter.seq,
      ...data,
      ID_STATUT: Number(data.ID_STATUT),
      STATUT_PRECEDENT: Number(data.STATUT_PRECEDENT)
    });

    return await historyRecord.save();
  } catch (error) {
    console.error('Error creating history record:', error);
    throw error;
  }
};

// Static method to get bed status history
historiqueStatutSchema.statics.getBedHistory = function (bedId, limit = 50) {
  return this.find({ ID_LIT: bedId })
    .sort({ DATE_HEURE: -1 })
    .limit(limit);
};

// Static method to get user activity history
historiqueStatutSchema.statics.getUserActivity = function (userId, limit = 100) {
  return this.find({ AUTEUR: userId })
    .sort({ DATE_HEURE: -1 })
    .limit(limit);
};

module.exports = mongoose.model('HistoriqueStatut', historiqueStatutSchema); 