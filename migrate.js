#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Migrator = require('./lib/migrator');

dotenv.config();
const migrator = new Migrator();

// Migration model to track applied migrations
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now }
});

const Migration = mongoose.model('Migration', migrationSchema);

// Database connection
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  try {
    // Connect to database
    await connectDB();
    console.log('📡 Connected to database\n');

    switch (command) {
      case 'migrate':
      case 'up':
        await migrator.migrate();
        break;

      case 'rollback':
      case 'down':
        const steps = parseInt(args[1]) || 1;
        await migrator.rollback(steps);
        break;

      case 'status':
        await migrator.status();
        break;

      case 'fresh':
        await migrator.fresh();
        break;

      case 'make':
        const migrationName = args[1];
        if (!migrationName) {
          console.error('❌ Migration name is required');
          console.log('Usage: node migrate.js make <migration_name>');
          process.exit(1);
        }
        await createMigration(migrationName);
        break;

      default:
        showHelp();
        break;
    }

    console.log('\n🎯 Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

async function createMigration(name) {
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  const fileName = `${timestamp}_${name}.js`;
  const filePath = path.join(__dirname, 'migrations', fileName);

  const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

const mongoose = require('mongoose');

/**
 * Run the migration
 */
async function up() {
  console.log('Running migration: ${name}');
  
  // Add your migration logic here
  // Example:
  // const collection = mongoose.connection.db.collection('your_collection');
  // await collection.createIndex({ field: 1 });
  
  console.log('Migration ${name} completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back migration: ${name}');
  
  // Add your rollback logic here
  // Example:
  // const collection = mongoose.connection.db.collection('your_collection');
  // await collection.dropIndex({ field: 1 });
  
  console.log('Rollback ${name} completed');
}

module.exports = { up, down };
`;

  try {
    await fs.promises.writeFile(filePath, template);
    console.log(`✅ Created migration: ${fileName}`);
    console.log(`📁 Location: ${filePath}`);
  } catch (error) {
    console.error('❌ Failed to create migration:', error);
    throw error;
  }
}

function showHelp() {
  console.log(`
🏥 Hospital Bed Management - Migration Tool

Usage:
  node migrate.js [command] [options]

Commands:
  migrate, up              Run pending migrations
  rollback, down [steps]   Rollback migrations (default: 1 batch)
  status                   Show migration status
  fresh                    Drop all data and run all migrations
  make <name>              Create a new migration file

Examples:
  node migrate.js                    # Run pending migrations
  node migrate.js rollback           # Rollback last batch
  node migrate.js rollback 2         # Rollback last 2 batches
  node migrate.js status             # Show migration status
  node migrate.js fresh              # Fresh migration
  node migrate.js make create_users  # Create new migration
`);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
} 