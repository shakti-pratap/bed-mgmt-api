/**
 * Migration: create_secteurs
 * Created: 2025-06-02T16:42:00.000Z
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_secteurs');
  
  const secteurs = mongoose.connection.db.collection('secteurs');
  
  // Create indexes
  await secteurs.createIndex({ ID_SECTEUR: 1 }, { unique: true });
  await secteurs.createIndex({ ABR_SECTEUR: 1 }, { unique: true });
  
  // Read secteurs data from JSON file
  const jsonPath = path.join(__dirname, '..', 'script', 'output', 'secteurs.json');
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Secteurs JSON file not found at ${jsonPath}. Please run the Excel extraction script first.`);
  }
  
  const secteursData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Map the data and add timestamps
  const initialSecteurs = secteursData.map(secteur => ({
    ID_SECTEUR: secteur.ID_SECTEUR,
    LIB_SECTEUR: secteur.LIB_SECTEUR,
    ABR_SECTEUR: secteur.ABR_SECTEUR,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

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