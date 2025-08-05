// migrations/20250804_134500_add-extra-statuts.js

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: add-extra-statuts');

  const statuts = mongoose.connection.db.collection('statuts');

  const newStatuts = [
    {
      ID_STATUT: 7,
      LIB_STATUT: 'Nettoyage(standard)',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      ID_STATUT: 8,
      LIB_STATUT: 'Nettoyage(approfondi)',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await statuts.insertMany(newStatuts);

  console.log(`✅ Added ${newStatuts.length} new statuts`);
  console.log('Migration add-extra-statuts completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: add-extra-statuts');

  const statuts = mongoose.connection.db.collection('statuts');

  await statuts.deleteMany({
    ID_STATUT: { $in: [7, 8] }
  });

  console.log('🗑️  Removed extra statuts (ID_STATUT: 7, 8)');
  console.log('Rollback add-extra-statuts completed');
}

module.exports = { up, down };
