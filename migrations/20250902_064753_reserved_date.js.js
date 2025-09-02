// migrations/20250804_add-cleaning-date-to-lit.js
const mongoose = require('mongoose');

module.exports.up = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Add MAINTENANCE_DATE field (null) only to documents that don't have it
  await Lit.updateMany(
    { RESERVED_DATE: { $exists: false } },
    { $set: { RESERVED_DATE: null } }
  );

  console.log('✅ Migration complete: MAINTENANCE_DATE added where missing');
};

module.exports.down = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Remove MAINTENANCE_DATE field from all documents
  await Lit.updateMany({}, { $unset: { RESERVED_DATE: "" } });

  console.log('✅ Rollback complete: MAINTENANCE_DATE field removed');
};
