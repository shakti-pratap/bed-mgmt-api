/**
 * Migration: create_services
 * Created: 2025-06-02T16:44:00.000Z
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
  
  // Read services data from JSON file
  const jsonPath = path.join(__dirname, '..', 'script', 'output', 'services.json');
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Services JSON file not found at ${jsonPath}. Please run the Excel extraction script first.`);
  }
  
  const servicesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Map the data and add timestamps
  const initialServices = servicesData.map(service => ({
    ID_SERVICE: service.ID_SERVICE,
    LIB_SERVICE: service.LIB_SERVICE,
    ID_SECTEUR: service.ID_SECTEUR,
    CAPA_ARCHI: service.CAPA_ARCHI,
    CAPA_REELLE: service.CAPA_REELLE,
    ROR: service.ROR,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

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