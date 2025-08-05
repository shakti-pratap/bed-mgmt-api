/**
 * Migration: update_sub_id_statut_null
 * Created: 2025-08-04
 */

const mongoose = require('mongoose');

async function up() {
  console.log('Running migration: update_sub_id_statut_null');

  const lits = mongoose.connection.db.collection('lits');

  // Set SUB_ID_STATUT to null only if it is missing or an empty string
  const result = await lits.updateMany(
    {
      $or: [
        { SUB_ID_STATUT: { $exists: false } },
        { SUB_ID_STATUT: "" }
      ]
    },
    { $set: { SUB_ID_STATUT: null } }
  );

  console.log(`✅ Updated ${result.modifiedCount} lits with SUB_ID_STATUT: null`);
  console.log('Migration update_sub_id_statut_null completed');
}

async function down() {
  console.log('Rolling back migration: update_sub_id_statut_null');

  const lits = mongoose.connection.db.collection('lits');

  // Optionally revert null back to empty string
  const result = await lits.updateMany(
    { SUB_ID_STATUT: null },
    { $set: { SUB_ID_STATUT: "" } }
  );

  console.log(`↩️ Reverted ${result.modifiedCount} lits from null to ""`);
  console.log('Rollback update_sub_id_statut_null completed');
}

module.exports = { up, down };
