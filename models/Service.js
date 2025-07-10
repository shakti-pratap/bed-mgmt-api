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

// Static methods for dynamic capacity calculation
serviceSchema.statics.getCapacityForService = async function(serviceId) {
  const Lit = mongoose.model('Lit');
  const beds = await Lit.find({ ID_SERVICE: serviceId });
  return {
    CAPA_ARCHI: beds.filter(b => b.ACTIF === true).length,
    CAPA_REELLE: beds.filter(b => b.ID_STATUT === 1 && b.ACTIF === true).length
  };
};

serviceSchema.statics.getCapacityForServices = async function(services) {
  const Lit = mongoose.model('Lit');
  const serviceIds = services.map(s => s.ID_SERVICE);
  const allBeds = await Lit.find({ ID_SERVICE: { $in: serviceIds } });
  
  // Group beds by service
  const bedsByService = {};
  allBeds.forEach(bed => {
    if (!bedsByService[bed.ID_SERVICE]) {
      bedsByService[bed.ID_SERVICE] = [];
    }
    bedsByService[bed.ID_SERVICE].push(bed);
  });
  
  // Add capacity to each service
  return services.map(service => {
    const beds = bedsByService[service.ID_SERVICE] || [];
    return {
      ...service.toObject(),
      CAPA_ARCHI: beds.filter(b => b.ACTIF === true).length,
      CAPA_REELLE: beds.filter(b => b.ID_STATUT === 1 && b.ACTIF === true).length
    };
  });
};

module.exports = mongoose.model('Service', serviceSchema); 