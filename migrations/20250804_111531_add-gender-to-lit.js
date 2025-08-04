// migrations/20250804_add-gender-to-lit.js
const mongoose = require('mongoose');
require('dotenv').config(); // If using .env

module.exports.up = async function () {
  await mongoose.connect(process.env.MONGODB_URI);

  const Lit = mongoose.connection.collection('lits');

  // Update all existing documents: add GENDER field with default ''
  await Lit.updateMany(
    { GENDER: { $exists: false } },
    { $set: { GENDER: '' } }
  );

  console.log('Migration complete: GENDER added with default value ""');
  await mongoose.disconnect();
};

module.exports.down = async function () {
  await mongoose.connect(process.env.MONGO_URI);

  const Lit = mongoose.connection.collection('lits');

  // Rollback: remove GENDER field
  await Lit.updateMany({}, { $unset: { GENDER: "" } });

  console.log('Rollback complete: GENDER field removed');
  await mongoose.disconnect();
};
