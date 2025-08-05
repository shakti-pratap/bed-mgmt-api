// migrations/20250804_add-gender-to-lit.js
const mongoose = require('mongoose');

module.exports.up = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Add GENDER field to all documents that don't have it
  await Lit.updateMany(
    { GENDER: { $exists: false } },
    { $set: { GENDER: '' } }
  );

  console.log('✅ Migration complete: GENDER added with default value ""');
};

module.exports.down = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Remove GENDER field from all documents
  await Lit.updateMany({}, { $unset: { GENDER: "" } });

  console.log('✅ Rollback complete: GENDER field removed');
};
