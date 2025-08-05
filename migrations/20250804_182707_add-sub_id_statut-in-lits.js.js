const mongoose = require('mongoose');

async function up() {
  console.log('Running migration: add_sub_id_statut_to_lits');

  const lits = mongoose.connection.db.collection('lits');

  const result = await lits.updateMany(
    {
      $or: [
        { SUB_ID_STATUT: { $exists: false } },
        { SUB_ID_STATUT: { $not: { $type: 'number' } } },
      ],
    },
    { $set: { SUB_ID_STATUT: null } }
  );

  console.log(`✅ Updated ${result.modifiedCount} lits with SUB_ID_STATUT: null`);
  console.log('Migration add_sub_id_statut_to_lits completed');
}

async function down() {
  console.log('Rolling back migration: add_sub_id_statut_to_lits');

  const lits = mongoose.connection.db.collection('lits');

  const result = await lits.updateMany(
    {},
    { $unset: { SUB_ID_STATUT: "" } }
  );

  console.log(`🗑️  Removed SUB_ID_STATUT from ${result.modifiedCount} lits`);
  console.log('Rollback add_sub_id_statut_to_lits completed');
}

module.exports = { up, down };
