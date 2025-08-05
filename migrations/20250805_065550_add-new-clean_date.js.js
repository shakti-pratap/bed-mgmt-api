// migrations/20250804_add-cleaning-date-to-lit.js
const mongoose = require('mongoose');

module.exports.up = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Add CLEANING_DATE field (null) only to documents that don't have it
  await Lit.updateMany(
    { CLEANING_DATE: { $exists: false } },
    { $set: { CLEANING_DATE: null } }
  );

  console.log('✅ Migration complete: CLEANING_DATE added where missing');
};

module.exports.down = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Remove CLEANING_DATE field from all documents
  await Lit.updateMany({}, { $unset: { CLEANING_DATE: "" } });

  console.log('✅ Rollback complete: CLEANING_DATE field removed');
};
