const mongoose = require('mongoose');
const Menu = require('../models/Menu');

const menus = [
  { path: '/global-view', title: 'Global View', icon: 'layout-dashboard', permission: ['Admin', 'User', 'Viewer', 'Manager'], sortOrder: 1 },
  { path: '/sectorview', title: 'Sectors', icon: 'factory', permission: ['Admin', 'User', 'Viewer', 'Manager'], sortOrder: 2 },
  { path: '/services', title: 'Services', icon: 'cross', permission: ['Admin', 'User', 'Viewer', 'Manager'], sortOrder: 3 },
  { path: '/log-journal', title: 'Log Journal', icon: 'cross', permission: ['Admin', 'User', 'Viewer', 'Manager'], sortOrder: 4 },
  { path: '/backoffice', title: 'Back Office', icon: 'settings', permission: ['Admin', 'User', 'Viewer', 'Manager'], sortOrder: 5 },
];

module.exports = async function seedMenus() {
  await mongoose.connect('mongodb://localhost:27017/bed_management', { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await Menu.deleteMany({}); // Clear existing menus for idempotency
    const result = await Menu.insertMany(menus);
    console.log(`Seeded ${result.length} menu items.`);
  } catch (error) {
    console.error('Menu seeding failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  module.exports().then(() => process.exit(0));
} 