/**
 * Migration: create_utilisateurs
 * Created: 2025-06-02T16:45:00.000Z
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: create_utilisateurs');
  
  const utilisateurs = mongoose.connection.db.collection('utilisateurs');
  
  // Create indexes
  await utilisateurs.createIndex({ ID_UTILISATEUR: 1 }, { unique: true });
  await utilisateurs.createIndex({ EMAIL: 1 }, { unique: true, sparse: true });
  await utilisateurs.createIndex({ ROLE: 1 });
  await utilisateurs.createIndex({ ACTIF: 1 });
  await utilisateurs.createIndex({ SERVICES_AUTORISES: 1 });
  
  // Insert initial users
  const initialUsers = [
    {
      ID_UTILISATEUR: 'admin001',
      NOM: 'Administrateur Système',
      ROLE: 'Admin',
      EMAIL: 'admin@hospital.com',
      SERVICES_AUTORISES: ['MED-01', 'MED-02', 'CHIR-01', 'CHIR-02', 'URG-01', 'PED-01', 'MAT-01'],
      ACTIF: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      ID_UTILISATEUR: 'inf001',
      NOM: 'Marie Dupont',
      ROLE: 'User',
      EMAIL: 'marie.dupont@hospital.com',
      SERVICES_AUTORISES: ['MED-01', 'MED-02'],
      ACTIF: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      ID_UTILISATEUR: 'inf002',
      NOM: 'Pierre Martin',
      ROLE: 'User',
      EMAIL: 'pierre.martin@hospital.com',
      SERVICES_AUTORISES: ['CHIR-01', 'CHIR-02'],
      ACTIF: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      ID_UTILISATEUR: 'sup001',
      NOM: 'Dr. Sophie Lemoine',
      ROLE: 'Manager',
      EMAIL: 'sophie.lemoine@hospital.com',
      SERVICES_AUTORISES: ['MED-01', 'MED-02', 'PED-01'],
      ACTIF: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await utilisateurs.insertMany(initialUsers);
  
  console.log(`✅ Created utilisateurs collection with ${initialUsers.length} records`);
  console.log('Migration create_utilisateurs completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: create_utilisateurs');
  
  // Drop the collection
  await mongoose.connection.db.dropCollection('utilisateurs');
  
  console.log('🗑️  Dropped utilisateurs collection');
  console.log('Rollback create_utilisateurs completed');
}

module.exports = { up, down }; 