/**
 * Migration: seed_menus
 * Created: 2025-06-02T22:00:00.000Z
 */

const mongoose = require("mongoose");

/**
 * Run the migration
 */
async function up() {
  console.log("Running migration: seed_menus");

  const menus = mongoose.connection.db.collection("menus");

  // Create indexes
  await menus.createIndex({ path: 1 }, { unique: true });
  await menus.createIndex({ sortOrder: 1 });

  // Clear existing menus for idempotency
  await menus.deleteMany({});

  const menuData = [
    {
      path: "/global-view",
      title: "Global View",
      icon: "LayoutDashboard",
      permission: ["Admin", "User", "Viewer", "Manager"],
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      path: "/sectorview",
      title: "Sectors",
      icon: "Factory",
      permission: ["Admin", "User", "Viewer", "Manager"],
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      path: "/services",
      title: "Services",
      icon: "Cross",
      permission: ["Admin", "User", "Viewer", "Manager"],
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      path: "/logs",
      title: "History Logs",
      icon: "Logs",
      permission: [
        "Admin",
        "User",
        "Viewer",
        "Manager",
        "Agent d'entretien",
        "Responsabled'entretien",
        "Agent technique",
        "Responsable technique",
      ],
      sortOrder: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      path: "/todo",
      title: "ToDo Cleaner",
      icon: "ListTodo",
      permission: [
        "Agent d'entretien",
        "Responsabled'entretien",
      ],
      sortOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      path: "/maintenance",
      title: "Maintenance",
      icon: "WrenchIcon",
      permission: [
        "Agent technique",
        "Responsable technique",
      ],
      sortOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await menus.insertMany(menuData);

  console.log(`✅ Created menus collection with ${menuData.length} records`);
  console.log("Migration seed_menus completed");
}

/**
 * Rollback the migration
 */
async function down() {
  console.log("Rolling back migration: seed_menus");

  // Drop the collection
  await mongoose.connection.db.dropCollection("menus");

  console.log("🗑️  Dropped menus collection");
  console.log("Rollback seed_menus completed");
}

module.exports = { up, down };
