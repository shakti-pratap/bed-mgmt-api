// Export all models for easy importing
const Secteur = require('./Secteur');
const Statut = require('./Statut');
const Service = require('./Service');
const Lit = require('./Lit');
const Utilisateur = require('./Utilisateur');
const HistoriqueStatut = require('./HistoriqueStatut');
const Migration = require('./Migration');

module.exports = {
  Secteur,
  Statut,
  Service,
  Lit,
  Utilisateur,
  HistoriqueStatut,
  Migration
}; 