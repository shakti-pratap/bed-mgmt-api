/**
 * Migration: create_secteurs
 * Created: 2025-06-02T16:42:00.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_secteurs');
  
  const secteurs = mongoose.connection.db.collection('secteurs');
  
  // Create indexes
  await secteurs.createIndex({ ID_SECTEUR: 1 }, { unique: true });
  await secteurs.createIndex({ ABR_SECTEUR: 1 }, { unique: true });
  
  // Insert initial data
  const initialSecteurs = [
    { 
      ID_SECTEUR: 1, 
      LIB_SECTEUR: 'Médecine', 
      ABR_SECTEUR: 'MED',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SECTEUR: 2, 
      LIB_SECTEUR: 'Chirurgie', 
      ABR_SECTEUR: 'CHIR',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SECTEUR: 3, 
      LIB_SECTEUR: 'Urgences', 
      ABR_SECTEUR: 'URG',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SECTEUR: 4, 
      LIB_SECTEUR: 'Pédiatrie', 
      ABR_SECTEUR: 'PED',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SECTEUR: 5, 
      LIB_SECTEUR: 'Maternité', 
      ABR_SECTEUR: 'MAT',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await secteurs.insertMany(initialSecteurs);
  
  console.log(`✅ Created secteurs collection with ${initialSecteurs.length} records`);
  console.log('Migration create_secteurs completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_secteurs');
  
  // Drop the collection
  await mongoose.connection.db.dropCollection('secteurs');
  
  console.log('🗑️  Dropped secteurs collection');
  console.log('Rollback create_secteurs completed');
}

module.exports = { up, down }; 