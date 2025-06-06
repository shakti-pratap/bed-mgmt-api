/**
 * Migration: add_bed_description_field
 * Created: 2025-06-02T18:17:54.456Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: add_bed_description_field');
  
  // Add your migration logic here
  // Example:
  // const collection = mongoose.connection.db.collection('your_collection');
  // await collection.createIndex({ field: 1 });
  
  console.log('Migration add_bed_description_field completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: add_bed_description_field');
  
  // Add your rollback logic here
  // Example:
  // const collection = mongoose.connection.db.collection('your_collection');
  // await collection.dropIndex({ field: 1 });
  
  console.log('Rollback add_bed_description_field completed');
}

module.exports = { up, down };
