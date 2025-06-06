const mongoose = require('mongoose');
const { Utilisateur } = require('../models');

module.exports = async function addPasswordToAllUsers() {
  await mongoose.connect('mongodb://localhost:27017/bed_management', { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const users = await Utilisateur.find({});
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(user.EMAIL, user.ID_UTILISATEUR, user.password);
    });
    const result = await Utilisateur.updateMany(
      {},
      { $set: { password: 'password123' } }
    );
    console.log(`Updated ${result.modifiedCount} users with default password.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  module.exports().then(() => process.exit(0));
} 