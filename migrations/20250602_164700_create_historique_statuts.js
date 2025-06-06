/**
 * Migration: create_historique_statuts
 * Created: 2025-06-02T16:47:00.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_historique_statuts');
  
  const historiqueStatuts = mongoose.connection.db.collection('historique_statuts');
  
  // Create indexes for performance optimization
  await historiqueStatuts.createIndex({ ID_HIST: 1 }, { unique: true });
  await historiqueStatuts.createIndex({ ID_LIT: 1 });
  await historiqueStatuts.createIndex({ DATE_HEURE: -1 }); // Most recent first
  await historiqueStatuts.createIndex({ AUTEUR: 1 });
  await historiqueStatuts.createIndex({ ID_STATUT: 1 });
  
  // Compound indexes for common queries
  await historiqueStatuts.createIndex({ ID_LIT: 1, DATE_HEURE: -1 });
  await historiqueStatuts.createIndex({ ID_LIT: 1, ID_STATUT: 1 });
  await historiqueStatuts.createIndex({ AUTEUR: 1, DATE_HEURE: -1 });
  
  console.log('✅ Created historique_statuts collection with indexes');
  console.log('Migration create_historique_statuts completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_historique_statuts');
  
  // Drop the collection
  try {
    await mongoose.connection.db.dropCollection('historique_statuts');
    console.log('🗑️  Dropped historique_statuts collection');
  } catch (error) {
    if (error.code === 26) {
      console.log('⚠️  Collection historique_statuts does not exist');
    } else {
      throw error;
    }
  }
  
  console.log('Rollback create_historique_statuts completed');
}

module.exports = { up, down }; 