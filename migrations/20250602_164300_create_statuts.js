/**
 * Migration: create_statuts
 * Created: 2025-06-02T16:43:00.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_statuts');
  
  const statuts = mongoose.connection.db.collection('statuts');
  
  // Create indexes
  await statuts.createIndex({ ID_STATUT: 1 }, { unique: true });
  
  // Insert initial status types
  const initialStatuts = [
    { 
      ID_STATUT: 1, 
      LIB_STATUT: 'Libre',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_STATUT: 2, 
      LIB_STATUT: 'Occupé',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_STATUT: 3, 
      LIB_STATUT: 'À nettoyer',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_STATUT: 4, 
      LIB_STATUT: 'En maintenance',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_STATUT: 5, 
      LIB_STATUT: 'Hors service',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_STATUT: 6, 
      LIB_STATUT: 'Réservé',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await statuts.insertMany(initialStatuts);
  
  console.log(`✅ Created statuts collection with ${initialStatuts.length} records`);
  console.log('Migration create_statuts completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_statuts');
  
  // Drop the collection
  await mongoose.connection.db.dropCollection('statuts');
  
  console.log('🗑️  Dropped statuts collection');
  console.log('Rollback create_statuts completed');
}

module.exports = { up, down }; 