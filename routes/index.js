const express = require('express');
const router = express.Router();

// Import route modules
const secteursRoutes = require('./secteurs');
const servicesRoutes = require('./services');
const litsRoutes = require('./lits');
const statutsRoutes = require('./statuts');
const dashboardRoutes = require('./dashboard');
const docsRoutes = require('./docs');
const utilisateursRoutes = require('./utilisateurs');
const menusRoutes = require('./menus');
const tasksRoutes = require('./tasks');
const settingsRoutes = require('./settings');

// Root route redirects to documentation
router.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// Mount routes
router.use('/secteurs', secteursRoutes);
router.use('/services', servicesRoutes);
router.use('/lits', litsRoutes);
router.use('/statuts', statutsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/docs', docsRoutes);
router.use('/utilisateurs', utilisateursRoutes);
router.use('/menus', menusRoutes);
router.use('/tasks', tasksRoutes);
router.use('/settings', settingsRoutes);

module.exports = router; 