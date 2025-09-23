const mongoose = require('mongoose');

module.exports.up = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Add isEmergency field if it doesn't exist
  await Lit.updateMany(
    {
      isEmergency: { $exists: false }
    },
    {
      $set: {
        isEmergency: false
      }
    }
  );

  console.log('✅ Migration complete: isEmergency field added to all lits documents');
};

module.exports.down = async function () {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    throw new Error("Not connected to MongoDB in migration file.");
  }

  const Lit = db.collection('lits');

  // Remove isEmergency field from all documents
  await Lit.updateMany({}, {
    $unset: {
      isEmergency: ""
    }
  });

  console.log('✅ Rollback complete: isEmergency field removed from all lits documents');
};
