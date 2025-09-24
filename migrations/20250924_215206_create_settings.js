/**
 * Migration: create_settings
 * Created: 2025-09-24T21:52:06.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_settings');
  
  const settings = mongoose.connection.db.collection('settings');
  
  // Create a unique index on a constant field to ensure singleton pattern
  // We'll add a 'type' field with value 'app_settings' to make it unique
  await settings.createIndex({ type: 1 }, { unique: true });
  
  // Check if settings already exist
  const existingSettings = await settings.findOne();
  if (existingSettings) {
    console.log('Settings already exist, skipping initialization');
    return;
  }
  
  // Insert default settings
  const defaultSettings = {
    type: 'app_settings', // Constant field for singleton pattern
    cleaningStartTime: 8, // 8 AM
    cleaningEndTime: 18,  // 6 PM
    cleaningTimeInterval: 30, // 30 minutes
    maintenanceStartTime: 9, // 9 AM
    maintenanceEndTime: 17,  // 5 PM
    maintenanceTimeInterval: 30, // 30 minutes
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await settings.insertOne(defaultSettings);
  
  console.log('✅ Created settings collection with default values');
  console.log('Migration create_settings completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_settings');
  
  // Drop the collection
  await mongoose.connection.db.dropCollection('settings');
  
  console.log('🗑️  Dropped settings collection');
  console.log('Rollback create_settings completed');
}

module.exports = { up, down };
