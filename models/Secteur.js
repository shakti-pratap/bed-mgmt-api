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

// Virtuals for dynamic capacity calculation
secteurSchema.virtual('CAPACITE_TOTALE').get(async function() {
  const Service = mongoose.model('Service');
  const Lit = mongoose.model('Lit');
  
  // Get all services in this sector
  const services = await Service.find({ ID_SECTEUR: this.ID_SECTEUR });
  const serviceIds = services.map(s => s.ID_SERVICE);
  
  // Count all beds in these services
  return await Lit.countDocuments({ ID_SERVICE: { $in: serviceIds } });
});

secteurSchema.virtual('CAPACITE_DISPONIBLE').get(async function() {
  const Service = mongoose.model('Service');
  const Lit = mongoose.model('Lit');
  
  // Get all services in this sector
  const services = await Service.find({ ID_SECTEUR: this.ID_SECTEUR });
  const serviceIds = services.map(s => s.ID_SERVICE);
  
  // Count available beds (status 'Libre') in these services
  return await Lit.countDocuments({ 
    ID_SERVICE: { $in: serviceIds }, 
    ID_STATUT: 1 
  });
});

module.exports = mongoose.model('Secteur', secteurSchema); 