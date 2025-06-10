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

// Method to update available bed count (CAPA_REELLE)
serviceSchema.methods.updateAvailableBeds = async function() {
  const Lit = mongoose.model('Lit');
  const availableCount = await Lit.countDocuments({
    ID_SERVICE: this.ID_SERVICE,
    ACTIF: true,
    ID_STATUT: 1 // Only "Libre" beds are available
  });
  
  this.CAPA_REELLE = availableCount;
  await this.save();
  return availableCount;
};

// Static method to update all services' available bed counts
serviceSchema.statics.updateAllAvailableBeds = async function() {
  const Lit = mongoose.model('Lit');
  const services = await this.find({});
  
  for (const service of services) {
    await service.updateAvailableBeds();
  }
  
  console.log(`Updated available bed counts for ${services.length} services`);
};

// Virtual for occupancy rate
serviceSchema.virtual('TAUX_OCCUPATION').get(function() {
  if (this.CAPA_ARCHI === 0) return 0;
  const occupied = this.CAPA_ARCHI - this.CAPA_REELLE;
  return Math.round((occupied / this.CAPA_ARCHI) * 100);
});

module.exports = mongoose.model('Service', serviceSchema); 