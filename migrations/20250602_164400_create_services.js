/**
 * Migration: create_services
 * Created: 2025-06-02T16:44:00.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_services');
  
  const services = mongoose.connection.db.collection('services');
  
  // Create indexes
  await services.createIndex({ ID_SERVICE: 1 }, { unique: true });
  await services.createIndex({ ID_SECTEUR: 1 });
  await services.createIndex({ ROR: 1 });
  
  // Insert initial services
  const initialServices = [
    { 
      ID_SERVICE: 'MED-01', 
      LIB_SERVICE: 'Médecine Interne', 
      ID_SECTEUR: 1, 
      CAPA_ARCHI: 30, 
      CAPA_REELLE: 28, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SERVICE: 'MED-02', 
      LIB_SERVICE: 'Cardiologie', 
      ID_SECTEUR: 1, 
      CAPA_ARCHI: 25, 
      CAPA_REELLE: 24, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SERVICE: 'CHIR-01', 
      LIB_SERVICE: 'Chirurgie Générale', 
      ID_SECTEUR: 2, 
      CAPA_ARCHI: 20, 
      CAPA_REELLE: 18, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SERVICE: 'CHIR-02', 
      LIB_SERVICE: 'Chirurgie Orthopédique', 
      ID_SECTEUR: 2, 
      CAPA_ARCHI: 15, 
      CAPA_REELLE: 15, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SERVICE: 'URG-01', 
      LIB_SERVICE: 'Urgences Adultes', 
      ID_SECTEUR: 3, 
      CAPA_ARCHI: 12, 
      CAPA_REELLE: 10, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SERVICE: 'PED-01', 
      LIB_SERVICE: 'Pédiatrie Générale', 
      ID_SECTEUR: 4, 
      CAPA_ARCHI: 20, 
      CAPA_REELLE: 18, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      ID_SERVICE: 'MAT-01', 
      LIB_SERVICE: 'Maternité', 
      ID_SECTEUR: 5, 
      CAPA_ARCHI: 18, 
      CAPA_REELLE: 16, 
      ROR: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await services.insertMany(initialServices);
  
  console.log(`✅ Created services collection with ${initialServices.length} records`);
  console.log('Migration create_services completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_services');
  
  // Drop the collection
  await mongoose.connection.db.dropCollection('services');
  
  console.log('🗑️  Dropped services collection');
  console.log('Rollback create_services completed');
}

module.exports = { up, down }; 