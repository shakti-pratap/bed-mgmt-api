/**
 * Migration: update_menus_add_roles
 * Created: 2025-08-04
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: update_menus_add_roles');

  const menus = mongoose.connection.db.collection('menus');

  // Define the new roles to add
  const newRoles = ["Agent d'entretien", "Responsabled'entretien"]; // <-- Replace with actual new roles

  // Update each menu document
  const result = await menus.updateMany(
    {},
    {
      $addToSet: {
        permission: { $each: newRoles },
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} menu items with new roles`);
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: update_menus_add_roles');

  const menus = mongoose.connection.db.collection('menus');

  const rolesToRemove = ["NewRole1", "NewRole2"]; // <-- Same roles

  const result = await menus.updateMany(
    {},
    {
      $pull: {
        permission: { $in: rolesToRemove },
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );

  console.log(`🗑️  Removed roles from ${result.modifiedCount} menu items`);
}

module.exports = { up, down };
