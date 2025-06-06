const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  ID_UTILISATEUR: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  NOM: {
    type: String,
    required: true,
    trim: true
  },
  ROLE: {
    type: String,
    required: true,
    enum: ['Admin', 'User', 'Viewer', 'Manager'],
    default: 'User'
  },
  SERVICES_AUTORISES: [{
    type: String,
    ref: 'Service'
  }],
  ACTIF: {
    type: Boolean,
    default: true,
    required: true
  },
  EMAIL: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // Allow multiple null values
  },
  password: {
    type: String,
    required: true,
    default: 'password123',
    minlength: 6
  },
  DERNIERE_CONNEXION: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'utilisateurs'
});

// Indexes for better performance
utilisateurSchema.index({ ROLE: 1 });
utilisateurSchema.index({ ACTIF: 1 });
utilisateurSchema.index({ SERVICES_AUTORISES: 1 });

// Virtual to check if user has admin role
utilisateurSchema.virtual('isAdmin').get(function() {
  return this.ROLE === 'Admin';
});

// Method to check if user has access to a specific service
utilisateurSchema.methods.hasAccessToService = function(serviceId) {
  if (this.ROLE === 'Admin') return true;
  return this.SERVICES_AUTORISES.includes(serviceId);
};

// Method to update last login
utilisateurSchema.methods.updateLastLogin = function() {
  this.DERNIERE_CONNEXION = new Date();
  return this.save();
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema); 