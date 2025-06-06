/**
 * Migration: create_lits
 * Created: 2025-06-02T16:46:00.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_lits');
  
  const lits = mongoose.connection.db.collection('lits');
  
  // Create indexes
  await lits.createIndex({ ID_LIT: 1 }, { unique: true });
  await lits.createIndex({ ID_SERVICE: 1 });
  await lits.createIndex({ ID_STATUT: 1 });
  await lits.createIndex({ ACTIF: 1 });
  await lits.createIndex({ MAJ_STATUT: -1 }); // Most recent first
  await lits.createIndex({ ID_SERVICE: 1, ACTIF: 1 }); // Compound index
  await lits.createIndex({ ID_SERVICE: 1, ID_STATUT: 1 }); // Compound index
  
  // Get services to create beds for
  const services = await mongoose.connection.db.collection('services').find({}).toArray();
  
  const initialLits = [];
  
  // Create beds for each service
  services.forEach(service => {
    const bedsCount = Math.min(5, service.CAPA_REELLE); // Limit to 5 beds per service for demo
    
    for (let i = 1; i <= bedsCount; i++) {
      initialLits.push({
        ID_LIT: `${service.ID_SERVICE}-${i.toString().padStart(2, '0')}`,
        ID_SERVICE: service.ID_SERVICE,
        ID_STATUT: Math.floor(Math.random() * 3) + 1, // Random status 1-3 (Libre, Occupé, À nettoyer)
        MAJ_STATUT: new Date(),
        ACTIF: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  });

  if (initialLits.length > 0) {
    await lits.insertMany(initialLits);
  }
  
  console.log(`✅ Created lits collection with ${initialLits.length} records`);
  console.log('Migration create_lits completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_lits');
  
  // Drop the collection
  await mongoose.connection.db.dropCollection('lits');
  
  console.log('🗑️  Dropped lits collection');
  console.log('Rollback create_lits completed');
}

module.exports = { up, down }; 