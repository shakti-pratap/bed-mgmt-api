const fs = require('fs').promises;
const path = require('path');

class Migrator {
  constructor() {
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  // Get all migration files
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.js'))
        .sort(); // Sort to ensure chronological order
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create migrations directory if it doesn't exist
        await fs.mkdir(this.migrationsPath, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  // Get applied migrations from database
  async getAppliedMigrations() {
    const Migration = require('mongoose').model('Migration');
    const applied = await Migration.find({}).sort({ appliedAt: 1 });
    return applied.map(m => m.name);
  }

  // Get pending migrations
  async getPendingMigrations() {
    const allFiles = await this.getMigrationFiles();
    const applied = await this.getAppliedMigrations();
    
    return allFiles.filter(file => !applied.includes(file));
  }

  // Run a single migration
  async runMigration(fileName, direction = 'up') {
    const Migration = require('mongoose').model('Migration');
    const filePath = path.join(this.migrationsPath, fileName);
    
    try {
      const migration = require(filePath);
      
      if (direction === 'up') {
        console.log(`⬆️  Running migration: ${fileName}`);
        await migration.up();
        
        // Record as applied
        await Migration.create({ name: fileName });
        console.log(`✅ Completed: ${fileName}`);
      } else if (direction === 'down') {
        console.log(`⬇️  Rolling back: ${fileName}`);
        await migration.down();
        
        // Remove from applied migrations
        await Migration.deleteOne({ name: fileName });
        console.log(`✅ Rolled back: ${fileName}`);
      }
    } catch (error) {
      console.error(`❌ Error in migration ${fileName}:`, error.message);
      throw error;
    }
  }

  // Run all pending migrations
  async migrate() {
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('✨ No pending migrations');
      return;
    }

    console.log(`🚀 Running ${pending.length} migration(s)...`);
    
    for (const fileName of pending) {
      await this.runMigration(fileName, 'up');
    }
    
    console.log('🎉 All migrations completed successfully!');
  }

  // Rollback the last migration
  async rollback() {
    const applied = await this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('❌ No migrations to rollback');
      return;
    }

    const lastMigration = applied[applied.length - 1];
    console.log(`🔄 Rolling back last migration: ${lastMigration}`);
    
    await this.runMigration(lastMigration, 'down');
    console.log('✅ Rollback completed!');
  }

  // Show migration status
  async status() {
    const allFiles = await this.getMigrationFiles();
    const applied = await this.getAppliedMigrations();
    const pending = allFiles.filter(file => !applied.includes(file));

    console.log('\n📊 Migration Status:');
    console.log('==================');
    
    if (applied.length > 0) {
      console.log(`\n✅ Applied (${applied.length}):`);
      applied.forEach(file => console.log(`   ${file}`));
    }
    
    if (pending.length > 0) {
      console.log(`\n⏳ Pending (${pending.length}):`);
      pending.forEach(file => console.log(`   ${file}`));
    }
    
    if (applied.length === 0 && pending.length === 0) {
      console.log('\n📭 No migrations found');
    }
  }
}

module.exports = Migrator; 