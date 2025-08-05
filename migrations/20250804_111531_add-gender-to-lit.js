const mongoose = require('mongoose');

module.exports.up = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Add GENDER and CLEANING_DATE fields if they don't exist
  await Lit.updateMany(
    {
      GENDER: { $exists: false },
      CLEANING_DATE: { $exists: false }
    },
    {
      $set: {
        GENDER: '',
        CLEANING_DATE: null
      }
    }
  );

  console.log('✅ Migration complete: GENDER and CLEANING_DATE fields added');
};

module.exports.down = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Remove GENDER and CLEANING_DATE fields from all documents
  await Lit.updateMany({}, {
    $unset: {
      GENDER: "",
      CLEANING_DATE: ""
    }
  });

  console.log('✅ Rollback complete: GENDER and CLEANING_DATE fields removed');
};
