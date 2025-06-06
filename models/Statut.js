const mongoose = require('mongoose');

const statutSchema = new mongoose.Schema({
  ID_STATUT: {
    type: Number,
    required: true,
    unique: true
  },
  LIB_STATUT: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'statuts'
});

module.exports = mongoose.model('Statut', statutSchema); 