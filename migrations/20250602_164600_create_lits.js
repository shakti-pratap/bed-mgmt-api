/**
 * Migration: create_lits
 * Created: 2025-06-02T16:46:00.000Z
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
  
  // Read beds data from JSON file
  const jsonPath = path.join(__dirname, '..', 'script', 'output', 'beds.json');
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Beds JSON file not found at ${jsonPath}. Please run the Excel extraction script first.`);
  }
  
  const bedsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Map the data and add timestamps
  const initialLits = bedsData.map(bed => ({
    ID_LIT: bed.ID_LIT,
    ID_SERVICE: bed.ID_SERVICE,
    ID_STATUT: bed.ID_STATUT,
    MAJ_STATUT: new Date(bed.MAJ_STATUT),
    ACTIF: bed.ACTIF,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

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